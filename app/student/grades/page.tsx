'use client'
import { useMemo, useState } from 'react'
import { BookOpenCheck } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART, tooltipStyle } from '@/components/cabinet/charts'
import { Card, EmptyState, ErrorState, GradePill, PageHeader, PageSkeleton, Select, Table, Td, Th } from '@/components/cabinet/ui'
import { Pager, usePager } from '@/components/cabinet/pager'
import { studentApi } from '@/lib/api/student'
import { fmtDate, fmtGrade, gradeTypeLabel } from '@/lib/format'
import type { GradeType } from '@/lib/types'
import { useApi } from '@/lib/use-api'

const monthKey = (d: string) => d.slice(0, 7)
const monthName = (k: string) => new Date(`${k}-01T00:00:00`).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })

export default function StudentGradesPage() {
  const { data, error, loading, reload } = useApi(studentApi.grades)
  const months = useMemo(() => [...new Set((data?.items ?? []).map((g) => monthKey(g.date)))].sort().reverse(), [data])
  const [month, setMonth] = useState<string | null>(null)
  const [course, setCourse] = useState('all')
  const [type, setType] = useState<'all' | GradeType>('all')
  const list = (data?.items ?? []).filter((g) => (course === 'all' || g.course_name === course) && (type === 'all' || g.type === type))
  const pager = usePager(list, 10, `${course}|${type}`)

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading || !data) return <PageSkeleton />
  if (data.items.length === 0)
    return (<><PageHeader title="Оценки" /><Card><EmptyState icon={BookOpenCheck} title="Оценок пока нет" /></Card></>)

  const activeMonth = month ?? months[0]
  const monthGrades = data.items.filter((g) => monthKey(g.date) === activeMonth)
  const dates = [...new Set(monthGrades.map((g) => g.date))].sort()
  const courses = data.by_course.map((c) => c.course_name)

  return (
    <>
      <PageHeader title="Оценки" subtitle="Десятибалльная шкала" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-primary p-5 text-white">
          <p className="text-sm text-white/70">Общий средний балл</p>
          <p className="mt-1 font-serif text-5xl text-gold">{fmtGrade(data.average)}</p>
          <p className="mt-1 text-xs text-white/60">{data.items.length} оценок</p>
        </div>
        {data.by_course.map((c) => (
          <div key={c.course_name} className="rounded-2xl border border-line bg-white p-5">
            <p className="flex items-center gap-2 text-sm text-muted"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c.course_color }} />{c.course_name}</p>
            <p className="mt-1 font-serif text-4xl text-primary">{fmtGrade(c.average)}</p>
            <p className="mt-1 text-xs text-muted">{c.count} оценок</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card
          title="Журнал"
          subtitle="Предметы × даты"
          action={
            <Select value={activeMonth} onChange={(e) => setMonth(e.target.value)} className="h-9 w-auto text-sm">
              {months.map((m) => <option key={m} value={m}>{monthName(m)}</option>)}
            </Select>
          }
        >
          <Table>
            <thead>
              <tr>
                <Th className="sticky left-0 z-10 min-w-44">Предмет</Th>
                {dates.map((d) => <Th key={d} className="text-center">{new Date(d).getDate()}</Th>)}
                <Th className="text-center">Ср.</Th>
              </tr>
            </thead>
            <tbody>
              {courses.map((name) => {
                const row = monthGrades.filter((g) => g.course_name === name)
                const avg = row.length ? row.reduce((s, g) => s + g.value, 0) / row.length : null
                return (
                  <tr key={name}>
                    <Td className="sticky left-0 z-10 bg-white font-medium text-primary">{name}</Td>
                    {dates.map((d) => (
                      <Td key={d} className="px-1.5 text-center">
                        <div className="flex justify-center gap-1">
                          {row.filter((g) => g.date === d).map((g) => (
                            <span key={g.id} title={`${gradeTypeLabel[g.type]}${g.comment ? ` · ${g.comment}` : ''}`}><GradePill value={g.value} className="h-7 w-7 text-xs" /></span>
                          ))}
                        </div>
                      </Td>
                    ))}
                    <Td className="text-center font-semibold text-primary">{fmtGrade(avg)}</Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Card>

        <Card title="Динамика" subtitle="Средний балл по месяцам">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend} margin={{ left: -24, top: 8 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" tick={CHART.axis} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={CHART.axis} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [Number(v).toFixed(2), 'Средний балл']} />
                <Bar dataKey="value" fill={CHART.primary} radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card
        title="Все оценки"
        className="mt-6"
        action={
          <div className="flex flex-wrap gap-2">
            <Select value={course} onChange={(e) => setCourse(e.target.value)} className="h-9 w-auto text-sm">
              <option value="all">Все предметы</option>
              {courses.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Select value={type} onChange={(e) => setType(e.target.value as 'all' | GradeType)} className="h-9 w-auto text-sm">
              <option value="all">Все типы</option>
              {(Object.keys(gradeTypeLabel) as GradeType[]).map((t) => <option key={t} value={t}>{gradeTypeLabel[t]}</option>)}
            </Select>
          </div>
        }
      >
        <div className="divide-y divide-line">
          {pager.visible.map((g) => (
            <div key={g.id} className="flex items-center gap-4 py-3">
              <GradePill value={g.value} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-primary">{g.course_name}</p>
                <p className="truncate text-xs text-muted">{gradeTypeLabel[g.type]}{g.comment ? ` · ${g.comment}` : ''}</p>
              </div>
              <span className="shrink-0 text-sm text-muted">{fmtDate(g.date)}</span>
            </div>
          ))}
          {list.length === 0 && <EmptyState title="Нет оценок по фильтру" />}
        </div>
        <Pager page={pager.page} pageCount={pager.pageCount} onChange={pager.setPage} from={pager.from} to={pager.to} total={pager.total} />
      </Card>
    </>
  )
}
