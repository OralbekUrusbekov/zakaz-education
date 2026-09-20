import datetime as dt
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Role = Literal["student", "teacher", "admin"]
AttendanceStatus = Literal["present", "late", "absent", "excused"]
GradeType = Literal["classwork", "homework", "test", "exam"]
HomeworkStatus = Literal["active", "submitted", "reviewed", "revision", "overdue"]
PaymentStatus = Literal["paid", "pending", "overdue"]
CommentKind = Literal["praise", "remark", "recommendation"]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- auth ----------
class LoginIn(BaseModel):
    email: str
    password: str


class UserOut(ORM):
    id: int
    email: str
    first_name: str
    last_name: str
    full_name: str
    role: Role
    phone: str | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RegistrationIn(BaseModel):
    event_slug: str = Field(min_length=1, max_length=120)
    event_title: str = Field(min_length=1, max_length=200)
    event_date: str | None = None
    full_name: str = Field(min_length=2, max_length=150)
    phone: str = Field(min_length=5, max_length=40)
    email: str | None = None
    people: int = Field(default=1, ge=1, le=20)
    comment: str | None = None


class RegistrationOut(ORM):
    id: int
    event_title: str
    full_name: str
    created_at: datetime


# ---------- common ----------
class CourseOut(ORM):
    id: int
    name: str
    category: str
    description: str
    duration_weeks: int
    price: int
    color: str


class ScheduleItem(BaseModel):
    id: int
    group_id: int
    group_name: str
    course_name: str
    course_color: str
    topic: str
    teacher_name: str
    starts_at: datetime
    ends_at: datetime
    room: str | None
    is_online: bool


class CommentOut(BaseModel):
    id: int
    teacher_name: str
    student_id: int
    student_name: str
    kind: CommentKind
    text: str
    created_at: datetime


class MonthValue(BaseModel):
    month: str
    value: float


# ---------- student ----------
class AttendanceRecord(BaseModel):
    lesson_id: int
    date: datetime
    course_name: str
    topic: str
    status: AttendanceStatus


class AttendanceByCourse(BaseModel):
    course_name: str
    total: int
    present: int
    late: int
    absent: int
    excused: int
    rate: float


class StudentAttendance(BaseModel):
    rate: float
    counts: dict[str, int]
    by_course: list[AttendanceByCourse]
    records: list[AttendanceRecord]


class TopicItem(BaseModel):
    topic: str
    date: datetime
    done: bool


class CourseProgress(BaseModel):
    group_id: int
    group_name: str
    course_name: str
    course_color: str
    teacher_name: str
    status: str
    total_lessons: int
    completed_lessons: int
    progress: float
    average_grade: float | None
    attendance_rate: float | None
    start_date: date
    end_date: date
    topics: list[TopicItem]
    grade_trend: list[MonthValue]


class SubmissionOut(BaseModel):
    id: int
    text: str | None
    file_name: str | None
    file_url: str | None
    submitted_at: datetime
    status: str
    grade: int | None
    teacher_comment: str | None


class StudentHomework(BaseModel):
    id: int
    title: str
    description: str
    course_name: str
    course_color: str
    teacher_name: str
    created_at: datetime
    due_date: datetime
    status: HomeworkStatus
    submission: SubmissionOut | None


class GradeOut(BaseModel):
    id: int
    student_id: int
    group_id: int
    lesson_id: int | None
    course_name: str
    value: int
    type: GradeType
    date: dt.date
    comment: str | None


class GradeByCourse(BaseModel):
    course_name: str
    course_color: str
    average: float
    count: int


class StudentGrades(BaseModel):
    average: float | None
    by_course: list[GradeByCourse]
    trend: list[MonthValue]
    items: list[GradeOut]


class PaymentOut(BaseModel):
    id: int
    course_name: str
    period: str
    amount: int
    due_date: date
    paid_at: datetime | None
    status: PaymentStatus


class StudentPayments(BaseModel):
    status: PaymentStatus
    total_debt: int
    monthly_total: int
    next_payment: PaymentOut | None
    items: list[PaymentOut]


class StudentOverview(BaseModel):
    next_lesson: ScheduleItem | None
    today: list[ScheduleItem]
    attendance_rate: float | None
    average_grade: float | None
    homework_due: int
    payment_status: PaymentStatus
    total_debt: int
    courses: list[CourseProgress]
    recent_comments: list[CommentOut]


# ---------- teacher ----------
class TeacherGroup(BaseModel):
    id: int
    name: str
    course_id: int
    course_name: str
    course_color: str
    students_count: int
    average_grade: float | None
    attendance_rate: float | None
    start_date: date
    end_date: date


