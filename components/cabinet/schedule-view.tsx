'use client'
import { useMemo, useState } from 'react'
import { CalendarX2, ChevronLeft, ChevronRight, MapPin, MonitorPlay, User } from 'lucide-react'
import { addDays, fmtTime, isSameDay, startOfWeek, toLocalISO } from '@/lib/format'
import type { ScheduleItem } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'
import { Button, Card, EmptyState, ErrorState, Skeleton, Tabs } from './ui'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

type Mode = 'week' | 'month'

export function ScheduleView({
  fetcher, showTeacher = true,
}: { fetcher: (start: string, end: string) => Promise<ScheduleItem[]>; showTeacher?: boolean }) {
  const [mode, setMode] = useState<Mode>('week')
  const [anchor, setAnchor] = useState(() => new Date())

  const [start, end, days] = useMemo(() => {
    if (mode === 'week') {
      const s = startOfWeek(anchor)
      return [s, addDays(s, 7), Array.from({ length: 7 }, (_, i) => addDays(s, i))]
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const s = startOfWeek(first)
    const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
    const e = addDays(startOfWeek(lastOfMonth), 7)
    const count = Math.round((e.getTime() - s.getTime()) / 86400000)
    return [s, e, Array.from({ length: count }, (_, i) => addDays(s, i))]
  }, [mode, anchor])

  const { data, error, loading, reload } = useApi(() => fetcher(toLocalISO(start), toLocalISO(end)), [start.getTime(), end.getTime()])

  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>()
    for (const item of data ?? []) {
      const key = new Date(item.starts_at).toDateString()
      map.set(key, [...(map.get(key) ?? []), item])
    }
    return map
  }, [data])

  const shift = (dir: number) =>
    setAnchor((a) => (mode === 'week' ? addDays(a, 7 * dir) : new Date(a.getFullYear(), a.getMonth() + dir, 1)))

  const title =
    mode === 'week'
      ? `${start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} — ${addDays(end, -1).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
      : anchor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })

  const today = new Date()
  const courses = useMemo(() => {
    const m = new Map<string, string>()
    for (const i of data ?? []) m.set(i.course_name, i.course_color)
    return [...m.entries()]
  }, [data])

  return (
    <Card className="md:-mx-4 xl:-mx-6" bodyClassName="p-3 md:p-4">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="w-9 px-0" onClick={() => shift(-1)} aria-label="Назад"><ChevronLeft size={17} /></Button>
          <Button variant="secondary" size="sm" className="w-9 px-0" onClick={() => shift(1)} aria-label="Вперёд"><ChevronRight size={17} /></Button>
          <Button variant="secondary" size="sm" onClick={() => setAnchor(new Date())}>Сегодня</Button>
          <h2 className="ml-1 font-serif text-xl text-primary first-letter:uppercase">{title}</h2>
        </div>
        <Tabs tabs={[{ value: 'week', label: 'Неделя' }, { value: 'month', label: 'Месяц' }]} value={mode} onChange={setMode} />
      </div>

      {courses.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5">
          {courses.map(([name, color]) => (
            <span key={name} className="flex items-center gap-1.5 text-xs text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {name}
            </span>
          ))}
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : mode === 'week' ? (
        data && data.length === 0 ? (
          <EmptyState icon={CalendarX2} title="На этой неделе занятий нет" text="Переключитесь на другую неделю." />
        ) : (
          <div className={cn('grid gap-1.5 lg:grid-cols-7', loading && 'opacity-60')}>
            {days.map((day) => {
              const items = byDay.get(day.toDateString()) ?? []
              const isToday = isSameDay(day, today)
              return (
                <div key={day.toISOString()} className={cn('rounded-xl px-0.5 py-2', isToday ? 'bg-gold-light/60 ring-1 ring-gold/40' : 'bg-surface', items.length === 0 && 'hidden lg:block')}>
                  <div className="mb-2 flex items-baseline gap-1.5 px-1.5">
                    <span className={cn('text-xs font-semibold tracking-wide uppercase', isToday ? 'text-gold-dark' : 'text-muted')}>{WEEKDAYS[(day.getDay() + 6) % 7]}</span>
                    <span className="font-serif text-lg text-primary">{day.getDate()}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => <LessonCard key={item.id} item={item} showTeacher={showTeacher} />)}
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <div className={cn('overflow-hidden rounded-xl border border-line', loading && 'opacity-60')}>
          <div className="grid grid-cols-7 bg-surface">
            {WEEKDAYS.map((d) => <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-muted uppercase">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const items = byDay.get(day.toDateString()) ?? []
              const inMonth = day.getMonth() === anchor.getMonth()
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => { setAnchor(day); setMode('week') }}
                  className={cn('min-h-20 border-t border-l border-line p-1.5 text-left align-top transition hover:bg-surface md:min-h-24', !inMonth && 'bg-surface/60 text-muted/60', '[&:nth-child(7n+1)]:border-l-0')}
                >
                  <span className={cn('mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs', isSameDay(day, today) ? 'bg-primary text-white' : 'text-primary')}>{day.getDate()}</span>
                  <div className="space-y-0.5">
                    {items.slice(0, 3).map((i) => (
                      <div key={i.id} className="flex items-center gap-1 truncate text-[11px] text-primary">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: i.course_color }} />
                        <span className="hidden sm:inline">{fmtTime(i.starts_at)}</span>
                        <span className="truncate">{i.course_name}</span>
                      </div>
                    ))}
                    {items.length > 3 && <p className="text-[11px] text-muted">ещё {items.length - 3}</p>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}

export function LessonCard({ item, showTeacher = true }: { item: ScheduleItem; showTeacher?: boolean }) {
  const past = new Date(item.ends_at) < new Date()
  return (
    <div className={cn('rounded-lg border border-line bg-white px-2.5 py-2.5 shadow-sm', past && 'opacity-60')} style={{ borderLeft: `3px solid ${item.course_color}` }}>
      <p className="text-xs font-semibold text-primary">{fmtTime(item.starts_at)} – {fmtTime(item.ends_at)}</p>
      <p className="mt-0.5 text-[13px] leading-snug font-semibold text-primary">{item.course_name}</p>
      <p className="mt-0.5 text-xs leading-snug text-muted">{item.topic}</p>
      <div className="mt-1.5 space-y-0.5 text-[11px] text-muted">
        {showTeacher && <p className="flex items-center gap-1"><User size={11} /> {item.teacher_name}</p>}
        {!showTeacher && <p className="flex items-center gap-1"><User size={11} /> Группа {item.group_name}</p>}
        <p className="flex items-center gap-1">
          {item.is_online ? <MonitorPlay size={11} /> : <MapPin size={11} />} {item.is_online ? 'Онлайн' : item.room}
        </p>
      </div>
    </div>
  )
}

export function LessonRow({ item, showTeacher = true }: { item: ScheduleItem; showTeacher?: boolean }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-line p-3.5">
      <div className="w-14 shrink-0 text-center">
        <p className="font-serif text-lg leading-none text-primary">{fmtTime(item.starts_at)}</p>
        <p className="mt-1 text-[11px] text-muted">{fmtTime(item.ends_at)}</p>
      </div>
      <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: item.course_color }} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-primary">{item.course_name}</p>
        <p className="truncate text-sm text-muted">{item.topic}</p>
      </div>
      <div className="hidden shrink-0 text-right text-xs text-muted sm:block">
        <p>{showTeacher ? item.teacher_name : `Группа ${item.group_name}`}</p>
        <p className="mt-0.5 flex items-center justify-end gap-1">
          {item.is_online ? <MonitorPlay size={12} /> : <MapPin size={12} />} {item.is_online ? 'Онлайн' : item.room}
        </p>
      </div>
    </div>
  )
}
