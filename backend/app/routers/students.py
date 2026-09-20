import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app import schemas
from app.core.config import settings
from app.core.database import get_db
from app.deps import student_only
from app.models import Attendance, Comment, Enrollment, Grade, Group, Homework, Lesson, Payment, Submission, User
from app.services import (
    average, comment_out, grade_out, last_months, month_key, month_label, payment_out,
    payment_status, rate, schedule_item, submission_out,
)

router = APIRouter(prefix="/students/me", tags=["student"])

MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def _enrollments(db: Session, student: User) -> list[Enrollment]:
    return list(
        db.scalars(
            select(Enrollment)
            .where(Enrollment.student_id == student.id, Enrollment.status != "dropped")
            .options(
                joinedload(Enrollment.group).joinedload(Group.course),
                joinedload(Enrollment.group).joinedload(Group.teacher),
            )
        ).unique()
    )


def _lessons_query(group_ids: list[int]):
    return (
        select(Lesson)
        .where(Lesson.group_id.in_(group_ids))
        .options(
            joinedload(Lesson.group).joinedload(Group.course),
            joinedload(Lesson.group).joinedload(Group.teacher),
        )
        .order_by(Lesson.starts_at)
    )


def _schedule(db: Session, group_ids: list[int], start: datetime, end: datetime) -> list[schemas.ScheduleItem]:
    if not group_ids:
        return []
    lessons = db.scalars(
        _lessons_query(group_ids).where(Lesson.starts_at >= start, Lesson.starts_at < end)
    ).unique()
    return [schedule_item(lesson) for lesson in lessons]


def _active_group_ids(enrollments: list[Enrollment]) -> list[int]:
    return [e.group_id for e in enrollments if e.status == "active"]


@router.get("/schedule", response_model=list[schemas.ScheduleItem])
def schedule(
    start: datetime | None = None,
    end: datetime | None = None,
    student: User = Depends(student_only),
    db: Session = Depends(get_db),
):
    today = date.today()
    start = start or datetime.combine(today - timedelta(days=today.weekday()), datetime.min.time())
    end = end or start + timedelta(days=7)
    return _schedule(db, _active_group_ids(_enrollments(db, student)), start, end)


def _attendance(db: Session, student: User) -> schemas.StudentAttendance:
    rows = db.execute(
        select(Attendance, Lesson, Group)
        .join(Lesson, Lesson.id == Attendance.lesson_id)
        .join(Group, Group.id == Lesson.group_id)
        .where(Attendance.student_id == student.id)
        .options(joinedload(Group.course))
        .order_by(Lesson.starts_at.desc())
    ).all()
    records = [
        schemas.AttendanceRecord(
            lesson_id=lesson.id, date=lesson.starts_at, course_name=group.course.name,
            topic=lesson.topic, status=att.status,
        )
        for att, lesson, group in rows
    ]
    by_course: dict[str, list[str]] = defaultdict(list)
    for r in records:
        by_course[r.course_name].append(r.status)
    counts = {s: sum(r.status == s for r in records) for s in ("present", "late", "absent", "excused")}
    return schemas.StudentAttendance(
        rate=rate(r.status for r in records) or 0,
        counts=counts,
        by_course=[
            schemas.AttendanceByCourse(
                course_name=name, total=len(ss), rate=rate(ss) or 0,
                **{s: ss.count(s) for s in ("present", "late", "absent", "excused")},
            )
            for name, ss in by_course.items()
        ],
        records=records,
    )


@router.get("/attendance", response_model=schemas.StudentAttendance)
def attendance(student: User = Depends(student_only), db: Session = Depends(get_db)):
    return _attendance(db, student)


