'use client'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART, tooltipStyle } from '@/components/cabinet/charts'
import { Card, ErrorState, PageHeader, PageSkeleton, ProgressBar, StatCard, Table, Td, Th } from '@/components/cabinet/ui'
import { periodLabel, useDashboard } from '@/components/admin/use-dashboard'
import { Award, GraduationCap, Layers, Users } from 'lucide-react'
import { fmtGrade, fmtPct } from '@/lib/format'

export default function AdminCoursesPage() {
  const { data, error, loading, reload, period, filters } = useDashboard()
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading || !data) return <PageSkeleton />

  const enrolled = data.courses.reduce((s, c) => s + c.enrolled, 0)
  const active = data.courses.reduce((s, c) => s + c.active, 0)
  const completed = data.courses.reduce((s, c) => s + c.completed, 0)

  return (
    <>
      <PageHeader title="Курсы" subtitle={`Популярность и результативность программ · за ${periodLabel(period)}`} actions={filters} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Программ" icon={Layers} value={data.courses.length} hint="в каталоге" />
        <StatCard label="Всего записей" icon={Users} value={enrolled} hint="за всё время" />
        <StatCard label="Учатся сейчас" icon={Award} tone="success" value={active} hint="активных зачислений" />
        <StatCard label="Завершили" icon={GraduationCap} tone="gold" value={completed} hint={`${enrolled ? Math.round((100 * completed) / enrolled) : 0}% от записавшихся`} />
      </div>

      <Card title="Популярность курсов" subtitle="За всё время" className="mt-6">
        <Table>
          <thead><tr><Th>Курс</Th><Th>Категория</Th><Th>Записано</Th><Th>Активных</Th><Th>Завершили</Th><Th className="w-44">% завершения</Th></tr></thead>
          <tbody>
            {data.courses.map((c) => (
              <tr key={c.course_id} className="hover:bg-surface/60">
                <Td>
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                    <span className="font-semibold text-primary">{c.course_name}</span>
                  </div>
                </Td>
                <Td className="text-muted">{c.category}</Td>
                <Td className="font-semibold text-primary">{c.enrolled}</Td>
                <Td>{c.active}</Td>
                <Td>{c.completed}</Td>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <ProgressBar value={c.completion_rate} color={c.color} />
                    <span className="w-10 text-right text-xs font-semibold">{fmtPct(c.completion_rate)}</span>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Средний балл по курсам" subtitle={`Оценки за ${periodLabel(period)}`}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.course_averages} layout="vertical" margin={{ left: 12, right: 16, top: 8 }}>
                <CartesianGrid stroke={CHART.grid} horizontal={false} />
                <XAxis type="number" domain={[0, 10]} tick={CHART.axis} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="course_name" width={160} tick={{ ...CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [Number(v).toFixed(2), 'Средний балл']} />
                <Bar dataKey="average" fill={CHART.primary} radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Завершили обучение" subtitle="Выпускники по месяцам">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.graduates_trend} margin={{ left: -20, top: 8 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" tick={CHART.axis} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={CHART.axis} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Выпускников']} />
                <Bar dataKey="value" fill={CHART.gold} radius={[6, 6, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Сводка" className="mt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {data.courses.slice(0, 3).map((c) => (
            <div key={c.course_id} className="rounded-xl bg-surface p-4">
              <p className="text-sm font-semibold text-primary">{c.course_name}</p>
              <p className="mt-1 text-xs text-muted">Средний балл: {fmtGrade(data.course_averages.find((a) => a.course_name === c.course_name)?.average ?? null)}</p>
              <p className="text-xs text-muted">Завершаемость: {fmtPct(c.completion_rate)}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
