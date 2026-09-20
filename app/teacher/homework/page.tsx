'use client'
import { useState } from 'react'
import { CheckCircle2, ClipboardCheck, Download, FileText, Plus, RotateCcw } from 'lucide-react'
import { GroupSelect, useTeacherGroups } from '@/components/cabinet/group-select'
import { useToast } from '@/components/cabinet/toast'
import {
  Avatar, Badge, Button, Card, EmptyState, ErrorState, Field, GradePill, Input, Modal, PageHeader, PageSkeleton,
  ProgressBar, Skeleton, Tabs, Td, Textarea, Th, Table,
} from '@/components/cabinet/ui'
import { fileUrl } from '@/lib/api/client'
import { teacherApi } from '@/lib/api/teacher'
import { fmtDate, fmtDateTime, relativeDays } from '@/lib/format'
import type { SubmissionStatus, TeacherSubmission } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'

function ReviewModal({ sub, onClose, onDone }: { sub: TeacherSubmission; onClose: () => void; onDone: () => void }) {
  const toast = useToast()
  const [grade, setGrade] = useState<number | null>(sub.grade)
  const [comment, setComment] = useState(sub.teacher_comment ?? '')
  const [busy, setBusy] = useState(false)
  const url = fileUrl(sub.file_url)

  const send = async (status: 'reviewed' | 'revision') => {
    if (status === 'reviewed' && !grade) return toast('Поставьте оценку', 'error')
    setBusy(true)
    try {
      await teacherApi.review(sub.id, { status, grade: status === 'reviewed' ? grade : null, teacher_comment: comment || null })
      toast(status === 'reviewed' ? 'Работа проверена' : 'Отправлено на доработку')
      onDone()
      onClose()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Ошибка', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="Проверка работы"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="secondary" onClick={() => send('revision')} disabled={busy}><RotateCcw size={15} />На доработку</Button>
          <Button onClick={() => send('reviewed')} disabled={busy}><CheckCircle2 size={16} />Принять</Button>
        </>
      }
    >
      <div className="flex items-center gap-3">
        <Avatar name={sub.student_name} size={44} />
        <div>
          <p className="font-semibold text-primary">{sub.student_name}</p>
          <p className="text-sm text-muted">{sub.group_name} · {sub.course_name}</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-surface p-4">
        <p className="font-semibold text-primary">{sub.homework_title}</p>
        <p className="mt-1 text-sm text-muted">{sub.homework_description}</p>
        <p className="mt-2 text-xs text-muted">Срок: {fmtDateTime(sub.due_date)} · Сдано: {fmtDateTime(sub.submitted_at)}
          {new Date(sub.submitted_at) > new Date(sub.due_date) && <Badge tone="warning" className="ml-2">С опозданием</Badge>}
        </p>
      </div>

      <p className="mt-5 mb-2 text-sm font-semibold text-primary">Ответ студента</p>
      {sub.text ? <p className="rounded-xl border border-line p-3.5 text-[15px] whitespace-pre-wrap text-primary/85">{sub.text}</p> : <p className="text-sm text-muted">Без текстового ответа</p>}
      {sub.file_name && (
        <div className="mt-3">
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2.5 text-sm font-medium text-primary hover:bg-surface">
              <Download size={15} />{sub.file_name}
            </a>
          ) : (
            <p className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2.5 text-sm text-muted"><FileText size={15} />{sub.file_name}</p>
          )}
        </div>
      )}

      <p className="mt-6 mb-2 text-sm font-semibold text-primary">Оценка</p>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
          <button key={v} onClick={() => setGrade(v)} className={cn('h-12 rounded-xl font-serif text-xl ring-1 transition', grade === v ? 'bg-primary text-white ring-primary' : 'ring-line hover:ring-primary')}>{v}</button>
        ))}
      </div>
      <Field label="Комментарий" className="mt-4">
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Что получилось, что доработать" className="min-h-24" />
      </Field>
    </Modal>
  )
}

function CreateHomeworkModal({ groupId, onClose, onDone }: { groupId: number; onClose: () => void; onDone: () => void }) {
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [due, setDue] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return `${d.toISOString().slice(0, 10)}T23:59`
  })
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!title.trim()) return toast('Введите название', 'error')
    setBusy(true)
    try {
      await teacherApi.createHomework({ group_id: groupId, title, description, due_date: `${due}:00` })
      toast('Задание создано')
      onDone()
      onClose()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Ошибка', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Новое задание" footer={<><Button variant="ghost" onClick={onClose}>Отмена</Button><Button onClick={save} disabled={busy}>Создать</Button></>}>
      <Field label="Название"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ДЗ: тема занятия" /></Field>
      <Field label="Описание" className="mt-4"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Что нужно выполнить" /></Field>
      <Field label="Срок сдачи" className="mt-4"><Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
    </Modal>
  )
}

