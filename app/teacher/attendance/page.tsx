'use client'
import { useEffect, useState } from 'react'
import { CalendarCheck, Check, Save } from 'lucide-react'
import { GroupSelect, useTeacherGroups } from '@/components/cabinet/group-select'
import { useToast } from '@/components/cabinet/toast'
import { Avatar, Button, Card, EmptyState, ErrorState, PageHeader, PageSkeleton, Select, Skeleton } from '@/components/cabinet/ui'
import { teacherApi } from '@/lib/api/teacher'
import { attendanceLabel, fmtDate, fmtTime } from '@/lib/format'
import type { AttendanceStatus } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'

const STATUSES: AttendanceStatus[] = ['present', 'late', 'absent', 'excused']
const ACTIVE: Record<AttendanceStatus, string> = {
  present: 'bg-success text-white',
  late: 'bg-warning text-white',
  absent: 'bg-danger text-white',
  excused: 'bg-info text-white',
}

export default function TeacherAttendancePage() {
  const toast = useToast()
  const groups = useTeacherGroups()
  const [groupId, setGroupId] = useState<number | null>(null)
  const [lessonId, setLessonId] = useState<number | null>(null)
  const [marks, setMarks] = useState<Record<number, AttendanceStatus>>({})
  const [saving, setSaving] = useState(false)

  const sheet = useApi(
    () => (groupId ? teacherApi.attendance(groupId, lessonId) : Promise.resolve(null)),
    [groupId, lessonId],
  )

  useEffect(() => {
    if (!sheet.data) return
    setMarks(Object.fromEntries(sheet.data.rows.filter((r) => r.status).map((r) => [r.student_id, r.status!])))
    if (sheet.data.lesson && lessonId === null) setLessonId(sheet.data.lesson.id)
  }, [sheet.data, lessonId])

  useEffect(() => setLessonId(null), [groupId])

  const save = async () => {
    if (!sheet.data?.lesson) return
    setSaving(true)
    try {
      const records = Object.entries(marks).map(([student_id, status]) => ({ student_id: Number(student_id), status }))
      await teacherApi.saveAttendance(sheet.data.lesson.id, records)
      toast('Посещаемость сохранена')
      sheet.reload()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Ошибка', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (groups.error) return <ErrorState message={groups.error} onRetry={groups.reload} />
  if (!groups.data) return <PageSkeleton />

  const rows = sheet.data?.rows ?? []
  const filled = rows.filter((r) => marks[r.student_id]).length
  const dirty = rows.some((r) => (marks[r.student_id] ?? null) !== r.status)

  return (
    <>
      <PageHeader
        title="Посещаемость"
        subtitle="Отметьте студентов на занятии"
        actions={
          <>
            <GroupSelect groups={groups.data} value={groupId} onChange={setGroupId} />
            {sheet.data && sheet.data.lessons.length > 0 && (
              <Select value={lessonId ?? ''} onChange={(e) => setLessonId(Number(e.target.value))} className="h-10 w-auto min-w-56 text-sm" aria-label="Занятие">
                {sheet.data.lessons.map((l) => (
                  <option key={l.id} value={l.id}>{fmtDate(l.starts_at)}, {fmtTime(l.starts_at)} — {l.topic}</option>
                ))}
              </Select>
            )}
          </>
        }
      />

      {sheet.error ? (
        <ErrorState message={sheet.error} onRetry={sheet.reload} />
      ) : !sheet.data ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : !sheet.data.lesson ? (
        <Card><EmptyState icon={CalendarCheck} title="У группы ещё не было занятий" /></Card>
      ) : (
        <Card bodyClassName="p-4 md:p-6">
          <div className="mb-5 flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-serif text-xl text-primary">{sheet.data.lesson.topic}</p>
              <p className="text-sm text-muted">{fmtDate(sheet.data.lesson.starts_at)}, {fmtTime(sheet.data.lesson.starts_at)} – {fmtTime(sheet.data.lesson.ends_at)} · отмечено {filled} из {rows.length}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setMarks(Object.fromEntries(rows.map((r) => [r.student_id, 'present' as AttendanceStatus])))}>
                <Check size={15} />Все присутствуют
              </Button>
              <Button size="sm" onClick={save} disabled={saving || !dirty}><Save size={15} />{saving ? 'Сохранение…' : 'Сохранить'}</Button>
            </div>
          </div>

          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.student_id} className={cn('flex flex-wrap items-center gap-3 rounded-xl border p-3', marks[r.student_id] ? 'border-line' : 'border-dashed border-line bg-surface/50')}>
                <Avatar name={r.full_name} />
                <p className="min-w-0 flex-1 truncate font-medium text-primary">{r.full_name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setMarks((m) => ({ ...m, [r.student_id]: s }))}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-medium transition',
                        marks[r.student_id] === s ? ACTIVE[s] : 'bg-surface text-muted hover:text-primary',
                      )}
                    >
                      {attendanceLabel[s][0]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {rows.length === 0 && <EmptyState title="В группе нет студентов" />}
          </div>
        </Card>
      )}
    </>
  )
}
