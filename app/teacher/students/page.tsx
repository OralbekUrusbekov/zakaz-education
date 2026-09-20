'use client'
import { useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, Mail, Phone, Search, Send, Users } from 'lucide-react'
import { GroupSelect, useTeacherGroups } from '@/components/cabinet/group-select'
import { Pager, usePager } from '@/components/cabinet/pager'
import { useToast } from '@/components/cabinet/toast'
import {
  Avatar, Button, Card, EmptyState, ErrorState, GradePill, Input, PageHeader, PageSkeleton, ProgressBar, Select, Sheet,
  Skeleton, StatusBadge, Table, Td, Textarea, Th,
} from '@/components/cabinet/ui'
import { teacherApi } from '@/lib/api/teacher'
import { attendanceLabel, commentKindLabel, fmtDate, fmtGrade, fmtPct, gradeTypeLabel, paymentLabel, relativeDays } from '@/lib/format'
import type { CommentKind, TeacherStudent } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'

type SortKey = 'name' | 'attendance' | 'grade' | 'activity'

function StudentPanel({ student, onClose }: { student: TeacherStudent; onClose: () => void }) {
  const toast = useToast()
  const { data, error, loading, reload } = useApi(() => teacherApi.student(student.id, student.group_id), [student.id, student.group_id])
  const [kind, setKind] = useState<CommentKind>('recommendation')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      await teacherApi.createComment({ student_id: student.id, kind, text })
      setText('')
      toast('Комментарий отправлен')
      reload()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Ошибка', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet open onClose={onClose} title="Профиль студента">
      <div className="flex items-center gap-4">
        <Avatar name={student.full_name} size={56} />
        <div>
          <p className="font-serif text-xl text-primary">{student.full_name}</p>
          <p className="text-sm text-muted">{student.group_name} · {student.course_name}</p>
        </div>
      </div>
      <div className="mt-4 space-y-1.5 text-sm">
        <a href={`mailto:${student.email}`} className="flex items-center gap-2 text-primary"><Mail size={15} className="text-muted" />{student.email}</a>
        {student.phone && <a href={`tel:${student.phone}`} className="flex items-center gap-2 text-primary"><Phone size={15} className="text-muted" />{student.phone}</a>}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-surface p-3"><p className="font-serif text-xl text-primary">{fmtPct(student.attendance_rate)}</p><p className="text-[11px] text-muted">посещаемость</p></div>
        <div className="rounded-xl bg-surface p-3"><p className="font-serif text-xl text-primary">{fmtGrade(student.average_grade)}</p><p className="text-[11px] text-muted">ср. балл</p></div>
        <div className="rounded-xl bg-surface p-3"><p className="font-serif text-xl text-primary">{data ? `${data.homework_submitted}/${data.homework_total}` : '—'}</p><p className="text-[11px] text-muted">ДЗ сдано</p></div>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-line p-3 text-sm">
        <span className="text-muted">Оплата</span>
        <StatusBadge status={student.payment_status} map={paymentLabel} />
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Skeleton className="mt-5 h-60 rounded-xl" />}
      {data && (
        <>
          <p className="mt-6 mb-2 text-sm font-semibold text-primary">Последние оценки</p>
          {data.recent_grades.length ? (
            <div className="flex flex-wrap gap-1.5">
              {data.recent_grades.map((g) => (
                <span key={g.id} title={`${fmtDate(g.date)} · ${gradeTypeLabel[g.type]}`}><GradePill value={g.value} /></span>
              ))}
            </div>
          ) : <p className="text-sm text-muted">Нет оценок</p>}

          <p className="mt-6 mb-2 text-sm font-semibold text-primary">Последние занятия</p>
          <div className="space-y-1.5">
            {data.recent_attendance.map((a) => (
              <div key={a.lesson_id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-muted">{fmtDate(a.date)} · {a.topic}</span>
                <StatusBadge status={a.status} map={attendanceLabel} />
              </div>
            ))}
          </div>

          <p className="mt-6 mb-2 text-sm font-semibold text-primary">Комментарии</p>
          <div className="space-y-2">
            {data.comments.map((c) => (
              <div key={c.id} className="rounded-xl bg-surface p-3 text-sm">
                <div className="mb-1 flex items-center gap-2"><StatusBadge status={c.kind} map={commentKindLabel} /><span className="text-xs text-muted">{relativeDays(c.created_at)}</span></div>
                <p className="text-primary/85">{c.text}</p>
              </div>
            ))}
            {data.comments.length === 0 && <p className="text-sm text-muted">Вы ещё не оставляли комментариев</p>}
          </div>
          <div className="mt-3 space-y-2 rounded-xl border border-line p-3">
            <Select value={kind} onChange={(e) => setKind(e.target.value as CommentKind)} className="h-9 text-sm">
              {(Object.keys(commentKindLabel) as CommentKind[]).map((k) => <option key={k} value={k}>{commentKindLabel[k][0]}</option>)}
            </Select>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Комментарий студенту" className="min-h-20 text-sm" />
            <Button size="sm" className="w-full" onClick={send} disabled={sending || !text.trim()}><Send size={14} /> Отправить</Button>
          </div>
        </>
      )}
    </Sheet>
  )
}

