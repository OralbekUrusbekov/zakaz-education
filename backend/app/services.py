"""Общие выборки и расчёты, которые используют несколько роутеров."""
from collections import defaultdict
from collections.abc import Iterable
from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app import schemas
from app.models import Attendance, Comment, Enrollment, Grade, Group, Lesson, Payment, Submission

MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
MONTHS_FULL = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
]
ATTENDED = ("present", "late")


def month_key(d: date | datetime) -> tuple[int, int]:
    return d.year, d.month


def month_label(key: tuple[int, int]) -> str:
    return MONTHS[key[1] - 1]


def last_months(n: int, today: date | None = None) -> list[tuple[int, int]]:
    today = today or date.today()
    y, m = today.year, today.month
    keys = []
    for _ in range(n):
        keys.append((y, m))
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    return keys[::-1]


def rate(statuses: Iterable[str]) -> float | None:
    statuses = list(statuses)
    if not statuses:
        return None
    return round(100 * sum(s in ATTENDED for s in statuses) / len(statuses), 1)


def average(values: Iterable[int | float]) -> float | None:
    values = list(values)
    return round(sum(values) / len(values), 2) if values else None


def schedule_item(lesson: Lesson) -> schemas.ScheduleItem:
    g = lesson.group
    return schemas.ScheduleItem(
        id=lesson.id,
        group_id=g.id,
        group_name=g.name,
        course_name=g.course.name,
        course_color=g.course.color,
        topic=lesson.topic,
        teacher_name=g.teacher.full_name,
        starts_at=lesson.starts_at,
        ends_at=lesson.ends_at,
        room=lesson.room,
        is_online=lesson.is_online,
    )


def comment_out(c: Comment) -> schemas.CommentOut:
    return schemas.CommentOut(
        id=c.id,
        teacher_name=c.teacher.full_name,
        student_id=c.student_id,
        student_name=c.student.full_name,
        kind=c.kind,
        text=c.text,
        created_at=c.created_at,
    )


def grade_out(g: Grade) -> schemas.GradeOut:
    return schemas.GradeOut(
        id=g.id,
        student_id=g.student_id,
        group_id=g.group_id,
        lesson_id=g.lesson_id,
        course_name=g.group.course.name,
        value=g.value,
        type=g.type,
        date=g.date,
        comment=g.comment,
    )


def file_url(sub: Submission) -> str | None:
    return f"/uploads/{sub.file_path}" if sub.file_path else None


def submission_out(sub: Submission) -> schemas.SubmissionOut:
    return schemas.SubmissionOut(
        id=sub.id,
        text=sub.text,
        file_name=sub.file_name,
        file_url=file_url(sub),
        submitted_at=sub.submitted_at,
        status=sub.status,
        grade=sub.grade,
        teacher_comment=sub.teacher_comment,
    )


def payment_out(p: Payment) -> schemas.PaymentOut:
    return schemas.PaymentOut(
        id=p.id,
        course_name=p.course.name,
        period=p.period,
        amount=p.amount,
        due_date=p.due_date,
        paid_at=p.paid_at,
        status=p.status,
    )


def payment_status(payments: Iterable[Payment]) -> str:
    statuses = {p.status for p in payments}
    if "overdue" in statuses:
        return "overdue"
    if "pending" in statuses:
        return "pending"
    return "paid"


def load_groups(db: Session, group_ids: Iterable[int]) -> list[Group]:
    ids = list(group_ids)
    if not ids:
        return []
    return list(
        db.scalars(
            select(Group)
            .where(Group.id.in_(ids))
            .options(joinedload(Group.course), joinedload(Group.teacher))
        )
    )


def attendance_by_student(db: Session, group_id: int) -> dict[int, list[str]]:
    rows = db.execute(
        select(Attendance.student_id, Attendance.status)
        .join(Lesson, Lesson.id == Attendance.lesson_id)
        .where(Lesson.group_id == group_id)
    )
    result: dict[int, list[str]] = defaultdict(list)
    for student_id, status in rows:
        result[student_id].append(status)
    return result


def grades_by_student(db: Session, group_id: int) -> dict[int, list[int]]:
    result: dict[int, list[int]] = defaultdict(list)
    for student_id, value in db.execute(
        select(Grade.student_id, Grade.value).where(Grade.group_id == group_id)
    ):
        result[student_id].append(value)
    return result


def group_stats(db: Session, group: Group) -> schemas.TeacherGroup:
    att = attendance_by_student(db, group.id)
    grades = grades_by_student(db, group.id)
    students = db.scalars(
        select(Enrollment.student_id).where(
            Enrollment.group_id == group.id, Enrollment.status != "dropped"
        )
    ).all()
    return schemas.TeacherGroup(
        id=group.id,
        name=group.name,
        course_id=group.course_id,
        course_name=group.course.name,
        course_color=group.course.color,
        students_count=len(students),
        average_grade=average(v for vs in grades.values() for v in vs),
        attendance_rate=rate(s for ss in att.values() for s in ss),
        start_date=group.start_date,
        end_date=group.end_date,
    )
