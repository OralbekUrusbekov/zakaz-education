from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app import schemas
from app.core.database import get_db
from app.deps import teacher_only
from app.models import Attendance, Comment, Enrollment, Grade, Group, Homework, Lesson, Payment, Submission, User
from app.services import (
    attendance_by_student, average, comment_out, file_url, grade_out, grades_by_student,
    group_stats, payment_status, rate, schedule_item,
)

router = APIRouter(tags=["teacher"])


# ---------- helpers ----------
def _groups(db: Session, teacher: User, include_finished: bool = False) -> list[Group]:
    q = (
        select(Group).where(Group.teacher_id == teacher.id)
        .options(joinedload(Group.course), joinedload(Group.teacher))
        .order_by(Group.start_date.desc())
    )
    if not include_finished:
        q = q.where(Group.end_date >= date.today())
    return list(db.scalars(q).unique())


def own_group(db: Session, teacher: User, group_id: int) -> Group:
    group = db.get(Group, group_id)
    if not group or group.teacher_id != teacher.id:
        raise HTTPException(404, "Группа не найдена")
    return group


def _teacher_students(db: Session, teacher: User, group_id: int | None = None) -> list[schemas.TeacherStudent]:
    groups = [own_group(db, teacher, group_id)] if group_id else _groups(db, teacher)
    result = []
    for g in groups:
        enrollments = db.scalars(
            select(Enrollment).where(Enrollment.group_id == g.id, Enrollment.status != "dropped")
            .options(joinedload(Enrollment.student))
        ).all()
        att = attendance_by_student(db, g.id)
        grades = grades_by_student(db, g.id)
        student_ids = [e.student_id for e in enrollments]
        payments: dict[int, list[Payment]] = {sid: [] for sid in student_ids}
        for p in db.scalars(select(Payment).where(Payment.student_id.in_(student_ids))):
            payments[p.student_id].append(p)
        for e in enrollments:
            s = e.student
            result.append(
                schemas.TeacherStudent(
                    id=s.id, full_name=s.full_name, first_name=s.first_name, last_name=s.last_name,
                    email=s.email, phone=s.phone, group_id=g.id, group_name=g.name,
                    course_name=g.course.name,
                    attendance_rate=rate(att.get(s.id, [])),
                    average_grade=average(grades.get(s.id, [])),
                    payment_status=payment_status(payments[s.id]),
                    last_active_at=s.last_active_at,
                )
            )
    result.sort(key=lambda s: (s.group_name, s.last_name))
    return result


def _submission_out(sub: Submission) -> schemas.TeacherSubmission:
    hw = sub.homework
    return schemas.TeacherSubmission(
        id=sub.id, homework_id=hw.id, homework_title=hw.title, homework_description=hw.description,
        course_name=hw.group.course.name, group_id=hw.group_id, group_name=hw.group.name,
        student_id=sub.student_id, student_name=sub.student.full_name,
        text=sub.text, file_name=sub.file_name, file_url=file_url(sub),
        submitted_at=sub.submitted_at, due_date=hw.due_date, status=sub.status,
        grade=sub.grade, teacher_comment=sub.teacher_comment,
    )


def _submissions(db: Session, teacher: User, status: str | None = None, group_id: int | None = None, limit: int | None = None):
    q = (
        select(Submission)
        .join(Homework, Homework.id == Submission.homework_id)
        .join(Group, Group.id == Homework.group_id)
        .where(Group.teacher_id == teacher.id)
        .options(
            joinedload(Submission.student),
            joinedload(Submission.homework).joinedload(Homework.group).joinedload(Group.course),
        )
        .order_by(Submission.submitted_at.desc())
    )
    if status:
        q = q.where(Submission.status == status)
    if group_id:
        q = q.where(Homework.group_id == group_id)
    if limit:
        q = q.limit(limit)
    return [_submission_out(s) for s in db.scalars(q).unique()]


def _lesson_brief(lesson: Lesson) -> schemas.LessonBrief:
    return schemas.LessonBrief(id=lesson.id, topic=lesson.topic, starts_at=lesson.starts_at, ends_at=lesson.ends_at)


