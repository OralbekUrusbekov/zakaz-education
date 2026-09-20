'use client'
import { useMemo, useState } from 'react'
import { CalendarX2, TriangleAlert, Wallet } from 'lucide-react'
import { Avatar, Badge, Card, EmptyState, ErrorState, PageHeader, PageSkeleton, StatCard, Table, Tabs, Td, Th } from '@/components/cabinet/ui'
import { Pager, usePager } from '@/components/cabinet/pager'
import { periodLabel, useDashboard } from '@/components/admin/use-dashboard'
import { fmtGrade, fmtMoney, fmtPct } from '@/lib/format'

type Filter = 'all' | 'attendance' | 'grades' | 'debt'
const REASON: Record<Exclude<Filter, 'all'>, string> = {
  attendance: 'Низкая посещаемость',
  grades: 'Низкая успеваемость',
  debt: 'Задолженность по оплате',
}

export default function AdminRiskPage() {
  const { data, error, loading, reload, period, filters } = useDashboard({ withExport: false })
  const [filter, setFilter] = useState<Filter>('all')

  const rows = useMemo(
    () => (data?.at_risk ?? []).filter((s) => filter === 'all' || s.reasons.includes(REASON[filter])),
    [data, filter],
  )
  const pager = usePager(rows, 10, filter)

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading || !data) return <PageSkeleton />

  const count = (f: Exclude<Filter, 'all'>) => data.at_risk.filter((s) => s.reasons.includes(REASON[f])).length
  const debt = data.at_risk.reduce((s, x) => s + x.debt, 0)

  return (
    <>
      <PageHeader title="Студенты в зоне риска" subtitle={`Требуют внимания кураторов · за ${periodLabel(period)}`} actions={filters} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Всего в зоне риска" icon={TriangleAlert} tone="danger" value={data.at_risk.length} hint="активных студентов" />
        <StatCard label="Низкая посещаемость" icon={CalendarX2} tone="warning" value={count('attendance')} hint="ниже 75%" />
        <StatCard label="Низкая успеваемость" icon={TriangleAlert} tone="warning" value={count('grades')} hint="средний балл ниже 7" />
        <StatCard label="Задолженность" icon={Wallet} tone="danger" value={fmtMoney(debt)} hint={`${count('debt')} студентов`} />
      </div>

      <Card
        title="Список"
        subtitle={`${rows.length} студентов`}
        className="mt-6"
        action={
          <Tabs
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: 'all', label: 'Все', count: data.at_risk.length },
              { value: 'attendance', label: 'Посещаемость', count: count('attendance') },
              { value: 'grades', label: 'Успеваемость', count: count('grades') },
              { value: 'debt', label: 'Оплата', count: count('debt') },
            ]}
          />
        }
      >
        {rows.length === 0 ? (
          <EmptyState icon={TriangleAlert} title="Студентов в этой категории нет" />
        ) : (
          <>
            <Table>
              <thead><tr><Th>Студент</Th><Th>Группа</Th><Th>Посещаемость</Th><Th>Средний балл</Th><Th>Долг</Th><Th>Причины</Th></tr></thead>
              <tbody>
                {pager.visible.map((s, i) => (
                  <tr key={`${s.id}-${i}`} className="hover:bg-surface/60">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={s.full_name} />
                        <span className="font-semibold text-primary">{s.full_name}</span>
                      </div>
                    </Td>
                    <Td className="text-muted">{s.group_name}</Td>
                    <Td className={(s.attendance_rate ?? 100) < 75 ? 'font-semibold text-danger' : ''}>{fmtPct(s.attendance_rate)}</Td>
                    <Td className={(s.average_grade ?? 10) < 7 ? 'font-semibold text-danger' : ''}>{fmtGrade(s.average_grade)}</Td>
                    <Td className={s.debt ? 'text-danger' : 'text-muted'}>{s.debt ? fmtMoney(s.debt) : '—'}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">{s.reasons.map((r) => <Badge key={r} tone="danger">{r}</Badge>)}</div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pager page={pager.page} pageCount={pager.pageCount} onChange={pager.setPage} from={pager.from} to={pager.to} total={pager.total} />
          </>
        )}
      </Card>
    </>
  )
}
