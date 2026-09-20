'use client'
import { Award, TrendingUp, Users } from 'lucide-react'
import { Avatar, Card, ErrorState, PageHeader, PageSkeleton, ProgressBar, StatCard, Table, Td, Th } from '@/components/cabinet/ui'
import { Pager, usePager } from '@/components/cabinet/pager'
import { periodLabel, useDashboard } from '@/components/admin/use-dashboard'
import { fmtGrade, fmtPct } from '@/lib/format'

export default function AdminTeachersPage() {
  const { data, error, loading, reload, period, filters } = useDashboard({ withExport: false })
  const pager = usePager(data?.teachers ?? [], 10)

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading || !data) return <PageSkeleton />

  const students = data.teachers.reduce((s, t) => s + t.students, 0)
  const groups = data.teachers.reduce((s, t) => s + t.groups, 0)
  const avg = data.teachers.filter((t) => t.average_grade !== null)
  const attendance = data.teachers.filter((t) => t.attendance_rate !== null)

  return (
    <>
      <PageHeader title="Преподаватели" subtitle={`Нагрузка и результаты по активным группам · за ${periodLabel(period)}`} actions={filters} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Преподавателей" icon={Users} value={data.teachers.length} hint="ведут активные группы" />
        <StatCard label="Групп" icon={Award} value={groups} hint="в работе" />
        <StatCard label="Студентов" icon={Users} tone="info" value={students} hint="на активных группах" />
        <StatCard
          label="Средний балл"
          icon={TrendingUp}
          tone="success"
          value={fmtGrade(avg.length ? avg.reduce((s, t) => s + (t.average_grade ?? 0), 0) / avg.length : null)}
          hint={`посещаемость ${fmtPct(attendance.length ? attendance.reduce((s, t) => s + (t.attendance_rate ?? 0), 0) / attendance.length : null)}`}
        />
      </div>

      <Card title="Список преподавателей" subtitle={`${data.teachers.length} человек`} className="mt-6">
        <Table>
          <thead><tr><Th>Преподаватель</Th><Th>Групп</Th><Th>Студентов</Th><Th>Средний балл</Th><Th className="w-52">Посещаемость</Th></tr></thead>
          <tbody>
            {pager.visible.map((t) => (
              <tr key={t.id} className="hover:bg-surface/60">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={t.full_name} />
                    <span className="font-semibold text-primary">{t.full_name}</span>
                  </div>
                </Td>
                <Td>{t.groups}</Td>
                <Td>{t.students}</Td>
                <Td className="font-semibold text-primary">{fmtGrade(t.average_grade)}</Td>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <ProgressBar value={t.attendance_rate ?? 0} color={(t.attendance_rate ?? 100) < 80 ? 'var(--warning)' : undefined} />
                    <span className="w-10 text-right text-xs font-semibold">{fmtPct(t.attendance_rate)}</span>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pager page={pager.page} pageCount={pager.pageCount} onChange={pager.setPage} from={pager.from} to={pager.to} total={pager.total} />
      </Card>
    </>
  )
}
