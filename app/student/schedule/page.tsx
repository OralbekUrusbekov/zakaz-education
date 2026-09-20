'use client'
import { ScheduleView } from '@/components/cabinet/schedule-view'
import { PageHeader } from '@/components/cabinet/ui'
import { studentApi } from '@/lib/api/student'

export default function StudentSchedulePage() {
  return (
    <>
      <PageHeader title="Расписание" subtitle="Занятия по всем вашим курсам" />
      <ScheduleView fetcher={studentApi.schedule} />
    </>
  )
}