class TeacherStudent(BaseModel):
    id: int
    full_name: str
    first_name: str
    last_name: str
    email: str
    phone: str | None
    group_id: int
    group_name: str
    course_name: str
    attendance_rate: float | None
    average_grade: float | None
    payment_status: PaymentStatus
    last_active_at: datetime | None


class StudentDetail(BaseModel):
    student: TeacherStudent
    recent_grades: list[GradeOut]
    recent_attendance: list[AttendanceRecord]
    comments: list[CommentOut]
    homework_submitted: int
    homework_total: int


class LessonBrief(BaseModel):
    id: int
    topic: str
    starts_at: datetime
    ends_at: datetime


class StudentBrief(BaseModel):
    id: int
    full_name: str


class Gradebook(BaseModel):
    group: TeacherGroup
    lessons: list[LessonBrief]
    students: list[StudentBrief]
    grades: list[GradeOut]


class GradeIn(BaseModel):
    student_id: int
    group_id: int
    lesson_id: int | None = None
    value: int = Field(ge=1, le=10)
    type: GradeType = "classwork"
    comment: str | None = None
    date: dt.date | None = None


class GradeUpdate(BaseModel):
    value: int | None = Field(default=None, ge=1, le=10)
    type: GradeType | None = None
    comment: str | None = None


class TeacherSubmission(BaseModel):
    id: int
    homework_id: int
    homework_title: str
    homework_description: str
    course_name: str
    group_id: int
    group_name: str
    student_id: int
    student_name: str
    text: str | None
    file_name: str | None
    file_url: str | None
    submitted_at: datetime
    due_date: datetime
    status: str
    grade: int | None
    teacher_comment: str | None


class SubmissionReview(BaseModel):
    status: Literal["reviewed", "revision"]
    grade: int | None = Field(default=None, ge=1, le=10)
    teacher_comment: str | None = None


class HomeworkIn(BaseModel):
    group_id: int
    title: str = Field(min_length=1)
    description: str = ""
    due_date: datetime


class TeacherHomework(BaseModel):
    id: int
    group_id: int
    group_name: str
    course_name: str
    title: str
    description: str
    due_date: datetime
    submitted: int
    reviewed: int
    students: int


class AttendanceRow(BaseModel):
    student_id: int
    full_name: str
    status: AttendanceStatus | None


class AttendanceSheet(BaseModel):
    lessons: list[LessonBrief]
    lesson: LessonBrief | None
    rows: list[AttendanceRow]


class AttendanceMark(BaseModel):
    student_id: int
    status: AttendanceStatus


class AttendanceIn(BaseModel):
    lesson_id: int
    records: list[AttendanceMark]


class CommentIn(BaseModel):
    student_id: int
    kind: CommentKind = "recommendation"
    text: str = Field(min_length=1)


class TeacherOverview(BaseModel):
    today: list[ScheduleItem]
    upcoming: list[ScheduleItem]
    pending_submissions: int
    groups_count: int
    students_count: int
    average_grade: float | None
    attendance_rate: float | None
    recent_submissions: list[TeacherSubmission]


# ---------- admin ----------
class KPI(BaseModel):
    value: float
    delta: float | None  # изменение к прошлому периоду, %


class CoursePopularity(BaseModel):
    course_id: int
    course_name: str
    category: str
    color: str
    enrolled: int
    active: int
    completed: int
    completion_rate: float


class TeacherStat(BaseModel):
    id: int
    full_name: str
    groups: int
    students: int
    average_grade: float | None
    attendance_rate: float | None


class AtRiskStudent(BaseModel):
    id: int
    full_name: str
    group_name: str
    attendance_rate: float | None
    average_grade: float | None
    debt: int
    reasons: list[str]


class TrendPoint(BaseModel):
    month: str
    total: int
    active: int


class DistributionPoint(BaseModel):
    grade: str
    count: int


class CourseAverage(BaseModel):
    course_name: str
    average: float


class Dashboard(BaseModel):
    total_students: KPI
    active_students: KPI
    attendance_rate: KPI
    average_grade: KPI
    graduates: KPI
    students_trend: list[TrendPoint]
    attendance_trend: list[MonthValue]
    grade_distribution: list[DistributionPoint]
    course_averages: list[CourseAverage]
    courses: list[CoursePopularity]
    graduates_trend: list[MonthValue]
    teachers: list[TeacherStat]
    at_risk: list[AtRiskStudent]
