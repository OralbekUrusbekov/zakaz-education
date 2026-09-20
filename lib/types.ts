// Типы 1:1 повторяют Pydantic-схемы бэкенда (backend/app/schemas.py)

export type Role = 'student' | 'teacher' | 'admin'
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused'
export type GradeType = 'classwork' | 'homework' | 'test' | 'exam'
export type HomeworkStatus = 'active' | 'submitted' | 'reviewed' | 'revision' | 'overdue'
export type PaymentStatus = 'paid' | 'pending' | 'overdue'
export type CommentKind = 'praise' | 'remark' | 'recommendation'
export type SubmissionStatus = 'submitted' | 'reviewed' | 'revision'

export type User = {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: Role
  phone: string | null
}

export type TokenResponse = { access_token: string; token_type: string; user: User }

export type Course = {
  id: number
  name: string
  category: string
  description: string
  duration_weeks: number
  price: number
  color: string
}

export type ScheduleItem = {
  id: number
  group_id: number
  group_name: string
  course_name: string
  course_color: string
  topic: string
  teacher_name: string
  starts_at: string
  ends_at: string
  room: string | null
  is_online: boolean
}

export type CommentItem = {
  id: number
  teacher_name: string
  student_id: number
  student_name: string
  kind: CommentKind
  text: string
  created_at: string
}

export type MonthValue = { month: string; value: number }

// ---------- student ----------
export type AttendanceRecord = {
  lesson_id: number
  date: string
  course_name: string
  topic: string
  status: AttendanceStatus
}

export type AttendanceByCourse = {
  course_name: string
  total: number
  present: number
  late: number
  absent: number
  excused: number
  rate: number
}

export type StudentAttendance = {
  rate: number
  counts: Record<AttendanceStatus, number>
  by_course: AttendanceByCourse[]
  records: AttendanceRecord[]
}

export type CourseProgress = {
  group_id: number
  group_name: string
  course_name: string
  course_color: string
  teacher_name: string
  status: string
  total_lessons: number
  completed_lessons: number
  progress: number
  average_grade: number | null
  attendance_rate: number | null
  start_date: string
  end_date: string
  topics: { topic: string; date: string; done: boolean }[]
  grade_trend: MonthValue[]
}

export type Submission = {
  id: number
  text: string | null
  file_name: string | null
  file_url: string | null
  submitted_at: string
  status: SubmissionStatus
  grade: number | null
  teacher_comment: string | null
}

export type StudentHomework = {
  id: number
  title: string
  description: string
  course_name: string
  course_color: string
  teacher_name: string
  created_at: string
  due_date: string
  status: HomeworkStatus
  submission: Submission | null
}

export type Grade = {
  id: number
  student_id: number
  group_id: number
  lesson_id: number | null
  course_name: string
  value: number
  type: GradeType
  date: string
  comment: string | null
}

export type StudentGrades = {
  average: number | null
  by_course: { course_name: string; course_color: string; average: number; count: number }[]
  trend: MonthValue[]
  items: Grade[]
}

export type Payment = {
  id: number
  course_name: string
  period: string
  amount: number
  due_date: string
  paid_at: string | null
  status: PaymentStatus
}

export type StudentPayments = {
  status: PaymentStatus
  total_debt: number
  monthly_total: number
  next_payment: Payment | null
  items: Payment[]
}

export type StudentOverview = {
  next_lesson: ScheduleItem | null
  today: ScheduleItem[]
  attendance_rate: number | null
  average_grade: number | null
  homework_due: number
  payment_status: PaymentStatus
  total_debt: number
  courses: CourseProgress[]
  recent_comments: CommentItem[]
}

// ---------- teacher ----------
export type TeacherGroup = {
  id: number
  name: string
  course_id: number
  course_name: string
  course_color: string
  students_count: number
  average_grade: number | null
  attendance_rate: number | null
  start_date: string
  end_date: string
}

export type TeacherStudent = {
  id: number
  full_name: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  group_id: number
  group_name: string
  course_name: string
  attendance_rate: number | null
  average_grade: number | null
  payment_status: PaymentStatus
  last_active_at: string | null
}

export type StudentDetail = {
  student: TeacherStudent
  recent_grades: Grade[]
  recent_attendance: AttendanceRecord[]
  comments: CommentItem[]
  homework_submitted: number
  homework_total: number
}

export type LessonBrief = { id: number; topic: string; starts_at: string; ends_at: string }

export type Gradebook = {
  group: TeacherGroup
  lessons: LessonBrief[]
  students: { id: number; full_name: string }[]
  grades: Grade[]
}

export type GradeInput = {
  student_id: number
  group_id: number
  lesson_id?: number | null
  value: number
  type?: GradeType
  comment?: string | null
}

export type TeacherSubmission = {
  id: number
  homework_id: number
  homework_title: string
  homework_description: string
  course_name: string
  group_id: number
  group_name: string
  student_id: number
  student_name: string
  text: string | null
  file_name: string | null
  file_url: string | null
  submitted_at: string
  due_date: string
  status: SubmissionStatus
  grade: number | null
  teacher_comment: string | null
}

export type TeacherHomework = {
  id: number
  group_id: number
  group_name: string
  course_name: string
  title: string
  description: string
  due_date: string
  submitted: number
  reviewed: number
  students: number
}

export type AttendanceSheet = {
  lessons: LessonBrief[]
  lesson: LessonBrief | null
  rows: { student_id: number; full_name: string; status: AttendanceStatus | null }[]
}

export type TeacherOverview = {
  today: ScheduleItem[]
  upcoming: ScheduleItem[]
  pending_submissions: number
  groups_count: number
  students_count: number
  average_grade: number | null
  attendance_rate: number | null
  recent_submissions: TeacherSubmission[]
}

// ---------- admin ----------
export type KPI = { value: number; delta: number | null }
export type Period = 'month' | 'quarter' | 'year'

export type Dashboard = {
  total_students: KPI
  active_students: KPI
  attendance_rate: KPI
  average_grade: KPI
  graduates: KPI
  students_trend: { month: string; total: number; active: number }[]
  attendance_trend: MonthValue[]
  grade_distribution: { grade: string; count: number }[]
  course_averages: { course_name: string; average: number }[]
  courses: {
    course_id: number
    course_name: string
    category: string
    color: string
    enrolled: number
    active: number
    completed: number
    completion_rate: number
  }[]
  graduates_trend: MonthValue[]
  teachers: {
    id: number
    full_name: string
    groups: number
    students: number
    average_grade: number | null
    attendance_rate: number | null
  }[]
  at_risk: {
    id: number
    full_name: string
    group_name: string
    attendance_rate: number | null
    average_grade: number | null
    debt: number
    reasons: string[]
  }[]
}
