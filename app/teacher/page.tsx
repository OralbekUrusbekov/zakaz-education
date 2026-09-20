'use client'
import Link from 'next/link'
import { ArrowRight, BookOpenCheck, CalendarCheck, CalendarClock, ClipboardCheck, Users } from 'lucide-react'
import { LessonRow } from '@/components/cabinet/schedule-view'
import { Card, EmptyState, ErrorState, PageHeader, PageSkeleton, StatCard } from '@/components/cabinet/ui'
import { useTeacherGroups } from '@/components/cabinet/group-select'
import { teacherApi } from '@/lib/api/teacher'
import { useAuth } from '@/lib/auth-context'
import { fmtDate, fmtDateTime, fmtGrade, fmtPct, plural, relativeDays } from '@/lib/format'
import { useApi } from '@/lib/use-api'

export default function TeacherOverviewPage() {
  const { user } = useAuth()
  const { data, error, loading, reload } = useApi(teacherApi.overview)
  const groups = useTeacherGroups()

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading || !data) return <PageSkeleton />

  return (
    <>
      <PageHeader title={`Здравствуйте, ${user?.first_name}`} subtitle="Кабинет преподавателя" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Занятий сегодня" icon={CalendarClock} value={data.today.length} hint={data.today[0] ? `Первое в ${new Date(data.today[0].starts_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : 'Свободный день'} />
        <StatCard label="Работ на проверку" icon={ClipboardCheck} tone={data.pending_submissions ? 'gold' : 'success'} value={data.pending_submissions} hint="Ожидают оценки" />
        <StatCard label="Студентов" icon={Users} value={data.students_count} hint={`${data.groups_count} ${plural(data.groups_count, 'группа', 'группы', 'групп')}`} />
        <StatCard label="Средний балл групп" icon={BookOpenCheck} tone="success" value={fmtGrade(data.average_grade)} hint={`Посещаемость ${fmtPct(data.attendance_rate)}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card title="Сегодня" action={<Link href="/teacher/attendance" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-gold-dark">Отметить посещаемость <ArrowRight size={15} /></Link>}>
          {data.today.length ? (
            <div className="space-y-3">{data.today.map((l) => <LessonRow key={l.id} item={l} showTeacher={false} />)}</div>
          ) : (
            <EmptyState icon={CalendarCheck} title="Сегодня занятий нет" />
          )}
          {data.upcoming.length > 0 && (
            <>
              <p className="mt-6 mb-3 text-sm font-semibold text-primary">Ближайшие занятия</p>
              <div className="divide-y divide-line">
                {data.upcoming.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.course_color }} />
                    <span className="w-40 shrink-0 text-muted first-letter:uppercase">{relativeDays(l.starts_at)}, {new Date(l.starts_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-medium text-primary">{l.group_name}</span>
                    <span className="truncate text-muted">{l.topic}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card title="Ждут проверки" action={<Link href="/teacher/homework" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-gold-dark">Все <ArrowRight size={15} /></Link>}>
          {data.recent_submissions.length ? (
            <div className="divide-y divide-line">
              {data.recent_submissions.map((s) => (
                <Link key={s.id} href="/teacher/homework" className="flex items-start gap-3 py-3 first:pt-0">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary">{s.student_name}</p>
                    <p className="truncate text-xs text-muted">{s.group_name} · {s.homework_title}</p>
                    <p className="text-xs text-muted">{fmtDateTime(s.submitted_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={ClipboardCheck} title="Все работы проверены" />
          )}
        </Card>
      </div>

      <h2 className="mt-9 mb-4 font-serif text-2xl text-primary">Мои группы</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(groups.data ?? []).map((g) => (
          <Link key={g.id} href={`/teacher/students?group=${g.id}`} className="group rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(16,24,40,.07)]">
            <div className="flex items-center justify-between">
              <span className="rounded-lg px-2.5 py-1 text-xs font-bold text-white" style={{ background: g.course_color }}>{g.name}</span>
              <ArrowRight size={16} className="text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-3 font-serif text-lg text-primary">{g.course_name}</p>
            <p className="text-xs text-muted">до {fmtDate(g.end_date)}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
              <div><p className="font-serif text-xl text-primary">{g.students_count}</p><p className="text-[11px] text-muted">студентов</p></div>
              <div><p className="font-serif text-xl text-primary">{fmtGrade(g.average_grade)}</p><p className="text-[11px] text-muted">ср. балл</p></div>
              <div><p className="font-serif text-xl text-primary">{fmtPct(g.attendance_rate)}</p><p className="text-[11px] text-muted">посещ.</p></div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