def _progress(db: Session, student: User, enrollments: list[Enrollment]) -> list[schemas.CourseProgress]:
    now = datetime.now()
    result = []
    for e in enrollments:
        g = e.group
        lessons = db.scalars(select(Lesson).where(Lesson.group_id == g.id).order_by(Lesson.starts_at)).all()
        done = [lesson for lesson in lessons if lesson.starts_at < now]
        grades = db.scalars(select(Grade).where(Grade.group_id == g.id, Grade.student_id == student.id)).all()
        statuses = db.scalars(
            select(Attendance.status)
            .join(Lesson, Lesson.id == Attendance.lesson_id)
            .where(Lesson.group_id == g.id, Attendance.student_id == student.id)
        ).all()
        by_month: dict[tuple[int, int], list[int]] = defaultdict(list)
        for gr in grades:
            by_month[month_key(gr.date)].append(gr.value)
        result.append(
            schemas.CourseProgress(
                group_id=g.id,
                group_name=g.name,
                course_name=g.course.name,
                course_color=g.course.color,
                teacher_name=g.teacher.full_name,
                status=e.status,
                total_lessons=len(lessons),
                completed_lessons=len(done),
                progress=round(100 * len(done) / len(lessons), 1) if lessons else 0,
                average_grade=average(gr.value for gr in grades),
                attendance_rate=rate(statuses),
                start_date=g.start_date,
                end_date=g.end_date,
                topics=[schemas.TopicItem(topic=lsn.topic, date=lsn.starts_at, done=lsn.starts_at < now) for lsn in lessons],
                grade_trend=[
                    schemas.MonthValue(month=month_label(k), value=average(v) or 0)
                    for k, v in sorted(by_month.items())
                ],
            )
        )
    result.sort(key=lambda p: (p.status != "active", p.course_name))
    return result


@router.get("/progress", response_model=list[schemas.CourseProgress])
def progress(student: User = Depends(student_only), db: Session = Depends(get_db)):
    return _progress(db, student, _enrollments(db, student))


def _homework(db: Session, student: User, group_ids: list[int]) -> list[schemas.StudentHomework]:
    if not group_ids:
        return []
    now = datetime.now()
    items = db.scalars(
        select(Homework)
        .where(Homework.group_id.in_(group_ids))
        .options(joinedload(Homework.group).joinedload(Group.course), joinedload(Homework.group).joinedload(Group.teacher))
        .order_by(Homework.due_date.desc())
    ).unique()
    subs = {
        s.homework_id: s
        for s in db.scalars(select(Submission).where(Submission.student_id == student.id))
    }
    result = []
    for hw in items:
        sub = subs.get(hw.id)
        if sub:
            status = sub.status
        else:
            status = "overdue" if hw.due_date < now else "active"
        result.append(
            schemas.StudentHomework(
                id=hw.id, title=hw.title, description=hw.description,
                course_name=hw.group.course.name, course_color=hw.group.course.color,
                teacher_name=hw.group.teacher.full_name,
                created_at=hw.created_at, due_date=hw.due_date, status=status,
                submission=submission_out(sub) if sub else None,
            )
        )
    return result


@router.get("/homework", response_model=list[schemas.StudentHomework])
def homework(student: User = Depends(student_only), db: Session = Depends(get_db)):
    return _homework(db, student, [e.group_id for e in _enrollments(db, student)])


@router.post("/homework/{homework_id}/submit", response_model=schemas.StudentHomework)
async def submit_homework(
    homework_id: int,
    text: str = Form(""),
    file: UploadFile | None = File(None),
    student: User = Depends(student_only),
    db: Session = Depends(get_db),
):
    group_ids = [e.group_id for e in _enrollments(db, student)]
    hw = db.get(Homework, homework_id)
    if not hw or hw.group_id not in group_ids:
        raise HTTPException(404, "Задание не найдено")
    if not text.strip() and not (file and file.filename):
        raise HTTPException(422, "Добавьте ответ или файл")

    sub = db.scalar(select(Submission).where(Submission.homework_id == hw.id, Submission.student_id == student.id))
    if sub and sub.status == "reviewed":
        raise HTTPException(400, "Работа уже проверена")

    stored_name = original_name = None
    if file and file.filename:
        content = await file.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(413, "Файл больше 10 МБ")
        original_name = Path(file.filename).name
        stored_name = f"{uuid.uuid4().hex}{Path(original_name).suffix}"
        upload_dir = Path(settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)
        (upload_dir / stored_name).write_bytes(content)

    if not sub:
        sub = Submission(homework_id=hw.id, student_id=student.id)
        db.add(sub)
    sub.text = text.strip() or None
    if stored_name:
        sub.file_name, sub.file_path = original_name, stored_name
    sub.status = "submitted"
    sub.submitted_at = datetime.now()
    sub.grade = None
    sub.reviewed_at = None
    db.flush()
    # снимаем оценку за прошлую версию работы — преподаватель поставит новую
    stale = db.scalar(select(Grade).where(Grade.submission_id == sub.id))
    if stale:
        db.delete(stale)
    db.commit()
    return next(h for h in _homework(db, student, group_ids) if h.id == hw.id)


