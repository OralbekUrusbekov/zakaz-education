'use client'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Пагинация для таблиц и списков кабинета. */
export function usePager<T>(items: T[], perPage: number, resetKey?: unknown) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / perPage))
  useEffect(() => setPage(1), [resetKey, items.length])
  const current = Math.min(page, pageCount)
  return {
    page: current,
    pageCount,
    setPage,
    visible: items.slice((current - 1) * perPage, current * perPage),
    from: items.length ? (current - 1) * perPage + 1 : 0,
    to: Math.min(current * perPage, items.length),
    total: items.length,
  }
}

export function Pager({
  page, pageCount, onChange, from, to, total, className,
}: { page: number; pageCount: number; onChange: (p: number) => void; from: number; to: number; total: number; className?: string }) {
  if (pageCount <= 1) return null
  const numbers: (number | '…')[] = []
  if (pageCount <= 7) for (let i = 1; i <= pageCount; i++) numbers.push(i)
  else {
    numbers.push(1)
    if (page > 3) numbers.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(pageCount - 1, page + 1); i++) numbers.push(i)
    if (page < pageCount - 2) numbers.push('…')
    numbers.push(pageCount)
  }
  const btn = 'flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm transition disabled:opacity-40'
  return (
    <div className={cn('mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4', className)}>
      <p className="text-xs text-muted">Показано {from}–{to} из {total}</p>
      <nav className="flex items-center gap-1" aria-label="Постраничная навигация">
        <button className={cn(btn, 'border border-line hover:bg-surface')} onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Назад">
          <ChevronLeft size={15} />
        </button>
        {numbers.map((n, i) =>
          n === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-muted">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onChange(n)}
              aria-current={n === page ? 'page' : undefined}
              className={cn(btn, n === page ? 'bg-primary font-semibold text-white' : 'border border-line hover:bg-surface')}
            >
              {n}
            </button>
          ),
        )}
        <button className={cn(btn, 'border border-line hover:bg-surface')} onClick={() => onChange(page + 1)} disabled={page === pageCount} aria-label="Вперёд">
          <ChevronRight size={15} />
        </button>
      </nav>
    </div>
  )
}
