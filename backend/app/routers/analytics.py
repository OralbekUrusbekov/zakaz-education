from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app import schemas
from app.core.database import get_db
from app.deps import admin_only
from app.models import Attendance, Course, Enrollment, Grade, Group, Lesson, Payment, User
from app.services import average, last_months, month_key, month_label, rate

router = APIRouter(prefix="/analytics", tags=["admin"])

PERIOD_DAYS = {"month": 30, "quarter": 91, "year": 365}


def _delta(current: float | None, previous: float | None) -> float | None:
    if current is None or not previous:
        return None
    return round(100 * (current - previous) / previous, 1)


def _active_at(e: Enrollment, day: date) -> bool:
    if e.status == "dropped" or e.enrolled_at > day:
        return False
    return e.completed_at is None or e.completed_at > day


def _month_end(key: tuple[int, int]) -> date:
    y, m = key
    first_next = date(y + (m == 12), m % 12 + 1, 1)
    return min(first_next - timedelta(days=1), date.today())


@router.get("/dashboard", response_model=schemas.Dashboard)
def dashboard(
    period: Literal["month", "quarter", "year"] = "month",
    course_id: int | None = None,
    _: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    today = date.today()
    days = PERIOD_DAYS[period]
    cur_start, prev_start = today - timedelta(days=days), today - timedelta(days=2 * days)

    group_q = select(Group).options(joinedload(Group.course), joinedload(Group.teacher))
    if course_id:
        group_q = group_q.where(Group.course_id == course_id)
    groups = {g.id: g for g in db.scalars(group_q).unique()}
    gids = list(groups)

    enrollments = db.scalars(
        select(Enrollment).where(Enrollment.group_id.in_(gids)).options(joinedload(Enrollment.student))
    ).all() if gids else []
    att_rows = db.execute(
        select(Attendance.student_id, Attendance.status, Lesson.starts_at, Lesson.group_id)
        .join(Lesson, Lesson.id == Attendance.lesson_id).where(Lesson.group_id.in_(gids))
    ).all() if gids else []
    grade_rows = db.execute(
        select(Grade.student_id, Grade.value, Grade.date, Grade.group_id).where(Grade.group_id.in_(gids))
    ).all() if gids else []

    def students_at(day: date) -> set[int]:
        return {e.student_id for e in enrollments if e.status != "dropped" and e.enrolled_at <= day}

    def active_at(day: date) -> set[int]:
        return {e.student_id for e in enrollments if _active_at(e, day)}

    def att_between(a: date, b: date) -> float | None:
        return rate(s for _, s, t, _ in att_rows if a <= t.date() <= b)

    def grades_between(a: date, b: date) -> list[int]:
        return [v for _, v, d, _ in grade_rows if a <= d <= b]

    def graduates_between(a: date, b: date) -> int:
        return sum(1 for e in enrollments if e.status == "completed" and e.completed_at and a <= e.completed_at <= b)

    total_now, total_prev = len(students_at(today)), len(students_at(cur_start))
    active_now, active_prev = len(active_at(today)), len(active_at(cur_start))
    att_now, att_prev = att_between(cur_start, today), att_between(prev_start, cur_start)
    avg_now, avg_prev = average(grades_between(cur_start, today)), average(grades_between(prev_start, cur_start))
    grads_now, grads_prev = graduates_between(cur_start, today), graduates_between(prev_start, cur_start)

    months = last_months(12)
    att_by_month: dict[tuple[int, int], list[str]] = defaultdict(list)
    for _, s, t, _ in att_rows:
        att_by_month[month_key(t)].append(s)
    grads_by_month: dict[tuple[int, int], int] = defaultdict(int)
    for e in enrollments:
        if e.status == "completed" and e.completed_at:
            grads_by_month[month_key(e.completed_at)] += 1

    # успеваемость за выбранный период
    period_grades = [(v, gid) for _, v, d, gid in grade_rows if cur_start <= d <= today]
    by_course_grades: dict[str, list[int]] = defaultdict(list)
    for v, gid in period_grades:
        by_course_grades[groups[gid].course.name].append(v)

    # популярность курсов (за всё время)
    courses = db.scalars(select(Course).where(Course.id == course_id) if course_id else select(Course)).all()
    popularity = []
    for c in courses:
        es = [e for e in enrollments if groups[e.group_id].course_id == c.id]
        completed = sum(e.status == "completed" for e in es)
        popularity.append(
            schemas.CoursePopularity(
                course_id=c.id, course_name=c.name, category=c.category, color=c.color,
                enrolled=len(es), active=sum(e.status == "active" for e in es), completed=completed,
                completion_rate=round(100 * completed / len(es), 1) if es else 0,
            )
        )
    popularity.sort(key=lambda p: p.enrolled, reverse=True)

    # преподаватели
    running = {gid: g for gid, g in groups.items() if g.end_date >= today}
    by_teacher: dict[int, list[Group]] = defaultdict(list)
    for g in running.values():
        by_teacher[g.teacher_id].append(g)
    teachers = []
    for tid, tgroups in by_teacher.items():
        ids = {g.id for g in tgroups}
        teachers.append(
            schemas.TeacherStat(
                id=tid, full_name=tgroups[0].teacher.full_name, groups=len(tgroups),
                students=len({e.student_id for e in enrollments if e.group_id in ids and e.status == "active"}),
                average_grade=average(v for _, v, _, gid in grade_rows if gid in ids),
                attendance_rate=rate(s for _, s, _, gid in att_rows if gid in ids),
            )
        )
    teachers.sort(key=lambda t: t.students, reverse=True)

    # студенты в зоне риска
    overdue: dict[int, int] = defaultdict(int)
    for p in db.scalars(select(Payment).where(Payment.status == "overdue")):
        overdue[p.student_id] += p.amount
    att_by_sg: dict[tuple[int, int], list[str]] = defaultdict(list)
    for sid, s, _, gid in att_rows:
        att_by_sg[(sid, gid)].append(s)
    grades_by_sg: dict[tuple[int, int], list[int]] = defaultdict(list)
    for sid, v, _, gid in grade_rows:
        grades_by_sg[(sid, gid)].append(v)
    at_risk = []
    for e in enrollments:
        if e.status != "active":
            continue
        att = rate(att_by_sg[(e.student_id, e.group_id)])
        avg = average(grades_by_sg[(e.student_id, e.group_id)])
        debt = overdue.get(e.student_id, 0)
        reasons = []
        if att is not None and att < 75:
            reasons.append("Низкая посещаемость")
        if avg is not None and avg < 7:
            reasons.append("Низкая успеваемость")
        if debt:
            reasons.append("Задолженность по оплате")
        if reasons:
            at_risk.append(
                schemas.AtRiskStudent(
                    id=e.student_id, full_name=e.student.full_name, group_name=groups[e.group_id].name,
                    attendance_rate=att, average_grade=avg, debt=debt, reasons=reasons,
                )
            )
    at_risk.sort(key=lambda s: (-len(s.reasons), s.attendance_rate or 100))

    return schemas.Dashboard(
        total_students=schemas.KPI(value=total_now, delta=_delta(total_now, total_prev)),
        active_students=schemas.KPI(value=active_now, delta=_delta(active_now, active_prev)),
        attendance_rate=schemas.KPI(value=att_now or 0, delta=_delta(att_now, att_prev)),
        average_grade=schemas.KPI(value=avg_now or 0, delta=_delta(avg_now, avg_prev)),
        graduates=schemas.KPI(value=grads_now, delta=_delta(grads_now, grads_prev)),
        students_trend=[
            schemas.TrendPoint(month=month_label(k), total=len(students_at(_month_end(k))), active=len(active_at(_month_end(k))))
            for k in months
        ],
        attendance_trend=[
            schemas.MonthValue(month=month_label(k), value=rate(att_by_month[k]) or 0) for k in months if att_by_month.get(k)
        ],
        grade_distribution=[
            schemas.DistributionPoint(grade=str(v), count=sum(1 for g, _ in period_grades if g == v)) for v in range(10, 0, -1)
        ],
        course_averages=sorted(
            (schemas.CourseAverage(course_name=n, average=average(vs) or 0) for n, vs in by_course_grades.items()),
            key=lambda c: c.average, reverse=True,
        ),
        courses=popularity,
        graduates_trend=[schemas.MonthValue(month=month_label(k), value=grads_by_month.get(k, 0)) for k in months],
        teachers=teachers,
        at_risk=at_risk[:15],
    )
