'use client'
import { useState } from 'react'
import { CalendarDays, Clock, MapPin } from 'lucide-react'
import { PosterHero, SiteShell } from '@/components/site-shell'
import { EventCalendar } from '@/components/site/event-calendar'
import { RegisterModal } from '@/components/site/register-modal'
import { EVENTS, formatEventDate, upcoming, type SiteEvent } from '@/lib/events'
import { useTr } from '@/lib/i18n/use-tr'

export default function Page() {
  const { tr } = useTr()
  const [registering, setRegistering] = useState<SiteEvent | null>(null)
  const list = upcoming(EVENTS)
  const featured = list[0]

  return (
    <SiteShell>
      <PosterHero
        eyebrow="События"
        title={tr('Календарь мероприятий Tech School')}
        text="От научных ярмарок до спортивных чемпионатов — события, которые объединяют нашу школьную семью."
      />

      {/* Главное событие */}
      {featured && (
        <section className="container-wide">
          <div className="poster-card">
            <img src={featured.image ?? '/photos/school-band.jpg'} alt="" />
            <div className="poster-card-body">
              <span className="poster-badge">{tr('Ближайшее событие')}</span>
              <h2>{tr(featured.title)}</h2>
              <p>{tr(featured.desc)}</p>
              <div className="poster-meta">
                <span><CalendarDays size={16} /> {formatEventDate(featured.date)}</span>
                <span><Clock size={16} /> {featured.time}</span>
                <span><MapPin size={16} /> {tr(featured.location)}</span>
              </div>
              <button className="gold-button" style={{ width: 'fit-content' }} onClick={() => setRegistering(featured)}>
                Зарегистрироваться
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Афиша: календарь и список */}
      <section className="container-wide reveal" style={{ margin: '90px auto 110px' }}>
        <div className="section-heading" style={{ marginBottom: '30px' }}>
          <div>
            <p className="eyebrow">{tr('Афиша')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,3.2vw,42px)', fontWeight: 400 }}>{tr('Предстоящие события')}</h2>
          </div>
        </div>
        <EventCalendar events={list} onRegister={setRegistering} emptyText="В этом месяце событий нет — посмотрите следующий" />
      </section>

      {registering && <RegisterModal event={registering} onClose={() => setRegistering(null)} />}
    </SiteShell>
  )
}