export default function TeacherHomeworkPage() {
  const groups = useTeacherGroups()
  const [groupId, setGroupId] = useState<number | null>(null)
  const [tab, setTab] = useState<SubmissionStatus>('submitted')
  const [current, setCurrent] = useState<TeacherSubmission | null>(null)
  const [creating, setCreating] = useState(false)

  const subs = useApi(() => teacherApi.submissions(tab, groupId), [tab, groupId])
  const pending = useApi(() => teacherApi.submissions('submitted', groupId), [groupId])
  const homework = useApi(() => teacherApi.homework(groupId), [groupId])

  if (groups.error) return <ErrorState message={groups.error} onRetry={groups.reload} />
  if (!groups.data) return <PageSkeleton />

  const refresh = () => { subs.reload(); pending.reload(); homework.reload() }

  return (
    <>
      <PageHeader
        title="Домашние задания"
        subtitle="Проверка работ и выдача новых заданий"
        actions={
          <>
            <GroupSelect groups={groups.data} value={groupId} onChange={setGroupId} allowAll />
            <Button onClick={() => setCreating(true)} disabled={!groupId && !groups.data.length}><Plus size={16} />Выдать задание</Button>
          </>
        }
      />

      <Card
        title="Очередь проверки"
        subtitle={`${pending.data?.length ?? 0} работ ожидают оценки`}
        action={
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'submitted', label: 'На проверке', count: pending.data?.length },
              { value: 'revision', label: 'На доработке' },
              { value: 'reviewed', label: 'Проверенные' },
            ]}
          />
        }
      >
        {subs.error ? (
          <ErrorState message={subs.error} onRetry={subs.reload} />
        ) : !subs.data ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : subs.data.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title={tab === 'submitted' ? 'Все работы проверены' : 'Здесь пусто'} />
        ) : (
          <div className="space-y-2">
            {subs.data.map((s) => (
              <button key={s.id} onClick={() => setCurrent(s)} className="flex w-full flex-wrap items-center gap-3 rounded-xl border border-line p-3.5 text-left transition hover:bg-surface/70">
                <Avatar name={s.student_name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-primary">{s.student_name}</p>
                  <p className="truncate text-xs text-muted">{s.group_name} · {s.homework_title}</p>
                </div>
                <span className="text-xs text-muted">{relativeDays(s.submitted_at)}</span>
                {s.grade !== null && <GradePill value={s.grade} />}
                {s.status === 'submitted' && <Badge tone="gold">Проверить</Badge>}
                {s.status === 'revision' && <Badge tone="warning">На доработке</Badge>}
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card title="Выданные задания" className="mt-6">
        {!homework.data ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : homework.data.length === 0 ? (
          <EmptyState title="Заданий пока нет" action={<Button size="sm" onClick={() => setCreating(true)}><Plus size={15} />Выдать задание</Button>} />
        ) : (
          <Table>
            <thead><tr><Th>Задание</Th><Th>Группа</Th><Th>Срок</Th><Th className="w-56">Сдано</Th><Th>Проверено</Th></tr></thead>
            <tbody>
              {homework.data.map((h) => (
                <tr key={h.id} className="hover:bg-surface/60">
                  <Td className="font-medium text-primary">{h.title}</Td>
                  <Td className="text-muted">{h.group_name}</Td>
                  <Td className={cn('text-muted', new Date(h.due_date) > new Date() && 'font-medium text-primary')}>{fmtDate(h.due_date)}</Td>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <ProgressBar value={h.students ? (100 * h.submitted) / h.students : 0} />
                      <span className="w-12 text-right text-xs text-muted">{h.submitted}/{h.students}</span>
                    </div>
                  </Td>
                  <Td className="text-muted">{h.reviewed}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {current && <ReviewModal sub={current} onClose={() => setCurrent(null)} onDone={refresh} />}
      {creating && (groupId ?? groups.data[0]?.id) !== undefined && (
        <CreateHomeworkModal groupId={(groupId ?? groups.data[0].id)!} onClose={() => setCreating(false)} onDone={refresh} />
      )}
    </>
  )
}
