'use client'
import Link from 'next/link'
import { ArrowRight, BookOpenCheck, CalendarCheck, CalendarClock, ClipboardList, MessageSquareText, WalletCards } from 'lucide-react'
import { Badge, Card, EmptyState, ErrorState, PageHeader, PageSkeleton, ProgressBar, StatCard, StatusBadge } from '@/components/cabinet/ui'
import { LessonRow } from '@/components/cabinet/schedule-view'
import { studentApi } from '@/lib/api/student'
import { useAuth } from '@/lib/auth-context'
import { commentKindLabel, fmtDateTime, fmtGrade, fmtMoney, fmtPct, fmtTime, paymentLabel, plural, relativeDays } from '@/lib/format'
import { useApi } from '@/lib/use-api'

export default function StudentOverviewPage() {
  const { user } = useAuth()
  const { data, error, loading, reload } = useApi(studentApi.overview)

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading || !data) return <PageSkeleton />

  const next = data.next_lesson
  return (
    <>
      <PageHeader title={`Добро пожаловать, ${user?.first_name}`} subtitle="Ваше обучение на сегодня" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ближайшее занятие"
          icon={CalendarClock}
          value={next ? <span className="text-2xl">{next.course_name}</span> : '—'}
          hint={next ? `${relativeDays(next.starts_at)}, ${fmtTime(next.starts_at)}` : 'Нет запланированных'}
        />
        <StatCard label="Посещаемость" icon={CalendarCheck} tone="success" value={fmtPct(data.attendance_rate)} hint="За весь период" />
        <StatCard label="Средний балл" icon={BookOpenCheck} tone="gold" value={fmtGrade(data.average_grade)} hint="из 10" />
        <StatCard
          label="Статус оплаты"
          icon={WalletCards}
          tone={data.payment_status === 'paid' ? 'success' : data.payment_status === 'pending' ? 'warning' : 'danger'}
          value={<span className="text-2xl">{paymentLabel[data.payment_status][0]}</span>}
          hint={data.total_debt ? `Долг ${fmtMoney(data.total_debt)}` : `${data.homework_due} ${plural(data.homework_due, 'задание', 'задания', 'заданий')} к сдаче`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card
          title="Мои курсы"
          subtitle="Прогресс по активным программам"
          action={<Link href="/student/progress" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-gold-dark">Подробнее <ArrowRight size={15} /></Link>}
        >
          <div className="space-y-5">
            {data.courses.map((c) => (
              <div key={c.group_id}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: c.course_color }} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-primary">{c.course_name}</p>
                      <p className="text-xs text-muted">{c.teacher_name} · {c.completed_lessons} из {c.total_lessons} занятий</p>
                    </div>
                  </div>
                  <span className="font-serif text-xl text-primary">{Math.round(c.progress)}%</span>
                </div>
                <ProgressBar value={c.progress} color={c.course_color} />
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Сегодня"
          subtitle={data.today.length ? `${data.today.length} ${plural(data.today.length, 'занятие', 'занятия', 'занятий')}` : 'Свободный день'}
          action={<Link href="/student/schedule" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-gold-dark">Расписание <ArrowRight size={15} /></Link>}
        >
          {data.today.length ? (
            <div className="space-y-3">{data.today.map((l) => <LessonRow key={l.id} item={l} />)}</div>
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="Сегодня занятий нет"
              text={next ? `Следующее: ${next.course_name}, ${fmtDateTime(next.starts_at)}` : undefined}
            />
          )}
          {data.homework_due > 0 && (
            <Link href="/student/homework" className="mt-4 flex items-center gap-3 rounded-xl bg-gold-light/70 p-3.5 transition hover:bg-gold-light">
              <ClipboardList size={20} className="text-gold-dark" />
              <span className="flex-1 text-sm font-medium text-primary">
                {data.homework_due} {plural(data.homework_due, 'задание ждёт', 'задания ждут', 'заданий ждут')} выполнения
              </span>
              <ArrowRight size={16} className="text-gold-dark" />
            </Link>
          )}
        </Card>
      </div>

      <Card title="Комментарии преподавателей" className="mt-6">
        {data.recent_comments.length ? (
          <div className="divide-y divide-line">
            {data.recent_comments.map((c) => (
              <div key={c.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary"><MessageSquareText size={17} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-primary">{c.teacher_name}</p>
                    <StatusBadge status={c.kind} map={commentKindLabel} />
                    <span className="text-xs text-muted">{relativeDays(c.created_at)}</span>
                  </div>
                  <p className="mt-1 text-[15px] leading-relaxed text-primary/85">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={MessageSquareText} title="Пока нет комментариев" />
        )}
      </Card>
      {data.payment_status === 'overdue' && (
        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl bg-danger-light p-5 sm:flex-row sm:items-center">
          <p className="text-sm text-danger"><Badge tone="danger">Просрочено</Badge> <span className="ml-2">Задолженность {fmtMoney(data.total_debt)}</span></p>
          <Link href="/student/payments" className="text-sm font-semibold text-danger underline">Перейти к оплате</Link>
        </div>
      )}
    </>
  )
}