export default function TeacherStudentsPage() {
  const groups = useTeacherGroups()
  const [groupId, setGroupId] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('name')
  const [selected, setSelected] = useState<TeacherStudent | null>(null)

  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get('group')
    if (g) setGroupId(Number(g))
    setReady(true)
  }, [])

  const { data, error, loading, reload } = useApi(
    () => (ready ? teacherApi.students(groupId) : Promise.resolve(null)),
    [groupId, ready],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = (data ?? []).filter((s) => !q || s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
    const by: Record<SortKey, (a: TeacherStudent, b: TeacherStudent) => number> = {
      name: (a, b) => a.last_name.localeCompare(b.last_name, 'ru'),
      attendance: (a, b) => (a.attendance_rate ?? 101) - (b.attendance_rate ?? 101),
      grade: (a, b) => (a.average_grade ?? 6) - (b.average_grade ?? 6),
      activity: (a, b) => +new Date(b.last_active_at ?? 0) - +new Date(a.last_active_at ?? 0),
    }
    return [...list].sort(by[sort])
  }, [data, query, sort])
  const pager = usePager(rows, 20, `${groupId}|${query}|${sort}`)

  if (error || groups.error) return <ErrorState message={error ?? groups.error ?? ''} onRetry={reload} />
  if (!data || !groups.data) return <PageSkeleton />

  return (
    <>
      <PageHeader title="Студенты" subtitle={`${rows.length} в выбранных группах`} />
      <Card bodyClassName="p-4 md:p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по имени или email" className="h-10 pl-10 text-sm" />
          </div>
          <GroupSelect groups={groups.data} value={groupId} onChange={setGroupId} allowAll />
          <div className="flex items-center gap-2">
            <ArrowDownUp size={16} className="text-muted" />
            <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-10 w-auto text-sm" aria-label="Сортировка">
              <option value="name">По фамилии</option>
              <option value="attendance">Низкая посещаемость</option>
              <option value="grade">Низкий балл</option>
              <option value="activity">Недавняя активность</option>
            </Select>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Users} title="Студенты не найдены" />
        ) : (
          <div className={cn(loading && 'opacity-60')}>
            <div className="hidden md:block">
              <Table>
                <thead><tr><Th>Студент</Th><Th>Группа</Th><Th className="w-48">Посещаемость</Th><Th>Ср. балл</Th><Th>Оплата</Th><Th>Активность</Th></tr></thead>
                <tbody>
                  {pager.visible.map((s) => (
                    <tr key={`${s.id}-${s.group_id}`} onClick={() => setSelected(s)} className="cursor-pointer transition hover:bg-surface/70">
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar name={s.full_name} />
                          <div className="min-w-0"><p className="font-semibold text-primary">{s.full_name}</p><p className="truncate text-xs text-muted">{s.email}</p></div>
                        </div>
                      </Td>
                      <Td className="text-muted">{s.group_name}</Td>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <ProgressBar value={s.attendance_rate ?? 0} color={(s.attendance_rate ?? 100) < 75 ? 'var(--danger)' : undefined} />
                          <span className="w-10 text-right text-xs font-semibold">{fmtPct(s.attendance_rate)}</span>
                        </div>
                      </Td>
                      <Td>{s.average_grade !== null ? <GradePill value={Number(s.average_grade.toFixed(1))} className="w-11" /> : '—'}</Td>
                      <Td><StatusBadge status={s.payment_status} map={paymentLabel} /></Td>
                      <Td className="text-xs text-muted">{s.last_active_at ? relativeDays(s.last_active_at) : '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="space-y-3 md:hidden">
              {pager.visible.map((s) => (
                <button key={`${s.id}-${s.group_id}`} onClick={() => setSelected(s)} className="w-full rounded-xl border border-line p-4 text-left">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.full_name} />
                    <div className="min-w-0 flex-1"><p className="font-semibold text-primary">{s.full_name}</p><p className="text-xs text-muted">{s.group_name}</p></div>
                    <StatusBadge status={s.payment_status} map={paymentLabel} />
                  </div>
                  <div className="mt-3 flex gap-4 text-sm"><span>Посещ.: <b>{fmtPct(s.attendance_rate)}</b></span><span>Балл: <b>{fmtGrade(s.average_grade)}</b></span></div>
                </button>
              ))}
            </div>
            <Pager page={pager.page} pageCount={pager.pageCount} onChange={pager.setPage} from={pager.from} to={pager.to} total={pager.total} />
          </div>
        )}
      </Card>
      {selected && <StudentPanel student={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
