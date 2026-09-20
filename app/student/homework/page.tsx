'use client'
import { useMemo, useState } from 'react'
import { CalendarClock, ClipboardList, Download, MessageSquareText, Paperclip, Send } from 'lucide-react'
import { FileDrop } from '@/components/cabinet/file-drop'
import { useToast } from '@/components/cabinet/toast'
import { Button, Card, EmptyState, ErrorState, Field, GradePill, Modal, PageHeader, PageSkeleton, StatusBadge, Tabs, Textarea } from '@/components/cabinet/ui'
import { fileUrl } from '@/lib/api/client'
import { studentApi } from '@/lib/api/student'
import { fmtDateTime, homeworkLabel, relativeDays } from '@/lib/format'
import type { HomeworkStatus, StudentHomework } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'

type Tab = 'active' | 'submitted' | 'reviewed' | 'overdue'
const TAB_STATUSES: Record<Tab, HomeworkStatus[]> = {
  active: ['active', 'revision'],
  submitted: ['submitted'],
  reviewed: ['reviewed'],
  overdue: ['overdue'],
}

function SubmitModal({ hw, onClose, onDone }: { hw: StudentHomework; onClose: () => void; onDone: (h: StudentHomework) => void }) {
  const toast = useToast()
  const [text, setText] = useState(hw.submission?.text ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!text.trim() && !file) return toast('Добавьте ответ или файл', 'error')
    setSaving(true)
    try {
      onDone(await studentApi.submitHomework(hw.id, text, file))
      toast('Работа отправлена на проверку')
      onClose()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Ошибка отправки', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Сдать задание"
      footer={<><Button variant="ghost" onClick={onClose}>Отмена</Button><Button onClick={submit} disabled={saving}><Send size={16} />{saving ? 'Отправка…' : 'Отправить'}</Button></>}
    >
      <p className="font-semibold text-primary">{hw.title}</p>
      <p className="mt-1 text-sm text-muted">{hw.course_name} · срок {fmtDateTime(hw.due_date)}</p>
      {hw.status === 'revision' && hw.submission?.teacher_comment && (
        <p className="mt-3 rounded-xl bg-warning-light p-3 text-sm text-warning">Комментарий преподавателя: {hw.submission.teacher_comment}</p>
      )}
      <Field label="Ответ" className="mt-5">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Опишите решение или оставьте комментарий" />
      </Field>
      <div className="mt-4">
        <span className="mb-1.5 block text-sm font-medium text-primary">Файл</span>
        <FileDrop file={file} onChange={setFile} onError={(m) => toast(m, 'error')} />
        {hw.submission?.file_name && !file && <p className="mt-2 text-xs text-muted">Ранее прикреплён: {hw.submission.file_name}</p>}
      </div>
    </Modal>
  )
}

function HomeworkCard({ hw, onSubmit }: { hw: StudentHomework; onSubmit: () => void }) {
  const sub = hw.submission
  const canSubmit = hw.status === 'active' || hw.status === 'revision' || hw.status === 'overdue'
  const soon = hw.status === 'active' && new Date(hw.due_date).getTime() - Date.now() < 2 * 86400000
  const url = fileUrl(sub?.file_url ?? null)
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-5 transition hover:shadow-[0_8px_24px_rgba(16,24,40,.07)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-medium text-muted">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: hw.course_color }} />
          {hw.course_name}
        </span>
        <StatusBadge status={hw.status} map={homeworkLabel} />
      </div>
      <h3 className="mt-3 font-serif text-lg leading-snug text-primary">{hw.title}</h3>
      <p className="mt-1.5 line-clamp-3 text-sm text-muted">{hw.description}</p>
      <p className={cn('mt-3 flex items-center gap-1.5 text-sm', soon || hw.status === 'overdue' ? 'font-medium text-danger' : 'text-muted')}>
        <CalendarClock size={15} /> Срок: {relativeDays(hw.due_date)}, {new Date(hw.due_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
      </p>

      {sub && (
        <div className="mt-4 space-y-2 rounded-xl bg-surface p-3.5 text-sm">
          <p className="text-xs text-muted">Сдано {fmtDateTime(sub.submitted_at)}</p>
          {sub.file_name && (
            url ? (
              <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-medium text-primary underline decoration-gold underline-offset-4"><Download size={14} />{sub.file_name}</a>
            ) : (
              <p className="flex items-center gap-1.5 text-primary"><Paperclip size={14} />{sub.file_name}</p>
            )
          )}
          {(sub.grade !== null || sub.teacher_comment) && (
            <div className="flex items-start gap-3 border-t border-line pt-2.5">
              {sub.grade !== null && <GradePill value={sub.grade} />}
              {sub.teacher_comment && <p className="flex-1 text-primary/85"><MessageSquareText size={14} className="mr-1 inline text-muted" />{sub.teacher_comment}</p>}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-4">
        {canSubmit && (
          <Button variant={hw.status === 'overdue' ? 'secondary' : 'primary'} size="sm" className="w-full" onClick={onSubmit}>
            <Send size={15} /> {hw.status === 'revision' ? 'Сдать повторно' : hw.status === 'overdue' ? 'Сдать с опозданием' : 'Сдать задание'}
          </Button>
        )}
        {hw.status === 'submitted' && <Button variant="ghost" size="sm" className="w-full" onClick={onSubmit}>Изменить ответ</Button>}
      </div>
    </article>
  )
}

export default function StudentHomeworkPage() {
  const { data, error, loading, reload, setData } = useApi(studentApi.homework)
  const [tab, setTab] = useState<Tab>('active')
  const [current, setCurrent] = useState<StudentHomework | null>(null)

  const counts = useMemo(() => {
    const c = { active: 0, submitted: 0, reviewed: 0, overdue: 0 } as Record<Tab, number>
    for (const h of data ?? []) for (const t of Object.keys(TAB_STATUSES) as Tab[]) if (TAB_STATUSES[t].includes(h.status)) c[t]++
    return c
  }, [data])

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading || !data) return <PageSkeleton />

  const items = data
    .filter((h) => TAB_STATUSES[tab].includes(h.status))
    .sort((a, b) => (tab === 'active' ? +new Date(a.due_date) - +new Date(b.due_date) : +new Date(b.due_date) - +new Date(a.due_date)))

  return (
    <>
      <PageHeader title="Домашние задания" subtitle="Сдавайте работы и получайте обратную связь от преподавателей" />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'active', label: 'Активные', count: counts.active },
          { value: 'submitted', label: 'Сданные', count: counts.submitted },
          { value: 'reviewed', label: 'Проверенные', count: counts.reviewed },
          { value: 'overdue', label: 'Просроченные', count: counts.overdue },
        ]}
      />
      {items.length === 0 ? (
        <Card><EmptyState icon={ClipboardList} title={tab === 'active' ? 'Все задания выполнены' : 'Здесь пока пусто'} text={tab === 'active' ? 'Новые задания появятся после занятий.' : undefined} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((h) => <HomeworkCard key={h.id} hw={h} onSubmit={() => setCurrent(h)} />)}
        </div>
      )}
      {current && (
        <SubmitModal
          hw={current}
          onClose={() => setCurrent(null)}
          onDone={(updated) => setData((list) => list?.map((h) => (h.id === updated.id ? updated : h)) ?? null)}
        />
      )}
    </>
  )
}
