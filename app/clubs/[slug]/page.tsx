import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, CalendarDays, UserRound } from 'lucide-react'
import { SiteShell, SplitHero } from '@/components/site-shell'
import { PhotoBand } from '@/components/site/photo-band'
import { RegisterButton } from '@/components/site/register-button'
import { CLUBS, getClub } from '@/lib/clubs'
import { T } from '@/components/site/t'

export const generateStaticParams = () => CLUBS.map((c) => ({ slug: c.slug }))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const club = getClub((await params).slug)
  return club ? { title: `${club.name} — Tech School`, description: club.short } : { title: 'Клуб не найден' }
}

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const club = getClub((await params).slug)
  if (!club) notFound()
  const others = CLUBS.filter((c) => c.slug !== club.slug).slice(0, 3)

  return (
    <SiteShell>
      <SplitHero
        eyebrow="Студенческий клуб"
        title={club.name}
        text={club.lead}
        image={club.cover}
        stats={[[club.members.split(' ')[0], 'участников'], ...club.achievements.slice(0, 2).map(([v, l]) => [v, l] as [string, string])]}
      />

      <section className="container-wide program-top">
        <Link href="/community" className="article-back" style={{ color: 'var(--soft)', marginBottom: '32px' }}>
          <ArrowLeft size={15} /> Все клубы
        </Link>

        <div className="split-copy" style={{ marginBottom: '60px' }}>
          <div>
            <p className="eyebrow">{<T>{'О клубе'}</T>}</p>
            <h2><T>{club.short}</T></h2>
          </div>
          <div>
            {club.about.map((p, i) => (
              <p key={i} style={{ marginBottom: i === club.about.length - 1 ? 0 : '18px' }}>{<T>{p}</T>}</p>
            ))}
          </div>
        </div>

        <div className="fact-row reveal">
          <div><strong>{club.members.split(' ')[0]}</strong><span>{<T>{'участников'}</T>}</span></div>
          {club.achievements.map(([value, label]) => (
            <div key={label}><strong>{value}</strong><span><T>{label}</T></span></div>
          ))}
        </div>
      </section>

      {/* Занятия клуба */}
      <PhotoBand
        image={club.cover}
        eyebrow={club.name}
        title={club.lead}
        tone="ink"
        height="lg"
      >
        <div className="photo-band-stats">
          {club.achievements.map(([value, label]) => (
            <div key={label}><strong>{value}</strong><span><T>{label}</T></span></div>
          ))}
        </div>
        <div className="band-subjects">
          <h3 className="band-subjects-title">{<T>{'Чем занимаемся'}</T>}</h3>
          <div className="subject-grid">
            {club.activities.map((a) => (
              <article key={a.title}>
                <h3><T>{a.title}</T></h3>
                <p><T>{a.desc}</T></p>
              </article>
            ))}
          </div>
        </div>
      </PhotoBand>

      {/* Расписание и руководитель */}
      <section className="container-wide reveal" style={{ margin: '100px auto' }}>
        <div className="schedule-block">
          <div>
            <p className="eyebrow">{<T>{'Расписание'}</T>}</p>
            <h2>{<T>{'Когда собираемся'}</T>}</h2>
            <dl>
              {club.schedule.map(([when, time]) => (
                <div key={when}>
                  <dt><CalendarDays size={16} /> <T>{when}</T></dt>
                  <dd><T>{time}</T></dd>
                </div>
              ))}
            </dl>
          </div>
          <aside style={{ background: club.tint }}>
            <p className="eyebrow" style={{ color: club.accent }}>{<T>{'Руководитель'}</T>}</p>
            <strong style={{ fontSize: '28px' }}>{club.leader.name}</strong>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><UserRound size={15} /> <T>{club.leader.role}</T></p>
            <RegisterButton
              style={{ marginTop: '22px' }}
              subject={{
                slug: `club-${club.slug}`,
                title: `Клуб «${club.name}»`,
                eyebrow: 'Запись в клуб',
                note: club.schedule.map(([when, time]) => `${when}: ${time}`).join(' · '),
              }}
            >
              Записаться в клуб
            </RegisterButton>
          </aside>
        </div>
      </section>

      {/* Другие клубы */}
      <section className="container-wide reveal" style={{ margin: '100px auto 120px' }}>
        <div className="section-heading" style={{ marginBottom: '34px' }}>
          <div>
            <p className="eyebrow">{<T>{'Ещё в школе'}</T>}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,3.2vw,42px)', fontWeight: 400 }}>{<T>{'Другие клубы'}</T>}</h2>
          </div>
          <Link href="/community" className="text-link">{<T>{'Все клубы'}</T>}<ArrowRight size={16} /></Link>
        </div>
        <div className="club-grid">
          {others.map((c) => (
            <Link key={c.slug} href={`/clubs/${c.slug}`} className="club-card">
              <span className="club-photo">
                <img src={c.art} alt="" />
                <span className="club-members" style={{ background: c.tint, color: c.accent }}>{c.members}</span>
              </span>
              <span className="club-body">
                <h3><T>{c.name}</T></h3>
                <p><T>{c.short}</T></p>
                <span className="news-more">{<T>{'Узнать больше'}</T>}<ArrowRight size={15} /></span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  )
}
