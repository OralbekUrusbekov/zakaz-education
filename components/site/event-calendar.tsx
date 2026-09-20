'use client'
import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, LayoutGrid, List, MapPin, X } from 'lucide-react'
import { formatEventDate, type SiteEvent } from '@/lib/events'
import { useLocale } from '@/lib/i18n'
import { UI } from '@/lib/i18n/dict'

const WEEKDAYS = { ru: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'], kk: ['Дс','Сс','Ср','Бс','Жм','Сн','Жк'] }

const isoOf = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const startOfGrid = (month: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const shift = (first.getDay() + 6) % 7
  return new Date(first.getFullYear(), first.getMonth(), 1 - shift)
}

const plural = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'событие' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'события' : 'событий')

export function EventCalendar({
  events, onRegister, listLabel, emptyText,
}: {
  events: SiteEvent[]
  onRegister?: (e: SiteEvent) => void
  listLabel?: string
  emptyText?: string
}) {
  const { lang, pick } = useLocale()
  const weekdays = WEEKDAYS[lang]
  const listTitle = listLabel ?? pick(UI.list)
  const empty = emptyText ?? pick(UI.calendarEmpty)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [month, setMonth] = useState(() => {
    const next = [...events].sort((a, b) => a.date.localeCompare(b.date))[0]
    const base = next ? new Date(next.date) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [selected, setSelected] = useState<string | null>(null)

  const byDate = useMemo(() => {
    const map = new Map<string, SiteEvent[]>()
    for (const e of events) map.set(e.date, [...(map.get(e.date) ?? []), e])
    return map
  }, [events])

  const days = useMemo(() => {
    const start = startOfGrid(month)
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const cells = Math.ceil(((last.getDate() + ((new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7)) / 7)) * 7
    return Array.from({ length: cells }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }, [month])

  const today = isoOf(new Date())
  const monthEvents = events
    .filter((e) => new Date(e.date).getMonth() === month.getMonth() && new Date(e.date).getFullYear() === month.getFullYear())
    .sort((a, b) => a.date.localeCompare(b.date))
  const selectedEvents = selected ? byDate.get(selected) ?? [] : []

  return (
    <div className="calendar-wrap">
      <div className="calendar-switch">
        <button className={view === 'calendar' ? 'is-active' : ''} onClick={() => setView('calendar')} aria-pressed={view === 'calendar'}>
          <LayoutGrid size={15} /> {pick(UI.calendar)}
        </button>
        <button className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-pressed={view === 'list'}>
          <List size={15} /> {listTitle}
        </button>
      </div>

      {view === 'calendar' ? (
        <div className="calendar">
          <header className="calendar-head">
            <div className="calendar-nav">
              <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label={pick(UI.prevMonth)}><ChevronLeft size={18} /></button>
              <h3>{month.toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', { month: 'long', year: 'numeric' })}</h3>
              <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label={pick(UI.nextMonth)}><ChevronRight size={18} /></button>
            </div>
            <button
              className="calendar-today"
              onClick={() => { const n = new Date(); setMonth(new Date(n.getFullYear(), n.getMonth(), 1)); setSelected(isoOf(n)) }}
            >
              {pick(UI.today)}
            </button>
          </header>

          <div className="calendar-grid">
            {weekdays.map((d) => <div key={d} className="calendar-weekday">{d}</div>)}
            {days.map((d) => {
              const key = isoOf(d)
              const items = byDate.get(key) ?? []
              const inMonth = d.getMonth() === month.getMonth()
              return (
                <div
                  key={key}
                  className={`calendar-cell${inMonth ? '' : ' is-muted'}${key === today ? ' is-today' : ''}${key === selected ? ' is-selected' : ''}`}
                  onClick={() => items.length && setSelected(key)}
                  role={items.length ? 'button' : undefined}
                  tabIndex={items.length ? 0 : undefined}
                  onKeyDown={(e) => e.key === 'Enter' && items.length && setSelected(key)}
                >
                  <span className="calendar-date">
                    {d.getDate()}
                    {items.length > 0 && <em>{items.length}</em>}
                  </span>
                  <div className="calendar-events">
                    {items.slice(0, 2).map((e) => (
                      <span key={e.slug} className="calendar-event" style={{ background: e.color }} title={`${e.time} · ${e.title}`}>
                        <b>{e.time.split(' ')[0]}</b> {e.title}
                      </span>
                    ))}
                    {items.length > 2 && <span className="calendar-more">ещё {items.length - 2}</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {selected && selectedEvents.length > 0 && (
            <div className="calendar-day">
              <header>
                <span className="calendar-day-chip">{new Date(selected).getDate()}</span>
                <div>
                  <p className="calendar-day-weekday">{new Date(selected).toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', { weekday: 'long' })}</p>
                  <strong>{formatEventDate(selected)}</strong>
                </div>
                <span className="calendar-day-count">{selectedEvents.length} {lang === 'kk' ? pick(UI.eventsCount) : plural(selectedEvents.length)}</span>
                <button onClick={() => setSelected(null)} aria-label="Закрыть"><X size={18} /></button>
              </header>
              <div className="calendar-day-list">
                {selectedEvents.map((e) => (
                  <article key={e.slug} style={{ borderTopColor: e.color }}>
                    <p className="calendar-day-time"><Clock size={14} /> {e.time}</p>
                    <h4>{e.title}</h4>
                    <p className="calendar-day-desc">{e.desc}</p>
                    <p className="calendar-day-place"><MapPin size={14} /> {e.location}</p>
                    {onRegister && <button className="gold-button" onClick={() => onRegister(e)}>{pick(UI.register)}</button>}
                  </article>
                ))}
              </div>
            </div>
          )}

          {monthEvents.length === 0 && <p className="calendar-empty">{empty}</p>}
        </div>
      ) : (
        <div className="calendar-list">
          {events.length === 0 ? (
            <p className="calendar-empty">{empty}</p>
          ) : (
            [...events].sort((a, b) => a.date.localeCompare(b.date)).map((e) => (
              <article key={e.slug} className="calendar-row">
                <span className="calendar-row-date" style={{ borderColor: e.color }}>
                  <strong>{new Date(e.date).getDate()}</strong>
                  <span>{new Date(e.date).toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', { month: 'short' }).replace('.', '')}</span>
                </span>
                <div>
                  <h4>{e.title}</h4>
                  <p>{e.desc}</p>
                  <div className="calendar-row-meta">
                    <span><CalendarDays size={14} /> {formatEventDate(e.date)}</span>
                    <span><Clock size={14} /> {e.time}</span>
                    <span><MapPin size={14} /> {e.location}</span>
                  </div>
                </div>
                {onRegister && <button className="gold-button" onClick={() => onRegister(e)}>{pick(UI.register)}</button>}
              </article>
            ))
          )}
        </div>
      )}
    </div>
  )
}
