'use client'
import Link from 'next/link'
import { ArrowRight, Award, GraduationCap, TrendingUp, TriangleAlert, UserCheck, Users } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART, tooltipStyle } from '@/components/cabinet/charts'
import { Card, ErrorState, PageHeader, PageSkeleton, StatCard } from '@/components/cabinet/ui'
import { periodLabel, useDashboard } from '@/components/admin/use-dashboard'
import { fmtGrade, fmtPct } from '@/lib/format'

export default function AdminDashboardPage() {
  const { data, error, loading, reload, period, filters } = useDashboard()

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading || !data) return <PageSkeleton />
  const label = periodLabel(period)

  return (
    <>
      <PageHeader title="Панель руководства" subtitle={`Ключевые показатели учебного центра · за ${label}`} actions={filters} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Всего студентов" icon={Users} value={data.total_students.value} delta={data.total_students.delta} hint="за всё время" />
        <StatCard label="Активных студентов" icon={UserCheck} tone="success" value={data.active_students.value} delta={data.active_students.delta} hint="учатся сейчас" />
        <StatCard label="Посещаемость" icon={TrendingUp} tone="info" value={fmtPct(data.attendance_rate.value)} delta={data.attendance_rate.delta} hint={`за ${label}`} />
        <StatCard label="Успеваемость" icon={Award} tone="gold" value={fmtGrade(data.average_grade.value)} delta={data.average_grade.delta} hint="средний балл" />
        <StatCard label="Завершили обучение" icon={GraduationCap} tone="success" value={data.graduates.value} delta={data.graduates.delta} hint={`за ${label}`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card title="Динамика студентов" subtitle="Всего и активных по месяцам">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.students_trend} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" tick={CHART.axis} axisLine={false} tickLine={false} />
                <YAxis tick={CHART.axis} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                <Line type="monotone" dataKey="total" name="Всего" stroke={CHART.primary} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="active" name="Активных" stroke={CHART.gold} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Посещаемость" subtitle="Средний процент по месяцам">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.attendance_trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.blue} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART.blue} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" tick={CHART.axis} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={CHART.axis} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Посещаемость']} />
                <Area type="monotone" dataKey="value" stroke={CHART.blue} strokeWidth={2.5} fill="url(#att)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <Card title="Распределение оценок" subtitle={`Все оценки за ${label}`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.grade_distribution} margin={{ left: -20, top: 8 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="grade" tick={CHART.axis} axisLine={false} tickLine={false} />
                <YAxis tick={CHART.axis} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Оценок']} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {data.grade_distribution.map((d) => (
                    <Cell key={d.grade} fill={Number(d.grade) >= 8 ? CHART.green : Number(d.grade) >= 5 ? CHART.gold : CHART.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Средний балл по курсам"
          action={<Link href="/admin/courses" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-gold-dark">Все курсы <ArrowRight size={15} /></Link>}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.course_averages} layout="vertical" margin={{ left: 12, right: 16, top: 8 }}>
                <CartesianGrid stroke={CHART.grid} horizontal={false} />
                <XAxis type="number" domain={[0, 10]} tick={CHART.axis} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="course_name" width={150} tick={{ ...CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [Number(v).toFixed(2), 'Средний балл']} />
                <Bar dataKey="average" fill={CHART.primary} radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { href: '/admin/courses', title: 'Курсы', text: `${data.courses.length} программ · популярность и завершаемость`, icon: Award },
          { href: '/admin/teachers', title: 'Преподаватели', text: `${data.teachers.length} преподавателей на активных группах`, icon: Users },
          { href: '/admin/risk', title: 'Зона риска', text: `${data.at_risk.length} студентов требуют внимания`, icon: TriangleAlert },
        ].map(({ href, title, text, icon: Icon }) => (
          <Link key={href} href={href} className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(16,24,40,.07)]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary"><Icon size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-serif text-lg text-primary">{title}</span>
              <span className="block text-sm text-muted">{text}</span>
            </span>
            <ArrowRight size={17} className="text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </>
  )
}