# ---------- overview / groups / students ----------
@router.get("/teachers/me/overview", response_model=schemas.TeacherOverview)
def overview(teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    groups = _groups(db, teacher)
    group_ids = [g.id for g in groups]
    today = datetime.combine(date.today(), datetime.min.time())
    lessons = db.scalars(
        select(Lesson).where(Lesson.group_id.in_(group_ids), Lesson.starts_at >= today, Lesson.starts_at < today + timedelta(days=7))
        .options(joinedload(Lesson.group).joinedload(Group.course), joinedload(Lesson.group).joinedload(Group.teacher))
        .order_by(Lesson.starts_at)
    ).unique().all() if group_ids else []
    stats = [group_stats(db, g) for g in groups]
    pending = _submissions(db, teacher, status="submitted")
    return schemas.TeacherOverview(
        today=[schedule_item(lsn) for lsn in lessons if lsn.starts_at < today + timedelta(days=1)],
        upcoming=[schedule_item(lsn) for lsn in lessons if lsn.starts_at >= today + timedelta(days=1)][:6],
        pending_submissions=len(pending),
        groups_count=len(groups),
        students_count=sum(s.students_count for s in stats),
        average_grade=average(s.average_grade for s in stats if s.average_grade is not None),
        attendance_rate=average(s.attendance_rate for s in stats if s.attendance_rate is not None),
        recent_submissions=pending[:5],
    )


@router.get("/teachers/me/groups", response_model=list[schemas.TeacherGroup])
def groups(include_finished: bool = False, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    return [group_stats(db, g) for g in _groups(db, teacher, include_finished)]


@router.get("/teachers/me/schedule", response_model=list[schemas.ScheduleItem])
def schedule(start: datetime, end: datetime, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    lessons = db.scalars(
        select(Lesson).join(Group).where(Group.teacher_id == teacher.id, Lesson.starts_at >= start, Lesson.starts_at < end)
        .options(joinedload(Lesson.group).joinedload(Group.course), joinedload(Lesson.group).joinedload(Group.teacher))
        .order_by(Lesson.starts_at)
    ).unique()
    return [schedule_item(lsn) for lsn in lessons]


@router.get("/teachers/me/students", response_model=list[schemas.TeacherStudent])
def students(group_id: int | None = None, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    return _teacher_students(db, teacher, group_id)


@router.get("/teachers/me/students/{student_id}", response_model=schemas.StudentDetail)
def student_detail(student_id: int, group_id: int | None = None, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    rows = [s for s in _teacher_students(db, teacher, group_id) if s.id == student_id]
    if not rows:
        raise HTTPException(404, "Студент не найден")
    row = rows[0]
    grades = db.scalars(
        select(Grade).where(Grade.student_id == student_id, Grade.group_id == row.group_id)
        .options(joinedload(Grade.group).joinedload(Group.course))
        .order_by(Grade.date.desc()).limit(10)
    ).all()
    att = db.execute(
        select(Attendance, Lesson).join(Lesson, Lesson.id == Attendance.lesson_id)
        .where(Attendance.student_id == student_id, Lesson.group_id == row.group_id)
        .order_by(Lesson.starts_at.desc()).limit(10)
    ).all()
    comments = db.scalars(
        select(Comment).where(Comment.student_id == student_id, Comment.teacher_id == teacher.id)
        .options(joinedload(Comment.teacher), joinedload(Comment.student))
        .order_by(Comment.created_at.desc())
    ).all()
    hw_ids = db.scalars(select(Homework.id).where(Homework.group_id == row.group_id, Homework.due_date < datetime.now())).all()
    submitted = db.scalars(
        select(Submission.id).where(Submission.student_id == student_id, Submission.homework_id.in_(hw_ids))
    ).all() if hw_ids else []
    return schemas.StudentDetail(
        student=row,
        recent_grades=[grade_out(g) for g in grades],
        recent_attendance=[
            schemas.AttendanceRecord(lesson_id=lsn.id, date=lsn.starts_at, course_name=row.course_name, topic=lsn.topic, status=a.status)
            for a, lsn in att
        ],
        comments=[comment_out(c) for c in comments],
        homework_submitted=len(submitted),
        homework_total=len(hw_ids),
    )


# ---------- gradebook ----------
@router.get("/teachers/me/gradebook", response_model=schemas.Gradebook)
def gradebook(group_id: int, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    group = own_group(db, teacher, group_id)
    lessons = db.scalars(
        select(Lesson).where(Lesson.group_id == group.id, Lesson.starts_at < datetime.now() + timedelta(hours=12))
        .order_by(Lesson.starts_at)
    ).all()
    students = db.scalars(
        select(User).join(Enrollment, Enrollment.student_id == User.id)
        .where(Enrollment.group_id == group.id, Enrollment.status != "dropped")
        .order_by(User.last_name)
    ).all()
    student_ids = [s.id for s in students]
    grades = db.scalars(
        select(Grade)
        .where(Grade.group_id == group.id, Grade.student_id.in_(student_ids))
        .options(joinedload(Grade.group).joinedload(Group.course))
    ).all() if student_ids else []
    return schemas.Gradebook(
        group=group_stats(db, group),
        lessons=[_lesson_brief(lsn) for lsn in lessons],
        students=[schemas.StudentBrief(id=s.id, full_name=s.full_name) for s in students],
        grades=[grade_out(g) for g in grades],
    )


def _check_enrolled(db: Session, group_id: int, student_id: int) -> None:
    if not db.scalar(select(Enrollment.id).where(Enrollment.group_id == group_id, Enrollment.student_id == student_id)):
        raise HTTPException(400, "Студент не состоит в группе")


@router.post("/grades", response_model=schemas.GradeOut, status_code=201)
def create_grade(data: schemas.GradeIn, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    own_group(db, teacher, data.group_id)
    _check_enrolled(db, data.group_id, data.student_id)
    grade_date = data.date or date.today()
    if data.lesson_id:
        lesson = db.get(Lesson, data.lesson_id)
        if not lesson or lesson.group_id != data.group_id:
            raise HTTPException(400, "Занятие не относится к группе")
        grade_date = lesson.starts_at.date()
    grade = Grade(
        student_id=data.student_id, group_id=data.group_id, lesson_id=data.lesson_id,
        value=data.value, type=data.type, comment=data.comment, date=grade_date,
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade_out(grade)


def _own_grade(db: Session, teacher: User, grade_id: int) -> Grade:
    grade = db.get(Grade, grade_id)
    if not grade or grade.group.teacher_id != teacher.id:
        raise HTTPException(404, "Оценка не найдена")
    return grade


@router.patch("/grades/{grade_id}", response_model=schemas.GradeOut)
def update_grade(grade_id: int, data: schemas.GradeUpdate, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    grade = _own_grade(db, teacher, grade_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None or field == "comment":
            setattr(grade, field, value)
    db.commit()
    return grade_out(grade)


@router.delete("/grades/{grade_id}", status_code=204)
def delete_grade(grade_id: int, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    db.delete(_own_grade(db, teacher, grade_id))
    db.commit()


# ---------- homework ----------
@router.get("/teachers/me/homework", response_model=list[schemas.TeacherHomework])
def teacher_homework(group_id: int | None = None, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    groups = [own_group(db, teacher, group_id)] if group_id else _groups(db, teacher)
    result = []
    for g in groups:
        students_count = len(db.scalars(select(Enrollment.id).where(Enrollment.group_id == g.id, Enrollment.status != "dropped")).all())
        for hw in db.scalars(select(Homework).where(Homework.group_id == g.id).order_by(Homework.due_date.desc())).all():
            subs = db.scalars(select(Submission.status).where(Submission.homework_id == hw.id)).all()
            result.append(
                schemas.TeacherHomework(
                    id=hw.id, group_id=g.id, group_name=g.name, course_name=g.course.name,
                    title=hw.title, description=hw.description, due_date=hw.due_date,
                    submitted=len(subs), reviewed=sum(s == "reviewed" for s in subs), students=students_count,
                )
            )
    result.sort(key=lambda h: h.due_date, reverse=True)
    return result


@router.post("/teachers/me/homework", response_model=schemas.TeacherHomework, status_code=201)
def create_homework(data: schemas.HomeworkIn, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    g = own_group(db, teacher, data.group_id)
    hw = Homework(group_id=g.id, title=data.title.strip(), description=data.description.strip(), due_date=data.due_date)
    db.add(hw)
    db.commit()
    students_count = len(db.scalars(select(Enrollment.id).where(Enrollment.group_id == g.id, Enrollment.status != "dropped")).all())
    return schemas.TeacherHomework(
        id=hw.id, group_id=g.id, group_name=g.name, course_name=g.course.name, title=hw.title,
        description=hw.description, due_date=hw.due_date, submitted=0, reviewed=0, students=students_count,
    )


@router.get("/teachers/me/submissions", response_model=list[schemas.TeacherSubmission])
def submissions(
    status: str | None = Query(None, pattern="^(submitted|reviewed|revision)$"),
    group_id: int | None = None,
    teacher: User = Depends(teacher_only),
    db: Session = Depends(get_db),
):
    return _submissions(db, teacher, status, group_id)


@router.patch("/submissions/{submission_id}", response_model=schemas.TeacherSubmission)
def review_submission(submission_id: int, data: schemas.SubmissionReview, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    sub = db.get(Submission, submission_id)
    if not sub or sub.homework.group.teacher_id != teacher.id:
        raise HTTPException(404, "Работа не найдена")
    if data.status == "reviewed" and data.grade is None:
        raise HTTPException(422, "Поставьте оценку")
    sub.status = data.status
    sub.teacher_comment = data.teacher_comment
    sub.grade = data.grade if data.status == "reviewed" else None
    sub.reviewed_at = datetime.now()

    # Оценка за ДЗ попадает в журнал
    grade = db.scalar(select(Grade).where(Grade.submission_id == sub.id))
    if sub.grade is not None:
        if not grade:
            grade = Grade(
                student_id=sub.student_id, group_id=sub.homework.group_id, submission_id=sub.id,
                type="homework", date=date.today(), value=sub.grade,
            )
            db.add(grade)
        grade.value = sub.grade
        grade.comment = sub.homework.title
    elif grade:
        db.delete(grade)
    db.commit()
    return _submission_out(sub)


# ---------- attendance ----------
@router.get("/attendance", response_model=schemas.AttendanceSheet)
def attendance_sheet(group_id: int, lesson_id: int | None = None, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    group = own_group(db, teacher, group_id)
    lessons = db.scalars(
        select(Lesson).where(Lesson.group_id == group.id, Lesson.starts_at < datetime.now() + timedelta(days=1))
        .order_by(Lesson.starts_at.desc())
    ).all()
    lesson = next((lsn for lsn in lessons if lsn.id == lesson_id), None) if lesson_id else (lessons[0] if lessons else None)
    if lesson_id and not lesson:
        raise HTTPException(404, "Занятие не найдено")
    students = db.scalars(
        select(User).join(Enrollment, Enrollment.student_id == User.id)
        .where(Enrollment.group_id == group.id, Enrollment.status != "dropped").order_by(User.last_name)
    ).all()
    marks = {}
    if lesson:
        marks = {a.student_id: a.status for a in db.scalars(select(Attendance).where(Attendance.lesson_id == lesson.id))}
    return schemas.AttendanceSheet(
        lessons=[_lesson_brief(lsn) for lsn in lessons],
        lesson=_lesson_brief(lesson) if lesson else None,
        rows=[schemas.AttendanceRow(student_id=s.id, full_name=s.full_name, status=marks.get(s.id)) for s in students],
    )


@router.post("/attendance", response_model=schemas.AttendanceSheet)
def save_attendance(data: schemas.AttendanceIn, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    lesson = db.get(Lesson, data.lesson_id)
    if not lesson or lesson.group.teacher_id != teacher.id:
        raise HTTPException(404, "Занятие не найдено")
    enrolled = set(db.scalars(select(Enrollment.student_id).where(Enrollment.group_id == lesson.group_id)).all())
    existing = {a.student_id: a for a in db.scalars(select(Attendance).where(Attendance.lesson_id == lesson.id))}
    for mark in data.records:
        if mark.student_id not in enrolled:
            raise HTTPException(400, "Студент не состоит в группе")
        if mark.student_id in existing:
            existing[mark.student_id].status = mark.status
        else:
            db.add(Attendance(lesson_id=lesson.id, student_id=mark.student_id, status=mark.status))
    db.commit()
    return attendance_sheet(lesson.group_id, lesson.id, teacher, db)


# ---------- comments ----------
@router.get("/comments", response_model=list[schemas.CommentOut])
def list_comments(student_id: int | None = None, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    q = (
        select(Comment).where(Comment.teacher_id == teacher.id)
        .options(joinedload(Comment.teacher), joinedload(Comment.student))
        .order_by(Comment.created_at.desc())
    )
    if student_id:
        q = q.where(Comment.student_id == student_id)
    return [comment_out(c) for c in db.scalars(q).all()]


@router.post("/comments", response_model=schemas.CommentOut, status_code=201)
def create_comment(data: schemas.CommentIn, teacher: User = Depends(teacher_only), db: Session = Depends(get_db)):
    if not any(s.id == data.student_id for s in _teacher_students(db, teacher)):
        raise HTTPException(400, "Это не ваш студент")
    comment = Comment(teacher_id=teacher.id, student_id=data.student_id, kind=data.kind, text=data.text.strip())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment_out(comment)
