'use client'
import { useState } from 'react'
import { CheckCircle2, Circle, GraduationCap } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART, tooltipStyle } from '@/components/cabinet/charts'
import { Badge, Card, EmptyState, ErrorState, PageHeader, PageSkeleton, ProgressBar } from '@/components/cabinet/ui'
import { studentApi } from '@/lib/api/student'
import { fmtFullDate, fmtGrade, fmtPct, fmtShortDate } from '@/lib/format'
import type { CourseProgress } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'

function CourseBlock({ c }: { c: CourseProgress }) {
  const [showAll, setShowAll] = useState(false)
  const nextIdx = c.topics.findIndex((t) => !t.done)
  // уникальные темы по порядку, чтобы timeline был компактным
  const topics = c.topics.reduce<{ topic: string; date: string; done: boolean }[]>((acc, t) => {
    const last = acc[acc.length - 1]
    if (last && last.topic === t.topic) { last.done = t.done; return acc }
    return [...acc, { ...t }]
  }, [])
  const visible = showAll ? topics : topics.slice(0, 6)

  return (
    <Card className="overflow-hidden" bodyClassName="p-0">
      <div className="h-1.5" style={{ background: c.course_color }} />
      <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-2xl text-primary">{c.course_name}</h2>
            {c.status === 'completed' ? <Badge tone="success">Завершён</Badge> : <Badge tone="gold">Идёт обучение</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">{c.teacher_name} · группа {c.group_name} · {fmtFullDate(c.start_date)} — {fmtFullDate(c.end_date)}</p>

          <div className="mt-5 flex items-end justify-between">
            <p className="text-sm text-muted">Пройдено {c.completed_lessons} из {c.total_lessons} занятий</p>
            <p className="font-serif text-3xl text-primary">{Math.round(c.progress)}%</p>
          </div>
          <ProgressBar value={c.progress} color={c.course_color} className="mt-2 h-2.5" />

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface p-3.5"><p className="text-xs text-muted">Средний балл</p><p className="font-serif text-2xl text-primary">{fmtGrade(c.average_grade)}</p></div>
            <div className="rounded-xl bg-surface p-3.5"><p className="text-xs text-muted">Посещаемость</p><p className="font-serif text-2xl text-primary">{fmtPct(c.attendance_rate)}</p></div>
          </div>

          {c.grade_trend.length > 1 && (
            <div className="mt-5 h-40">
              <p className="mb-2 text-sm font-medium text-primary">Динамика баллов</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={c.grade_trend} margin={{ left: -24, right: 8, top: 4 }}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="month" tick={CHART.axis} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={CHART.axis} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [Number(v).toFixed(2), 'Средний балл']} />
                  <Line type="monotone" dataKey="value" stroke={c.course_color} strokeWidth={2.5} dot={{ r: 3.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-primary">Программа курса</p>
          <ol className="relative space-y-0">
            {visible.map((t, i) => {
              const current = !t.done && (i === 0 || visible[i - 1]?.done)
              return (
                <li key={t.topic + i} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < visible.length - 1 && <span className={cn('absolute top-6 left-[9px] h-[calc(100%-18px)] w-0.5', t.done ? 'bg-success/40' : 'bg-line')} />}
                  {t.done ? <CheckCircle2 size={20} className="shrink-0 text-success" /> : <Circle size={20} className={cn('shrink-0', current ? 'text-gold' : 'text-line')} />}
                  <div className="-mt-0.5">
                    <p className={cn('text-sm', t.done ? 'text-primary' : current ? 'font-semibold text-primary' : 'text-muted')}>{t.topic}</p>
                    <p className="text-xs text-muted">{current ? 'Следующая тема · ' : ''}{fmtShortDate(t.date)}</p>
                  </div>
                </li>
              )
            })}
          </ol>
          {topics.length > 6 && (
            <button onClick={() => setShowAll(!showAll)} className="mt-3 text-sm font-medium text-primary underline decoration-gold underline-offset-4">
              {showAll ? 'Свернуть' : `Показать все темы (${topics.length})`}
            </button>
          )}
          {nextIdx === -1 && <p className="mt-3 text-sm text-success">Все темы пройдены</p>}
        </div>
      </div>
    </Card>
  )
}

export default function StudentProgressPage() {
  const { data, error, loading, reload } = useApi(studentApi.progress)
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading || !data) return <PageSkeleton />
  return (
    <>
      <PageHeader title="Прогресс обучения" subtitle="Пройденные темы, баллы и посещаемость по каждому курсу" />
      {data.length === 0 ? (
        <Card><EmptyState icon={GraduationCap} title="Вы пока не записаны на курсы" /></Card>
      ) : (
        <div className="space-y-6">{data.map((c) => <CourseBlock key={c.group_id} c={c} />)}</div>
      )}
    </>
  )
}