def _grades(db: Session, student: User) -> schemas.StudentGrades:
    grades = db.scalars(
        select(Grade)
        .where(Grade.student_id == student.id)
        .options(joinedload(Grade.group).joinedload(Group.course))
        .order_by(Grade.date.desc(), Grade.id.desc())
    ).all()
    by_course: dict[str, list[Grade]] = defaultdict(list)
    by_month: dict[tuple[int, int], list[int]] = defaultdict(list)
    for g in grades:
        by_course[g.group.course.name].append(g)
        by_month[month_key(g.date)].append(g.value)
    return schemas.StudentGrades(
        average=average(g.value for g in grades),
        by_course=[
            schemas.GradeByCourse(
                course_name=name, course_color=gs[0].group.course.color,
                average=average(g.value for g in gs) or 0, count=len(gs),
            )
            for name, gs in by_course.items()
        ],
        trend=[
            schemas.MonthValue(month=month_label(k), value=average(by_month[k]) or 0)
            for k in last_months(6) if by_month.get(k)
        ],
        items=[grade_out(g) for g in grades],
    )


@router.get("/grades", response_model=schemas.StudentGrades)
def grades(student: User = Depends(student_only), db: Session = Depends(get_db)):
    return _grades(db, student)


def _payments(db: Session, student: User) -> schemas.StudentPayments:
    payments = db.scalars(
        select(Payment).where(Payment.student_id == student.id)
        .options(joinedload(Payment.course)).order_by(Payment.due_date.desc())
    ).all()
    unpaid = sorted((p for p in payments if p.status != "paid"), key=lambda p: p.due_date)
    active_courses = {
        e.group.course_id: e.group.course.price for e in _enrollments(db, student) if e.status == "active"
    }
    return schemas.StudentPayments(
        status=payment_status(payments),
        total_debt=sum(p.amount for p in payments if p.status == "overdue"),
        monthly_total=sum(active_courses.values()),
        next_payment=payment_out(unpaid[0]) if unpaid else None,
        items=[payment_out(p) for p in payments],
    )


@router.get("/payments", response_model=schemas.StudentPayments)
def payments(student: User = Depends(student_only), db: Session = Depends(get_db)):
    return _payments(db, student)


@router.post("/payments/{payment_id}/pay", response_model=schemas.StudentPayments)
def pay(payment_id: int, student: User = Depends(student_only), db: Session = Depends(get_db)):
    """Демо-оплата: реальная интеграция с платёжным шлюзом подключается здесь."""
    p = db.get(Payment, payment_id)
    if not p or p.student_id != student.id:
        raise HTTPException(404, "Платёж не найден")
    if p.status != "paid":
        p.status, p.paid_at = "paid", datetime.now()
        db.commit()
    return _payments(db, student)


@router.get("/comments", response_model=list[schemas.CommentOut])
def comments(student: User = Depends(student_only), db: Session = Depends(get_db)):
    items = db.scalars(
        select(Comment).where(Comment.student_id == student.id)
        .options(joinedload(Comment.teacher), joinedload(Comment.student))
        .order_by(Comment.created_at.desc())
    ).all()
    return [comment_out(c) for c in items]


@router.get("/overview", response_model=schemas.StudentOverview)
def overview(student: User = Depends(student_only), db: Session = Depends(get_db)):
    enrollments = _enrollments(db, student)
    active_ids = _active_group_ids(enrollments)
    now = datetime.now()
    today_start = datetime.combine(date.today(), datetime.min.time())
    upcoming = _schedule(db, active_ids, now, now + timedelta(days=30))
    hw = _homework(db, student, active_ids)
    pay = _payments(db, student)
    att = _attendance(db, student)
    comments_ = db.scalars(
        select(Comment).where(Comment.student_id == student.id)
        .options(joinedload(Comment.teacher), joinedload(Comment.student))
        .order_by(Comment.created_at.desc()).limit(3)
    ).all()
    return schemas.StudentOverview(
        next_lesson=upcoming[0] if upcoming else None,
        today=_schedule(db, active_ids, today_start, today_start + timedelta(days=1)),
        attendance_rate=att.rate if att.records else None,
        average_grade=_grades(db, student).average,
        homework_due=sum(h.status in ("active", "revision") for h in hw),
        payment_status=pay.status,
        total_debt=pay.total_debt,
        courses=[p for p in _progress(db, student, enrollments) if p.status == "active"],
        recent_comments=[comment_out(c) for c in comments_],
    )
