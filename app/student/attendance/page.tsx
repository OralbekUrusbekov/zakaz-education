'use client'
import { useMemo, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { Card, EmptyState, ErrorState, PageHeader, PageSkeleton, ProgressBar, ProgressRing, StatusBadge, Table, Tabs, Td, Th } from '@/components/cabinet/ui'
import { Pager, usePager } from '@/components/cabinet/pager'
import { studentApi } from '@/lib/api/student'
import { addDays, attendanceLabel, fmtDate, fmtPct, fmtTime, fmtWeekday, startOfWeek } from '@/lib/format'
import type { AttendanceRecord, AttendanceStatus } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: 'bg-success',
  late: 'bg-warning',
  absent: 'bg-danger',
  excused: 'bg-info',
}
const SEVERITY: AttendanceStatus[] = ['absent', 'late', 'excused', 'present']
const WEEKS = 18

function Heatmap({ records }: { records: AttendanceRecord[] }) {
  const byDay = useMemo(() => {
    const m = new Map<string, AttendanceRecord[]>()
    for (const r of records) {
      const k = new Date(r.date).toDateString()
      m.set(k, [...(m.get(k) ?? []), r])
    }
    return m
  }, [records])
  const first = addDays(startOfWeek(new Date()), -7 * (WEEKS - 1))
  const today = new Date()
  return (
    <div className="scrollbar-thin overflow-x-auto pb-1">
      <div className="inline-flex gap-3">
        <div className="grid grid-rows-7 gap-1 pt-5 text-[10px] text-muted">
          {['Пн', '', 'Ср', '', 'Пт', '', 'Вс'].map((d, i) => <span key={i} className="flex h-4 items-center">{d}</span>)}
        </div>
        <div>
          <div className="mb-1 flex gap-1 text-[10px] text-muted">
            {Array.from({ length: WEEKS }, (_, w) => {
              const d = addDays(first, w * 7)
              return <span key={w} className="w-4">{d.getDate() <= 7 ? d.toLocaleDateString('ru-RU', { month: 'short' }).slice(0, 3) : ''}</span>
            })}
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-1">
            {Array.from({ length: WEEKS * 7 }, (_, i) => {
              const day = addDays(first, i)
              const items = byDay.get(day.toDateString()) ?? []
              const worst = SEVERITY.find((s) => items.some((r) => r.status === s))
              const title = items.length
                ? `${fmtDate(day)}: ${items.map((r) => `${r.course_name} — ${attendanceLabel[r.status][0]}`).join(', ')}`
                : fmtDate(day)
              return (
                <span
                  key={i}
                  title={title}
                  className={cn('h-4 w-4 rounded-[4px]', worst ? STATUS_COLOR[worst] : 'bg-surface ring-1 ring-line ring-inset', day > today && 'opacity-30')}
                />
              )
            })}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
        {(Object.keys(STATUS_COLOR) as AttendanceStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5"><span className={cn('h-3 w-3 rounded-[3px]', STATUS_COLOR[s])} /> {attendanceLabel[s][0]}</span>
        ))}
      </div>
    </div>
  )
}

export default function StudentAttendancePage() {
  const { data, error, loading, reload } = useApi(studentApi.attendance)
  const [filter, setFilter] = useState<'all' | AttendanceStatus>('all')
  const records = !data ? [] : filter === 'all' ? data.records : data.records.filter((r) => r.status === filter)
  const pager = usePager(records, 10, filter)

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading || !data) return <PageSkeleton />

  const total = data.records.length

  return (
    <>
      <PageHeader title="Посещаемость" subtitle={`${total} отмеченных занятий`} />
      {total === 0 ? (
        <Card><EmptyState icon={CalendarCheck} title="Отметок пока нет" text="Посещаемость появится после первых занятий." /></Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <Card title="Общая посещаемость" bodyClassName="flex flex-col items-center">
              <ProgressRing value={data.rate} label="посещено" />
              <div className="mt-6 grid w-full grid-cols-2 gap-2">
                {(Object.keys(attendanceLabel) as AttendanceStatus[]).map((s) => (
                  <div key={s} className="rounded-xl bg-surface p-3">
                    <p className="font-serif text-2xl text-primary">{data.counts[s]}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted"><span className={cn('h-2 w-2 rounded-full', STATUS_COLOR[s])} />{attendanceLabel[s][0]}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Календарь посещений" subtitle={`Последние ${WEEKS} недель`}>
              <Heatmap records={data.records} />
            </Card>
          </div>

          <Card title="По предметам" className="mt-6">
            <Table>
              <thead><tr><Th>Предмет</Th><Th>Занятий</Th><Th>Присутствовал</Th><Th>Опоздал</Th><Th>Пропустил</Th><Th>Уваж.</Th><Th className="w-56">Посещаемость</Th></tr></thead>
              <tbody>
                {data.by_course.map((c) => (
                  <tr key={c.course_name} className="hover:bg-surface/60">
                    <Td className="font-semibold text-primary">{c.course_name}</Td>
                    <Td>{c.total}</Td><Td>{c.present}</Td><Td>{c.late}</Td><Td>{c.absent}</Td><Td>{c.excused}</Td>
                    <Td><div className="flex items-center gap-3"><ProgressBar value={c.rate} /><span className="w-10 text-right font-semibold">{fmtPct(c.rate)}</span></div></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          <Card
            title="История"
            className="mt-6"
            action={
              <Tabs
                value={filter}
                onChange={setFilter}
                tabs={[{ value: 'all', label: 'Все' }, ...(Object.keys(attendanceLabel) as AttendanceStatus[]).map((s) => ({ value: s, label: attendanceLabel[s][0], count: data.counts[s] }))]}
              />
            }
          >
            <div className="divide-y divide-line">
              {pager.visible.map((r) => (
                <div key={`${r.lesson_id}`} className="flex items-center gap-4 py-3">
                  <div className="w-24 shrink-0">
                    <p className="text-sm font-semibold text-primary">{fmtDate(r.date)}</p>
                    <p className="text-xs text-muted first-letter:uppercase">{fmtWeekday(r.date)}, {fmtTime(r.date)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-primary">{r.course_name}</p>
                    <p className="truncate text-xs text-muted">{r.topic}</p>
                  </div>
                  <StatusBadge status={r.status} map={attendanceLabel} />
                </div>
              ))}
              {records.length === 0 && <EmptyState title="Нет записей" />}
            </div>
            <Pager page={pager.page} pageCount={pager.pageCount} onChange={pager.setPage} from={pager.from} to={pager.to} total={pager.total} />
          </Card>
        </>
      )}
    </>
  )
}
