'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { NotebookPen, Plus, Trash2 } from 'lucide-react'
import { GroupSelect, useTeacherGroups } from '@/components/cabinet/group-select'
import { useToast } from '@/components/cabinet/toast'
import { Button, Card, EmptyState, ErrorState, Field, GradePill, Input, Modal, PageHeader, PageSkeleton, Select, Skeleton } from '@/components/cabinet/ui'
import { teacherApi } from '@/lib/api/teacher'
import { fmtDate, fmtGrade, gradeTone, gradeTypeLabel } from '@/lib/format'
import type { Grade, GradeType, Gradebook, LessonBrief } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'

type Editing = { studentId: number; studentName: string; lesson: LessonBrief | null; grade: Grade | null }

const toneBg: Record<string, string> = {
  success: 'bg-success-light text-success', info: 'bg-info-light text-info', warning: 'bg-warning-light text-warning', danger: 'bg-danger-light text-danger',
}

function GradeEditor({ editing, groupId, students, onClose, onSaved }: {
  editing: Editing; groupId: number; students: Gradebook['students']; onClose: () => void; onSaved: (g: Grade | null, removedId?: number) => void
}) {
  const toast = useToast()
  const [studentId, setStudentId] = useState(editing.studentId)
  const [value, setValue] = useState(editing.grade?.value ?? 9)
  const [type, setType] = useState<GradeType>(editing.grade?.type ?? (editing.lesson ? 'classwork' : 'test'))
  const [comment, setComment] = useState(editing.grade?.comment ?? '')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const saved = editing.grade
        ? await teacherApi.updateGrade(editing.grade.id, { value, type, comment: comment || null })
        : await teacherApi.createGrade({ student_id: studentId, group_id: groupId, lesson_id: editing.lesson?.id ?? null, value, type, comment: comment || null })
      onSaved(saved)
      toast('Оценка сохранена')
      onClose()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Ошибка', 'error')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!editing.grade) return
    setBusy(true)
    try {
      await teacherApi.deleteGrade(editing.grade.id)
      onSaved(null, editing.grade.id)
      toast('Оценка удалена')
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
      onClose={onClose}
      title={editing.grade ? 'Изменить оценку' : 'Поставить оценку'}
      footer={
        <>
          {editing.grade && <Button variant="danger" className="mr-auto" onClick={remove} disabled={busy}><Trash2 size={15} />Удалить</Button>}
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={save} disabled={busy}>Сохранить</Button>
        </>
      }
    >
      {editing.studentId ? (
        <p className="font-semibold text-primary">{editing.studentName}</p>
      ) : (
        <Field label="Студент">
          <Select value={studentId || ''} onChange={(e) => setStudentId(Number(e.target.value))}>
            <option value="" disabled>Выберите студента</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </Select>
        </Field>
      )}
      <p className="mt-1 text-sm text-muted">{editing.lesson ? `${fmtDate(editing.lesson.starts_at)} · ${editing.lesson.topic}` : 'Без привязки к занятию'}</p>

      <p className="mt-5 mb-2 text-sm font-medium text-primary">Оценка</p>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
          <button
            key={v}
            onClick={() => setValue(v)}
            className={cn('h-12 rounded-xl font-serif text-xl transition', value === v ? 'bg-primary text-white' : cn('ring-1 ring-line hover:ring-primary', toneBg[gradeTone(v)]))}
          >{v}</button>
        ))}
      </div>
      <Field label="Тип" className="mt-4">
        <Select value={type} onChange={(e) => setType(e.target.value as GradeType)}>
          {(Object.keys(gradeTypeLabel) as GradeType[]).map((t) => <option key={t} value={t}>{gradeTypeLabel[t]}</option>)}
        </Select>
      </Field>
      <Field label="Комментарий" className="mt-4">
        <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Необязательно" />
      </Field>
      {!editing.studentId && !studentId && <p className="mt-3 text-xs text-danger">Выберите студента</p>}
    </Modal>
  )
}

