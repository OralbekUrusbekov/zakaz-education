'use client'
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AlertTriangle, Inbox, RotateCw, TrendingDown, TrendingUp, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { gradeTone, initials, type Tone } from '@/lib/format'

// ---------- layout ----------
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-primary md:text-[34px]">{title}</h1>
        <span className="mt-2 block h-[3px] w-10 bg-gold" />
        {subtitle && <p className="mt-3 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({
  title, subtitle, action, children, className, bodyClassName,
}: { title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children?: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn('rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(16,24,40,.05)]', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 px-5 pt-5 md:px-6">
          <div>
            {title && <h2 className="font-serif text-xl font-normal text-primary">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn('p-5 md:p-6', title && 'pt-4 md:pt-4', bodyClassName)}>{children}</div>
    </section>
  )
}

const toneClasses: Record<Tone, string> = {
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  info: 'bg-info-light text-info',
  neutral: 'bg-surface text-muted',
  gold: 'bg-gold-light text-gold-dark',
}

export function StatCard({
  label, value, hint, icon: Icon, tone = 'neutral', delta,
}: { label: string; value: ReactNode; hint?: ReactNode; icon?: LucideIcon; tone?: Tone; delta?: number | null }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(16,24,40,.07)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {Icon && (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', tone === 'neutral' ? 'bg-primary-light text-primary' : toneClasses[tone])}>
            <Icon size={19} strokeWidth={1.75} />
          </span>
        )}
      </div>
      <p className="mt-1 font-serif text-[32px] leading-tight text-primary">{value}</p>
      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
        {delta !== undefined && delta !== null && delta !== 0 && (
          <span className={cn('inline-flex items-center gap-0.5 font-semibold', delta >= 0 ? 'text-success' : 'text-danger')}>
            {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {delta > 0 ? '+' : ''}
            {delta}%
          </span>
        )}
        {hint}
      </div>
    </div>
  )
}

// ---------- small pieces ----------
export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', toneClasses[tone], className)}>
      {children}
    </span>
  )
}

export function StatusBadge<K extends string>({ status, map }: { status: K; map: Record<K, [string, Tone]> }) {
  const [label, tone] = map[status]
  return <Badge tone={tone}>{label}</Badge>
}

export function GradePill({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-1 text-sm font-semibold', toneClasses[gradeTone(value)], className)}>
      {value}
    </span>
  )
}

export function Dot({ color, className }: { color: string; className?: string }) {
  return <span className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', className)} style={{ background: color }} />
}

export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-primary-light font-semibold text-primary', className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

export function ProgressBar({ value, color, className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-primary-light', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </div>
  )
}

export function ProgressRing({ value, size = 132, stroke = 10, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary-light)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, value) / 100)} className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-serif text-3xl text-gold-dark">{Math.round(value)}%</p>
        {label && <p className="text-xs text-muted">{label}</p>}
      </div>
    </div>
  )
}

// ---------- states ----------
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4', className)} />
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }: { icon?: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-light text-gold-dark">
        <Icon size={24} strokeWidth={1.6} />
      </span>
      <p className="font-serif text-lg text-primary">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-danger/20 bg-danger-light/50 p-8 text-center">
      <AlertTriangle className="mx-auto mb-3 text-danger" />
      <p className="font-medium text-primary">Не удалось загрузить данные</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw size={15} /> Повторить
        </Button>
      )}
    </div>
  )
}

// ---------- controls ----------
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'md' ? 'h-11 px-5 text-sm' : 'h-9 px-4 text-[13px]',
        variant === 'primary' && 'bg-primary text-white hover:bg-primary-hover',
        variant === 'secondary' && 'border border-primary bg-white text-primary hover:bg-primary-light',
        variant === 'ghost' && 'text-primary hover:bg-surface',
        variant === 'gold' && 'bg-gold text-primary hover:brightness-95',
        variant === 'danger' && 'border border-danger/30 bg-white text-danger hover:bg-danger-light',
        className,
      )}
      {...props}
    />
  )
}

const fieldBase =
  'w-full rounded-[10px] border border-line bg-white px-3.5 text-[15px] text-primary outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-3 focus:ring-primary-light'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, 'h-11', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, 'min-h-28 py-3', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, 'select-caret h-11 cursor-pointer appearance-none pr-10', className)} {...props}>
      {children}
    </select>
  )
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sm font-medium text-primary">{label}</span>
      {children}
    </label>
  )
}

export function Tabs<T extends string>({
  tabs, value, onChange, className,
}: { tabs: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn('scrollbar-thin -mx-1.5 -my-1.5 flex gap-1 overflow-x-auto px-1.5 py-1.5', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition',
            value === t.value ? 'bg-primary text-white' : 'bg-white text-muted ring-1 ring-line hover:text-primary',
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={cn('rounded-full px-1.5 text-xs', value === t.value ? 'bg-white/20' : 'bg-surface')}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

// ---------- overlays ----------
function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
}

export function Modal({
  open, onClose, title, children, footer, wide,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn('fade-up flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-line bg-white shadow-[0_24px_70px_rgba(16,24,40,.28)] sm:rounded-2xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="font-serif text-xl text-primary">{title}</h3>
          <button onClick={onClose} aria-label="Закрыть" className="rounded-full p-1.5 text-muted hover:bg-surface"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-white shadow-[0_0_70px_rgba(16,24,40,.28)]"
        style={{ animation: 'fade-up .25s ease both' }}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="font-serif text-xl text-primary">{title}</h3>
          <button onClick={onClose} aria-label="Закрыть" className="rounded-full p-1.5 text-muted hover:bg-surface"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </aside>
    </div>
  )
}

// ---------- table ----------
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('scrollbar-thin overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
    </div>
  )
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cn('border-b border-line bg-surface px-4 py-3 text-left text-xs font-semibold tracking-wider text-muted uppercase first:rounded-tl-lg last:rounded-tr-lg', className)}>
      {children}
    </th>
  )
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn('border-b border-line px-4 py-3.5 align-middle', className)}>{children}</td>
}
