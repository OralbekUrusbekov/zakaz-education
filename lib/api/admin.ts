import type { Course, Dashboard, Period } from '../types'
import { apiClient, qs } from './client'

export const adminApi = {
  dashboard: (period: Period, courseId?: number | null) =>
    apiClient<Dashboard>(`/analytics/dashboard${qs({ period, course_id: courseId })}`),
  courses: () => apiClient<Course[]>('/courses'),
}
