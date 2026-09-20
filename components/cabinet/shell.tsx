'use client'
import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3, BookOpenCheck, CalendarCheck, CalendarDays, ClipboardList, GraduationCap, LayoutDashboard, LogOut,
  Menu, MessageSquareText, NotebookPen, TrendingUp, TriangleAlert, Users, WalletCards, X, type LucideIcon,
} from 'lucide-react'
import { homeForRole, useAuth } from '@/lib/auth-context'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Avatar, PageSkeleton } from './ui'

type NavItem = { label: string; href: string; icon: LucideIcon }

const NAV: Record<Role, NavItem[]> = {
  student: [
    { label: 'Обзор', href: '/student', icon: LayoutDashboard },
    { label: 'Расписание', href: '/student/schedule', icon: CalendarDays },
    { label: 'Посещаемость', href: '/student/attendance', icon: CalendarCheck },
    { label: 'Прогресс обучения', href: '/student/progress', icon: TrendingUp },
    { label: 'Домашние задания', href: '/student/homework', icon: ClipboardList },
    { label: 'Оценки', href: '/student/grades', icon: BookOpenCheck },
    { label: 'Оплата', href: '/student/payments', icon: WalletCards },
  ],
  teacher: [
    { label: 'Обзор', href: '/teacher', icon: LayoutDashboard },
    { label: 'Расписание', href: '/teacher/schedule', icon: CalendarDays },
    { label: 'Студенты', href: '/teacher/students', icon: Users },
    { label: 'Журнал оценок', href: '/teacher/grades', icon: NotebookPen },
    { label: 'Домашние задания', href: '/teacher/homework', icon: ClipboardList },
    { label: 'Посещаемость', href: '/teacher/attendance', icon: CalendarCheck },
    { label: 'Комментарии', href: '/teacher/comments', icon: MessageSquareText },
  ],
  admin: [
    { label: 'Дашборд', href: '/admin', icon: LayoutDashboard },
    { label: 'Курсы', href: '/admin/courses', icon: BarChart3 },
    { label: 'Преподаватели', href: '/admin/teachers', icon: Users },
    { label: 'Зона риска', href: '/admin/risk', icon: TriangleAlert },
  ],
}

const ROLE_LABEL: Record<Role, string> = { student: 'Студент', teacher: 'Преподаватель', admin: 'Руководство' }

export function CabinetShell({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/login')
    else if (user.role !== role) router.replace(homeForRole(user.role))
  }, [loading, user, role, router])

  useEffect(() => setOpen(false), [pathname])

  const nav = NAV[role]
  const isActive = (href: string) => {
    const path = href.split('#')[0]
    if (href.includes('#')) return false
    return path === `/${role}` ? pathname === path : pathname.startsWith(path)
  }
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-surface">
      {open && <div className="fixed inset-0 z-30 bg-primary/40 md:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-line bg-white px-4 py-5 transition-transform md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-9 items-center justify-center rounded-[48%_48%_44%_44%] border-2 border-primary font-serif text-lg font-bold text-primary">T</span>
            <span>
              <span className="block font-serif text-xl leading-none text-primary">Tech School</span>
              <span className="text-[11px] tracking-wider text-muted uppercase">{ROLE_LABEL[role]}</span>
            </span>
          </Link>
          <button onClick={() => setOpen(false)} className="rounded-full p-1 text-muted md:hidden" aria-label="Закрыть меню"><X size={20} /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {nav.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium transition',
                isActive(href) ? 'bg-primary text-white' : 'text-muted hover:bg-surface hover:text-primary',
              )}
            >
              <Icon size={19} strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="mt-4 border-t border-line pt-4">
            <div className="flex items-center gap-3 px-2">
              <Avatar name={user.full_name} size={38} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">{user.full_name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            </div>
            <button onClick={logout} className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium text-muted transition hover:bg-danger-light hover:text-danger">
              <LogOut size={19} strokeWidth={1.75} /> Выйти
            </button>
          </div>
        )}
      </aside>

      <div className="md:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-white/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 text-primary md:hidden" aria-label="Открыть меню"><Menu size={22} /></button>
            <GraduationCap size={18} className="hidden text-gold-dark sm:block" />
            <p className="text-sm text-muted first-letter:uppercase">{today}</p>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-primary">{user.full_name}</p>
                <p className="text-xs text-muted">{ROLE_LABEL[user.role]}</p>
              </div>
              <Avatar name={user.full_name} />
            </div>
          )}
        </header>
        <main className="mx-auto w-full max-w-[1320px] px-4 py-7 md:px-8 md:py-9">
          {loading || !user || user.role !== role ? <PageSkeleton /> : <div className="fade-up">{children}</div>}
        </main>
      </div>
    </div>
  )
}
