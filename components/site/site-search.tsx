'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Search, X } from 'lucide-react'
import { CLUBS } from '@/lib/clubs'
import { EVENTS, SEMINARS, formatEventDate } from '@/lib/events'
import { NEWS, formatNewsDate } from '@/lib/news'
import { PROGRAMS } from '@/lib/programs'
import { useLocale } from '@/lib/i18n'
import { UI } from '@/lib/i18n/dict'

type Item = { title: string; text: string; href: string; group: string; note?: string }

const PAGES: Item[] = [
  { title: 'О школе', text: 'История, миссия и ценности Tech School', href: '/about', group: 'Страницы' },
  { title: 'Обучение и поступление', text: 'Программы, методика, стоимость и процесс поступления', href: '/learning', group: 'Страницы' },
  { title: 'Новости', text: 'Что происходит в школе', href: '/news', group: 'Страницы' },
  { title: 'События', text: 'Календарь мероприятий и регистрация', href: '/events', group: 'Страницы' },
  { title: 'Ученикам и родителям', text: 'Личный кабинет, клубы, поддержка и семинары', href: '/community', group: 'Страницы' },
  { title: 'Контакты', text: 'Адрес, телефон и форма связи', href: '/contacts', group: 'Страницы' },
  { title: 'Личный кабинет', text: 'Вход для студентов, преподавателей и руководства', href: '/login', group: 'Страницы' },
]

const INDEX: Item[] = [
  ...PAGES,
  ...PROGRAMS.map((p) => ({ title: p.title, text: p.short, href: `/learning/${p.slug}`, group: 'Программы', note: p.age })),
  ...NEWS.map((n) => ({ title: n.title, text: n.excerpt, href: `/news/${n.slug}`, group: 'Новости', note: formatNewsDate(n.date) })),
  ...[...EVENTS, ...SEMINARS].map((e) => ({ title: e.title, text: e.desc, href: e.type === 'Семинар' ? '/community' : '/events', group: 'События', note: formatEventDate(e.date) })),
  ...CLUBS.map((c) => ({ title: c.name, text: c.short, href: `/clubs/${c.slug}`, group: 'Клубы', note: c.members })),
]

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, 'е')

export function SiteSearch() {
  const { pick } = useLocale()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    input.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  // Ctrl/⌘ + K открывает поиск
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (q.length < 2) return []
    const found = INDEX.filter((i) => normalize(`${i.title} ${i.text} ${i.note ?? ''}`).includes(q))
    const groups = new Map<string, Item[]>()
    for (const item of found.slice(0, 24)) groups.set(item.group, [...(groups.get(item.group) ?? []), item])
    return [...groups.entries()]
  }, [query])

  const total = results.reduce((s, [, items]) => s + items.length, 0)

  return (
    <>
      <button className="icon-button" aria-label={pick(UI.search)} title={`${pick(UI.search)} (⌘K)`} onClick={() => setOpen(true)}>
        <Search size={22} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="search-backdrop" onMouseDown={() => setOpen(false)}>
          <div className="search-window" role="dialog" aria-modal="true" aria-label={pick(UI.search)} onMouseDown={(e) => e.stopPropagation()}>
            <div className="search-field">
              <Search size={19} />
              <input
                ref={input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={pick(UI.searchPlaceholder)}
                aria-label={pick(UI.searchQuery)}
              />
              <button onClick={() => setOpen(false)} aria-label={pick(UI.searchClose)}><X size={18} /></button>
            </div>

            <div className="search-results">
              {query.trim().length < 2 ? (
                <div className="search-hint">
                  <p>{pick(UI.searchHint)}</p>
                  <div className="search-suggest">
                    {['Поступление', 'ЕНТ', 'Робот-клуб', 'День открытых дверей'].map((s) => (
                      <button key={s} onClick={() => setQuery(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : total === 0 ? (
                <div className="search-hint"><p>{pick(UI.searchEmpty)} «{query}»</p></div>
              ) : (
                results.map(([group, items]) => (
                  <section key={group}>
                    <p className="search-group">{group}</p>
                    {items.map((item) => (
                      <Link key={item.href + item.title} href={item.href} className="search-item" onClick={() => setOpen(false)}>
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.text}</small>
                        </span>
                        {item.note && <em>{item.note}</em>}
                        <ArrowRight size={16} />
                      </Link>
                    ))}
                  </section>
                ))
              )}
            </div>
            {total > 0 && <p className="search-total">{pick(UI.searchFound)}: {total}</p>}
          </div>
        </div>
      )}
    </>
  )
}
