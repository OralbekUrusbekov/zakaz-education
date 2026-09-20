import { describe, expect, it } from 'vitest'
import { NEWS, NEWS_CATEGORIES, formatNewsDate, getNews, newsArt } from '@/lib/news'
import { EVENTS, EVENT_COLORS, SEMINARS, upcoming } from '@/lib/events'
import { PROGRAMS, getProgram } from '@/lib/programs'
import { CLUBS, getClub } from '@/lib/clubs'

const unique = <T>(arr: T[]) => new Set(arr).size === arr.length

describe('новости', () => {
  it('минимум две страницы по 9 карточек', () => {
    expect(NEWS.length).toBeGreaterThanOrEqual(18)
  })
  it('слаги уникальны', () => expect(unique(NEWS.map((n) => n.slug))).toBe(true))
  it('отсортированы от новых к старым', () => {
    const dates = NEWS.map((n) => n.date)
    expect([...dates].sort().reverse()).toEqual(dates)
  })
  it('у каждой новости есть обложка, категория и текст', () => {
    for (const n of NEWS) {
      expect(newsArt(n).startsWith('/')).toBe(true)
      expect(n.category).toBeTruthy()
      expect(n.content.length).toBeGreaterThanOrEqual(2)
    }
  })
  it('категории собираются без повторов', () => expect(unique(NEWS_CATEGORIES)).toBe(true))
  it('поиск по слагу', () => {
    expect(getProgram('nope')).toBeUndefined()
    expect(getNews(NEWS[0].slug)?.title).toBe(NEWS[0].title)
  })
  it('дата без «г.»', () => expect(formatNewsDate('2025-01-15')).toBe('15 января 2025'))
})

describe('события', () => {
  it('все ближайшие события в будущем и по порядку', () => {
    const list = upcoming(EVENTS)
    const today = new Date().toISOString().slice(0, 10)
    expect(list.length).toBeGreaterThan(3)
    expect(list.every((e) => e.date >= today)).toBe(true)
    expect(list.map((e) => e.date)).toEqual([...list.map((e) => e.date)].sort())
  })
  it('цвет соответствует типу', () => {
    for (const e of [...EVENTS, ...SEMINARS]) expect(e.color).toBe(EVENT_COLORS[e.type])
  })
  it('семинары помечены отдельным типом', () => {
    expect(SEMINARS.every((s) => s.type === 'Семинар')).toBe(true)
  })
  it('слаги уникальны внутри списка', () => {
    expect(unique(EVENTS.map((e) => e.slug))).toBe(true)
    expect(unique(SEMINARS.map((e) => e.slug))).toBe(true)
  })
})

describe('программы', () => {
  it('четыре ступени с уникальными слагами', () => {
    expect(PROGRAMS).toHaveLength(4)
    expect(unique(PROGRAMS.map((p) => p.slug))).toBe(true)
  })
  it('у каждой программы заполнены все блоки страницы', () => {
    for (const p of PROGRAMS) {
      expect(p.intro.length).toBeGreaterThanOrEqual(2)
      expect(p.subjects.length).toBeGreaterThanOrEqual(4)
      expect(p.format).toHaveLength(4)
      expect(p.facts.length).toBeGreaterThanOrEqual(3)
      expect(p.results.length).toBeGreaterThanOrEqual(3)
      expect(p.quote.text).toContain('«')
      expect(p.price).toMatch(/₸/)
    }
  })
  it('вариант героя валиден', () => {
    for (const p of PROGRAMS) expect(['split', 'accent', 'dark']).toContain(p.hero)
    for (const p of PROGRAMS) if (p.hero === 'split') expect(p.photo).toBeTruthy()
  })
  it('поиск по слагу', () => expect(getProgram('primary')?.title).toBe('Начальная школа'))
})

describe('клубы', () => {
  it('шесть клубов с уникальными слагами', () => {
    expect(CLUBS).toHaveLength(6)
    expect(unique(CLUBS.map((c) => c.slug))).toBe(true)
  })
  it('у каждого клуба есть обложка, расписание и руководитель', () => {
    for (const c of CLUBS) {
      expect(c.cover.startsWith('/')).toBe(true)
      expect(c.schedule.length).toBeGreaterThanOrEqual(1)
      expect(c.leader.name).toBeTruthy()
      expect(c.activities.length).toBeGreaterThanOrEqual(4)
      expect(c.tint).toMatch(/^#/)
    }
  })
  it('поиск по слагу', () => {
    expect(getClub('robotics')?.name).toBe('Робот-клуб')
    expect(getClub('unknown')).toBeUndefined()
  })
})
