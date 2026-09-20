import type {
  CommentItem, CourseProgress, ScheduleItem, StudentAttendance, StudentGrades, StudentHomework,
  StudentOverview, StudentPayments,
} from '../types'
import { apiClient, qs } from './client'

export const studentApi = {
  overview: () => apiClient<StudentOverview>('/students/me/overview'),
  schedule: (start: string, end: string) => apiClient<ScheduleItem[]>(`/students/me/schedule${qs({ start, end })}`),
  attendance: () => apiClient<StudentAttendance>('/students/me/attendance'),
  progress: () => apiClient<CourseProgress[]>('/students/me/progress'),
  homework: () => apiClient<StudentHomework[]>('/students/me/homework'),
  submitHomework: (id: number, text: string, file: File | null) => {
    const form = new FormData()
    form.append('text', text)
    if (file) form.append('file', file)
    return apiClient<StudentHomework>(`/students/me/homework/${id}/submit`, { method: 'POST', body: form })
  },
  grades: () => apiClient<StudentGrades>('/students/me/grades'),
  payments: () => apiClient<StudentPayments>('/students/me/payments'),
  pay: (id: number) => apiClient<StudentPayments>(`/students/me/payments/${id}/pay`, { method: 'POST' }),
  comments: () => apiClient<CommentItem[]>('/students/me/comments'),
}
