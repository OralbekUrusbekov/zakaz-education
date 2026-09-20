'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Нумерация страниц с многоточиями: 1 … 4 5 6 … 12 */
function pages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  const from = Math.max(2, current - 1)
  const to = Math.min(total - 1, current + 1)
  if (from > 2) out.push('…')
  for (let i = from; i <= to; i++) out.push(i)
  if (to < total - 1) out.push('…')
  out.push(total)
  return out
}

export function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null
  return (
    <nav className="pagination" aria-label="Постраничная навигация">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Предыдущая страница">
        <ChevronLeft size={16} />
      </button>
      {pages(page, total).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="pagination-gap">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p)} className={p === page ? 'is-active' : ''} aria-current={p === page ? 'page' : undefined}>
            {p}
          </button>
        ),
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === total} aria-label="Следующая страница">
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
