'use client'
import { useMemo, useState } from 'react'
import { MessageSquareText, Send } from 'lucide-react'
import { Pager, usePager } from '@/components/cabinet/pager'
import { useToast } from '@/components/cabinet/toast'
import {
  Avatar, Button, Card, EmptyState, ErrorState, Field, PageHeader, PageSkeleton, Select, Skeleton, StatusBadge, Tabs, Textarea,
} from '@/components/cabinet/ui'
import { teacherApi } from '@/lib/api/teacher'
import { commentKindLabel, fmtDateTime, relativeDays } from '@/lib/format'
import type { CommentKind } from '@/lib/types'
import { useApi } from '@/lib/use-api'

const TEMPLATES: Record<CommentKind, string[]> = {
  praise: ['Отличная работа на занятии, так держать!', 'Заметен большой прогресс за последний месяц.'],
  remark: ['Пропущено несколько занятий подряд, нужно наверстать материал.', 'Домашние задания сдаются с опозданием.'],
  recommendation: ['Рекомендую повторить материал последних двух тем.', 'Советую больше практиковаться: пиши код каждый день хотя бы по 30 минут.'],
}

export default function TeacherCommentsPage() {
  const toast = useToast()
  const students = useApi(() => teacherApi.students(null))
  const comments = useApi(() => teacherApi.comments())
  const [studentId, setStudentId] = useState<number | ''>('')
  const [kind, setKind] = useState<CommentKind>('recommendation')
  const [text, setText] = useState('')
  const [filter, setFilter] = useState<'all' | CommentKind>('all')
  const [busy, setBusy] = useState(false)

  const uniqueStudents = useMemo(() => {
    const map = new Map<number, string>()
    for (const s of students.data ?? []) map.set(s.id, `${s.full_name} · ${s.group_name}`)
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'ru'))
  }, [students.data])

  const send = async () => {
    if (!studentId) return toast('Выберите студента', 'error')
    if (!text.trim()) return toast('Напишите комментарий', 'error')
    setBusy(true)
    try {
      await teacherApi.createComment({ student_id: Number(studentId), kind, text })
      setText('')
      toast('Комментарий отправлен студенту')
      comments.reload()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Ошибка', 'error')
    } finally {
      setBusy(false)
    }
  }

  const list = (comments.data ?? []).filter((c) => filter === 'all' || c.kind === filter)
  const pager = usePager(list, 10, filter)

  if (students.error || comments.error) return <ErrorState message={students.error ?? comments.error ?? ''} onRetry={() => { students.reload(); comments.reload() }} />
  if (!students.data) return <PageSkeleton />

  return (
    <>
      <PageHeader title="Комментарии студентам" subtitle="Студент увидит комментарий в своём личном кабинете" />
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card title="Новый комментарий">
          <Field label="Студент">
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Выберите студента</option>
              {uniqueStudents.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Select>
          </Field>
          <Field label="Тип" className="mt-4">
            <Select value={kind} onChange={(e) => setKind(e.target.value as CommentKind)}>
              {(Object.keys(commentKindLabel) as CommentKind[]).map((k) => <option key={k} value={k}>{commentKindLabel[k][0]}</option>)}
            </Select>
          </Field>
          <Field label="Текст" className="mt-4">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Что важно сказать студенту" />
          </Field>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TEMPLATES[kind].map((t) => (
              <button key={t} onClick={() => setText(t)} className="rounded-full bg-surface px-3 py-1 text-xs text-muted transition hover:text-primary">
                {t.length > 34 ? `${t.slice(0, 34)}…` : t}
              </button>
            ))}
          </div>
          <Button className="mt-4 w-full" onClick={send} disabled={busy}><Send size={16} />{busy ? 'Отправка…' : 'Отправить'}</Button>
        </Card>

        <Card
          title="История"
          subtitle={`${comments.data?.length ?? 0} комментариев`}
          action={
            <Tabs
              value={filter}
              onChange={setFilter}
              tabs={[{ value: 'all', label: 'Все' }, ...(Object.keys(commentKindLabel) as CommentKind[]).map((k) => ({ value: k, label: commentKindLabel[k][0] }))]}
            />
          }
        >
          {!comments.data ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : list.length === 0 ? (
            <EmptyState icon={MessageSquareText} title="Комментариев пока нет" text="Напишите первый — студент увидит его в кабинете." />
          ) : (
            <div className="divide-y divide-line">
              {pager.visible.map((c) => (
                <div key={c.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <Avatar name={c.student_name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-primary">{c.student_name}</p>
                      <StatusBadge status={c.kind} map={commentKindLabel} />
                      <span className="text-xs text-muted" title={fmtDateTime(c.created_at)}>{relativeDays(c.created_at)}</span>
                    </div>
                    <p className="mt-1 text-[15px] leading-relaxed text-primary/85">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {list.length > 0 && (
            <Pager page={pager.page} pageCount={pager.pageCount} onChange={pager.setPage} from={pager.from} to={pager.to} total={pager.total} />
          )}
        </Card>
      </div>
    </>
  )
}
