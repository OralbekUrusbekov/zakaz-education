'use client'
import { useEffect } from 'react'
import { teacherApi } from '@/lib/api/teacher'
import type { TeacherGroup } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { Select } from './ui'

/** Выбор группы преподавателя. allowAll — добавить пункт «Все группы». */
export function useTeacherGroups() {
  return useApi(teacherApi.groups)
}

export function GroupSelect({
  groups, value, onChange, allowAll,
}: { groups: TeacherGroup[]; value: number | null; onChange: (id: number | null) => void; allowAll?: boolean }) {
  useEffect(() => {
    if (!allowAll && value === null && groups.length) onChange(groups[0].id)
  }, [allowAll, value, groups, onChange])
  return (
    <Select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="h-10 w-auto min-w-52 text-sm"
      aria-label="Группа"
    >
      {allowAll && <option value="">Все группы</option>}
      {groups.map((g) => <option key={g.id} value={g.id}>{g.name} · {g.course_name}</option>)}
    </Select>
  )
}
