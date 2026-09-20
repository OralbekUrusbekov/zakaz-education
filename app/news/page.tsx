'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, LayoutGrid, List, Search } from 'lucide-react'
import { InfoPage } from '@/components/site-shell'
import { Pagination } from '@/components/site/pagination'
import { NEWS, NEWS_CATEGORIES, formatNewsDate, formatNewsDateShort, newsArt } from '@/lib/news'
import { useTr } from '@/lib/i18n/use-tr'

const PER_PAGE = 9

type View = 'cards' | 'list'

export default function Page() {
  const { tr } = useTr()
  const [view, setView] = useState<View>('cards')
  const [category, setCategory] = useState('Все')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const listTop = useRef<HTMLDivElement>(null)

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return NEWS.filter(
      (n) =>
        (category === 'Все' || n.category === category) &&
        (!q || n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q)),
    )
  }, [category, query])

  const pageCount = Math.max(1, Math.ceil(items.length / PER_PAGE))
  useEffect(() => setPage(1), [category, query, view])
  const visible = items.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const goTo = (p: number) => {
    setPage(Math.min(pageCount, Math.max(1, p)))
    listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <InfoPage
      eyebrow="Новости"
      title={tr('События в жизни Tech School')}
      text="Следите за последними новостями, событиями и достижениями нашей школьной семьи."
    >
      {/* Фильтры и переключение вида */}
      <div className="news-toolbar">
        <div className="news-filters">
          {['Все', ...NEWS_CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`news-chip${category === c ? ' is-active' : ''}`}>
              {tr(c)}
              {c !== 'Все' && <span className="news-chip-count">{NEWS.filter((n) => n.category === c).length}</span>}
            </button>
          ))}
        </div>
        <div className="news-tools">
          <label className="news-search">
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr('Поиск по новостям')} aria-label={tr('Поиск по новостям')} />
          </label>
          <div className="news-view" role="group" aria-label={tr('Вид отображения')}>
            <button onClick={() => setView('cards')} className={view === 'cards' ? 'is-active' : ''} aria-pressed={view === 'cards'}>
              <LayoutGrid size={16} /> Карточки
            </button>
            <button onClick={() => setView('list')} className={view === 'list' ? 'is-active' : ''} aria-pressed={view === 'list'}>
              <List size={16} /> Список
            </button>
          </div>
        </div>
      </div>

      <div ref={listTop} style={{ scrollMarginTop: '24px' }} />
      <p className="news-count">
        {items.length === 0
          ? 'Ничего не найдено'
          : `Найдено материалов: ${items.length}${pageCount > 1 ? ` · страница ${page} из ${pageCount}` : ''}`}
        {(category !== 'Все' || query) && (
          <button className="news-reset" onClick={() => { setCategory('Все'); setQuery('') }}>{tr('Сбросить фильтры')}</button>
        )}
      </p>

      {items.length === 0 ? (
        <div className="news-empty">
          <p>{tr('По вашему запросу новостей нет.')}</p>
          <button className="dark-button" onClick={() => { setCategory('Все'); setQuery('') }}>{tr('Показать все новости')}</button>
        </div>
      ) : view === 'cards' ? (
        <div className="news-cards">
          {visible.map((n) => (
            <Link key={n.slug} href={`/news/${n.slug}`} className="news-card">
              <span className="news-card-photo"><img src={newsArt(n)} alt="" /></span>
              <span className="news-card-body">
                <span className="news-card-meta">
                  <span className="news-tag">{tr(n.category)}</span>
                  <span className="news-date">{formatNewsDateShort(n.date)}</span>
                </span>
                <h2>{tr(n.title)}</h2>
                <p>{tr(n.excerpt)}</p>
                <span className="news-more">{tr('Читать')}<ArrowRight size={15} /></span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="news-list">
          {visible.map((n) => (
            <Link key={n.slug} href={`/news/${n.slug}`} className="news-row">
              <span className="news-row-date">
                <span className="news-date">{formatNewsDate(n.date)}</span>
                <span className="news-tag">{tr(n.category)}</span>
              </span>
              <span className="news-row-body">
                <h2>{tr(n.title)}</h2>
                <p>{tr(n.excerpt)}</p>
              </span>
              <span className="news-more">{tr('Читать')}<ArrowRight size={15} /></span>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} total={pageCount} onChange={goTo} />

    </InfoPage>
  )
}
