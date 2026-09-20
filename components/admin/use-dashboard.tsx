'use client'
import { useState, type ReactNode } from 'react'
import { Download } from 'lucide-react'
import { useToast } from '@/components/cabinet/toast'
import { Button, Select, Tabs } from '@/components/cabinet/ui'
import { adminApi } from '@/lib/api/admin'
import type { Dashboard, Period } from '@/lib/types'
import { useApi } from '@/lib/use-api'

export const PERIODS: { value: Period; label: string }[] = [
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'year', label: 'Год' },
]

export const periodLabel = (p: Period) => PERIODS.find((x) => x.value === p)!.label.toLowerCase()

export function exportCsv(d: Dashboard, period: Period) {
  const rows: (string | number)[][] = [
    ['Отчёт Tech School', new Date().toLocaleDateString('ru-RU'), `период: ${PERIODS.find((p) => p.value === period)?.label}`],
    [],
    ['Показатель', 'Значение', 'Изменение, %'],
    ['Всего студентов', d.total_students.value, d.total_students.delta ?? ''],
    ['Активных студентов', d.active_students.value, d.active_students.delta ?? ''],
    ['Посещаемость, %', d.attendance_rate.value, d.attendance_rate.delta ?? ''],
    ['Средний балл', d.average_grade.value, d.average_grade.delta ?? ''],
    ['Завершили обучение', d.graduates.value, d.graduates.delta ?? ''],
    [],
    ['Курс', 'Категория', 'Записано', 'Активных', 'Завершили', '% завершения'],
    ...d.courses.map((c) => [c.course_name, c.category, c.enrolled, c.active, c.completed, c.completion_rate]),
    [],
    ['Преподаватель', 'Групп', 'Студентов', 'Средний балл', 'Посещаемость, %'],
    ...d.teachers.map((t) => [t.full_name, t.groups, t.students, t.average_grade ?? '', t.attendance_rate ?? '']),
  ]
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `techschool-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/** Общие фильтры и загрузка данных для всех страниц руководства. */
export function useDashboard({ withExport = true }: { withExport?: boolean } = {}) {
  const toast = useToast()
  const [period, setPeriod] = useState<Period>('month')
  const [courseId, setCourseId] = useState<number | null>(null)
  const { data, error, loading, reload } = useApi(() => adminApi.dashboard(period, courseId), [period, courseId])
  const courses = useApi(adminApi.courses)

  const filters: ReactNode = (
    <>
      <Tabs value={period} onChange={setPeriod} tabs={PERIODS} />
      <Select
        value={courseId ?? ''}
        onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : null)}
        className="h-10 w-auto min-w-44 text-sm"
        aria-label="Курс"
      >
        <option value="">Все курсы</option>
        {(courses.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      {withExport && data && (
        <Button variant="secondary" onClick={() => { exportCsv(data, period); toast('Отчёт выгружен') }}>
          <Download size={16} />Экспорт
        </Button>
      )}
    </>
  )

  return { data, error, loading, reload, period, courseId, filters }
}
