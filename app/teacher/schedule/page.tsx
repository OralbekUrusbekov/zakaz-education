'use client'
import { ScheduleView } from '@/components/cabinet/schedule-view'
import { PageHeader } from '@/components/cabinet/ui'
import { teacherApi } from '@/lib/api/teacher'

export default function TeacherSchedulePage() {
  return (
    <>
      <PageHeader title="Расписание" subtitle="Занятия всех ваших групп" />
      <ScheduleView fetcher={teacherApi.schedule} showTeacher={false} />
    </>
  )
}