export default function TeacherGradebookPage() {
  const groups = useTeacherGroups()
  const [groupId, setGroupId] = useState<number | null>(null)
  const { data, error, loading, reload, setData } = useApi(
    () => (groupId ? teacherApi.gradebook(groupId) : Promise.resolve(null)),
    [groupId],
  )
  const [editing, setEditing] = useState<Editing | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth
  }, [data?.group.id])

  const cells = useMemo(() => {
    const m = new Map<string, Grade>()
    const other = new Map<number, Grade[]>()
    for (const g of data?.grades ?? []) {
      if (g.lesson_id) m.set(`${g.student_id}:${g.lesson_id}`, g)
      else other.set(g.student_id, [...(other.get(g.student_id) ?? []), g])
    }
    return { m, other }
  }, [data])

  if (groups.error) return <ErrorState message={groups.error} onRetry={groups.reload} />
  if (!groups.data) return <PageSkeleton />

  const onSaved = (g: Grade | null, removedId?: number) =>
    setData((d) => {
      if (!d) return d
      let grades = d.grades.filter((x) => x.id !== removedId)
      if (g) grades = grades.some((x) => x.id === g.id) ? grades.map((x) => (x.id === g.id ? g : x)) : [...grades, g]
      return { ...d, grades }
    })

  return (
    <>
      <PageHeader
        title="Журнал оценок"
        subtitle="Нажмите на ячейку, чтобы поставить или изменить оценку"
        actions={
          <>
            <GroupSelect groups={groups.data} value={groupId} onChange={setGroupId} />
            {data && <Button onClick={() => setEditing({ studentId: 0, studentName: '', lesson: null, grade: null })}><Plus size={16} />Оценка</Button>}
          </>
        }
      />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : data.students.length === 0 ? (
        <Card><EmptyState icon={NotebookPen} title="В группе нет студентов" /></Card>
      ) : (
        <Card bodyClassName="p-0" className={cn('md:-mx-4 xl:-mx-6', loading && 'opacity-60')}>
          <div ref={scroller} className="scrollbar-thin overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 min-w-52 border-r border-b border-line bg-surface px-4 py-3 text-left text-xs font-semibold tracking-wider text-muted uppercase">Студент</th>
                  {data.lessons.map((l) => (
                    <th key={l.id} title={l.topic} className="min-w-12 border-b border-line bg-surface px-1 py-2 text-center">
                      <span className="block text-sm font-semibold text-primary">{new Date(l.starts_at).getDate()}</span>
                      <span className="block text-[10px] font-normal text-muted">{new Date(l.starts_at).toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}</span>
                    </th>
                  ))}
                  <th className="min-w-32 border-b border-l border-line bg-surface px-3 py-3 text-center text-xs font-semibold text-muted uppercase">ДЗ / прочее</th>
                  <th className="sticky right-0 z-20 min-w-16 border-b border-l border-line bg-surface px-3 py-3 text-center text-xs font-semibold text-muted uppercase">Ср.</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s) => {
                  const all = data.grades.filter((g) => g.student_id === s.id)
                  const avg = all.length ? all.reduce((a, g) => a + g.value, 0) / all.length : null
                  const other = cells.other.get(s.id) ?? []
                  return (
                    <tr key={s.id} className="group">
                      <td className="sticky left-0 z-10 border-r border-b border-line bg-white px-4 py-2 font-medium whitespace-nowrap text-primary group-hover:bg-surface">{s.full_name}</td>
                      {data.lessons.map((l) => {
                        const g = cells.m.get(`${s.id}:${l.id}`)
                        return (
                          <td key={l.id} className="border-b border-line p-1 text-center group-hover:bg-surface/60">
                            <button
                              onClick={() => setEditing({ studentId: s.id, studentName: s.full_name, lesson: l, grade: g ?? null })}
                              className={cn('h-8 w-8 rounded-lg text-sm font-semibold transition', g ? toneBg[gradeTone(g.value)] : 'text-transparent hover:bg-primary-light hover:text-muted')}
                              title={g ? `${gradeTypeLabel[g.type]}${g.comment ? ` · ${g.comment}` : ''}` : 'Поставить оценку'}
                              aria-label={`${s.full_name}, ${fmtDate(l.starts_at)}`}
                            >
                              {g ? g.value : '+'}
                            </button>
                          </td>
                        )
                      })}
                      <td className="border-b border-l border-line px-2 py-1 group-hover:bg-surface/60">
                        <div className="flex flex-wrap justify-center gap-1">
                          {other.slice(-4).map((g) => (
                            <button key={g.id} title={`${gradeTypeLabel[g.type]}${g.comment ? ` · ${g.comment}` : ''}`} onClick={() => setEditing({ studentId: s.id, studentName: s.full_name, lesson: null, grade: g })}>
                              <GradePill value={g.value} className="h-7 w-7 text-xs" />
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="sticky right-0 z-10 border-b border-l border-line bg-white px-3 text-center font-serif text-lg text-primary group-hover:bg-surface">{fmtGrade(avg)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">Средний балл группы: <b className="text-primary">{fmtGrade(data.group.average_grade)}</b> · {data.lessons.length} занятий</p>
        </Card>
      )}
      {editing && groupId && data && (
        <GradeEditor editing={editing} groupId={groupId} students={data.students} onClose={() => setEditing(null)} onSaved={onSaved} />
      )}
    </>
  )
}
