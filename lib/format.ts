import type { AttendanceStatus, CommentKind, GradeType, HomeworkStatus, PaymentStatus } from './types'

const locale = 'ru-RU'

export const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long' })
export const fmtShortDate = (d: string | Date) => new Date(d).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
export const fmtFullDate = (d: string | Date) =>
  new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
export const fmtTime = (d: string | Date) => new Date(d).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
export const fmtDateTime = (d: string | Date) => `${fmtDate(d)}, ${fmtTime(d)}`
export const fmtWeekday = (d: string | Date) => new Date(d).toLocaleDateString(locale, { weekday: 'long' })
export const fmtMoney = (n: number) => `${n.toLocaleString(locale)} ₸`
export const fmtPct = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `${Math.round(n)}%`)
export const fmtGrade = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toFixed(1))

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export function relativeDays(d: string | Date): string {
  const target = new Date(d)
  const today = new Date()
  const diff = Math.round(
    (new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000,
  )
  if (diff === 0) return 'Сегодня'
  if (diff === 1) return 'Завтра'
  if (diff === -1) return 'Вчера'
  if (diff > 1 && diff < 7) return `Через ${diff} ${plural(diff, 'день', 'дня', 'дней')}`
  if (diff < -1 && diff > -7) return `${-diff} ${plural(-diff, 'день', 'дня', 'дней')} назад`
  return fmtDate(target)
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}

export const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

/** Локальная дата-время без часового пояса — бэкенд хранит наивные даты. */
export const toLocalISO = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

export const startOfWeek = (d: Date) => {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7))
  return r
}

export const addDays = (d: Date, n: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold'

export const attendanceLabel: Record<AttendanceStatus, [string, Tone]> = {
  present: ['Присутствовал', 'success'],
  late: ['Опоздал', 'warning'],
  absent: ['Отсутствовал', 'danger'],
  excused: ['Уважительная', 'info'],
}

export const homeworkLabel: Record<HomeworkStatus, [string, Tone]> = {
  active: ['К выполнению', 'gold'],
  submitted: ['На проверке', 'info'],
  reviewed: ['Проверено', 'success'],
  revision: ['На доработку', 'warning'],
  overdue: ['Просрочено', 'danger'],
}

export const paymentLabel: Record<PaymentStatus, [string, Tone]> = {
  paid: ['Оплачено', 'success'],
  pending: ['Ожидает оплаты', 'warning'],
  overdue: ['Просрочено', 'danger'],
}

export const gradeTypeLabel: Record<GradeType, string> = {
  classwork: 'Работа на уроке',
  homework: 'Домашнее задание',
  test: 'Контрольная',
  exam: 'Экзамен',
}

export const commentKindLabel: Record<CommentKind, [string, Tone]> = {
  praise: ['Похвала', 'success'],
  remark: ['Замечание', 'danger'],
  recommendation: ['Рекомендация', 'info'],
}

/** Десятибалльная шкала: 9–10 отлично, 7–8 хорошо, 5–6 удовлетворительно, ниже — тревожно. */
export const gradeTone = (v: number): Tone => (v >= 9 ? 'success' : v >= 7 ? 'info' : v >= 5 ? 'warning' : 'danger')

export type { Tone }
