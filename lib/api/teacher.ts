import type {
  AttendanceSheet, AttendanceStatus, CommentItem, CommentKind, Grade, GradeInput, Gradebook, ScheduleItem,
  StudentDetail, SubmissionStatus, TeacherGroup, TeacherHomework, TeacherOverview, TeacherStudent, TeacherSubmission,
} from '../types'
import { apiClient, qs } from './client'

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) })

export const teacherApi = {
  overview: () => apiClient<TeacherOverview>('/teachers/me/overview'),
  groups: () => apiClient<TeacherGroup[]>('/teachers/me/groups'),
  schedule: (start: string, end: string) => apiClient<ScheduleItem[]>(`/teachers/me/schedule${qs({ start, end })}`),
  students: (groupId?: number | null) => apiClient<TeacherStudent[]>(`/teachers/me/students${qs({ group_id: groupId })}`),
  student: (id: number, groupId?: number) => apiClient<StudentDetail>(`/teachers/me/students/${id}${qs({ group_id: groupId })}`),
  gradebook: (groupId: number) => apiClient<Gradebook>(`/teachers/me/gradebook${qs({ group_id: groupId })}`),
  createGrade: (data: GradeInput) => apiClient<Grade>('/grades', json('POST', data)),
  updateGrade: (id: number, data: Partial<Pick<Grade, 'value' | 'type' | 'comment'>>) =>
    apiClient<Grade>(`/grades/${id}`, json('PATCH', data)),
  deleteGrade: (id: number) => apiClient<void>(`/grades/${id}`, { method: 'DELETE' }),
  homework: (groupId?: number | null) => apiClient<TeacherHomework[]>(`/teachers/me/homework${qs({ group_id: groupId })}`),
  createHomework: (data: { group_id: number; title: string; description: string; due_date: string }) =>
    apiClient<TeacherHomework>('/teachers/me/homework', json('POST', data)),
  submissions: (status?: SubmissionStatus | null, groupId?: number | null) =>
    apiClient<TeacherSubmission[]>(`/teachers/me/submissions${qs({ status, group_id: groupId })}`),
  review: (id: number, data: { status: 'reviewed' | 'revision'; grade?: number | null; teacher_comment?: string | null }) =>
    apiClient<TeacherSubmission>(`/submissions/${id}`, json('PATCH', data)),
  attendance: (groupId: number, lessonId?: number | null) =>
    apiClient<AttendanceSheet>(`/attendance${qs({ group_id: groupId, lesson_id: lessonId })}`),
  saveAttendance: (lessonId: number, records: { student_id: number; status: AttendanceStatus }[]) =>
    apiClient<AttendanceSheet>('/attendance', json('POST', { lesson_id: lessonId, records })),
  comments: (studentId?: number | null) => apiClient<CommentItem[]>(`/comments${qs({ student_id: studentId })}`),
  createComment: (data: { student_id: number; kind: CommentKind; text: string }) =>
    apiClient<CommentItem>('/comments', json('POST', data)),
}
