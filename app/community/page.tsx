'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Award, Calendar, FileText, MessageCircle, Users, Wallet,
} from 'lucide-react'
import { InfoPage } from '@/components/site-shell'
import { EventCalendar } from '@/components/site/event-calendar'
import { PhotoBand } from '@/components/site/photo-band'
import { RegisterModal } from '@/components/site/register-modal'
import { CLUBS } from '@/lib/clubs'
import { SEMINARS, upcoming, type SiteEvent } from '@/lib/events'
import { useTr } from '@/lib/i18n/use-tr'

const QUICK = [
  { icon: Award, title: 'Личный кабинет', desc: 'Оценки, расписание, домашние задания и оплата', href: '/login' },
  { icon: Users, title: 'Клубы и студии', desc: 'Шесть направлений после уроков', href: '#clubs' },
  { icon: Calendar, title: 'Школьный календарь', desc: 'События, каникулы и семинары', href: '/events' },
  { icon: MessageCircle, title: 'Связь с учителями', desc: 'Комментарии в кабинете и личные встречи', href: '/contacts' },
  { icon: FileText, title: 'Документы и политики', desc: 'Правила школы, справки и заявления', href: '/learning#admission' },
  { icon: Wallet, title: 'Финансовая информация', desc: 'Стоимость, стипендии и льготы', href: '/learning' },
]

const FOR_STUDENTS: [string, string][] = [
  ['Репетиторство', 'помощь по сложным предметам'],
  ['Консультации', 'с учителями и специалистами'],
  ['Библиотека', '10 000+ книг и электронных ресурсов'],
  ['Лаборатории', 'практическое обучение STEM'],
  ['Психолог', 'конфиденциальная поддержка'],
  ['Спорт и здоровье', 'медкабинет и современные площадки'],
]

const FOR_PARENTS: [string, string][] = [
  ['Родительский портал', 'успеваемость и посещаемость онлайн'],
  ['Еженедельные новости', 'от классного руководителя'],
  ['Родительские конференции', 'личные встречи в октябре и марте'],
  ['Родительский комитет', 'помощь в организации событий'],
  ['Волонтёрские программы', 'будьте частью сообщества'],
  ['Совет попечителей', 'влияние на стратегию школы'],
]

const RESOURCES = [
  { title: 'Школьная библиотека', items: ['Электронные книги', 'Научные журналы', 'Образовательные базы'] },
  { title: 'Онлайн платформы', items: ['LMS Tech School', 'Khan Academy', 'Google Classroom'] },
  { title: 'Кабинеты и лаборатории', items: ['Компьютерный класс', 'Лаборатория физики', 'Творческая студия'] },
  { title: 'Инструменты обучения', items: ['Видео-уроки', 'Интерактивные тесты', 'Конспекты и шпаргалки'] },
]

const FAQ = [
  { q: 'Каков процесс поступления?', a: 'Заявление, вступительный тест и собеседование — весь путь занимает около месяца. Подробности — в разделе «Поступление» на странице обучения.' },
  { q: 'Какие варианты питания доступны?', a: 'Завтраки, обеды и полдники в школьной столовой. Диетические потребности учитываем по заявлению родителей.' },
  { q: 'Есть ли школьный транспорт?', a: 'Да, автобусы ходят по основным районам города. Стоимость оплачивается отдельно.' },
  { q: 'Как часто проходят родительские конференции?', a: 'Дважды в год — в октябре и марте. Дополнительную встречу можно назначить в любое время через кабинет.' },
  { q: 'Какая политика по пропускам?', a: 'О пропуске нужно сообщить до начала занятий. Отсутствие дольше трёх дней подтверждается справкой.' },
  { q: 'Можно ли записаться в клуб в середине года?', a: 'Да. Первый месяц в любой студии — пробный, менять направление можно без ограничений.' },
]

export default function Page() {
  const { tr } = useTr()
  const [registering, setRegistering] = useState<SiteEvent | null>(null)

  return (
    <InfoPage
      eyebrow="Ученикам и родителям"
      title={tr('Всё для ученика и семьи')}
      text="Личный кабинет, клубы, поддержка, семинары и ответы на частые вопросы — в одном месте."
    >
      {/* Быстрый доступ */}
      <div className="quick-grid">
        {QUICK.map(({ icon: Icon, title, desc, href }) => (
          <Link key={title} href={href} className="quick-card">
            <span className="quick-icon"><Icon size={26} strokeWidth={1.6} /></span>
            <span>
              <h3>{tr(title)}</h3>
              <p>{tr(desc)}</p>
            </span>
            <ArrowRight size={17} />
          </Link>
        ))}
      </div>

      {/* Поддержка: ученикам и родителям */}
      <div className="tinted-block" style={{ marginTop: '90px' }}>
        <div className="section-heading" style={{ marginBottom: '36px' }}>
          <div>
            <p className="eyebrow">{tr('Поддержка')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,3.2vw,42px)', fontWeight: 400 }}>{tr('Кто и чем помогает')}</h2>
          </div>
        </div>
        <div className="support-grid">
          <div>
            <h3>{tr('Ученику')}</h3>
            <ul>
              {FOR_STUDENTS.map(([name, desc]) => (
                <li key={name}><strong>{tr(name)}</strong> — {tr(desc)}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>{tr('Родителям')}</h3>
            <ul>
              {FOR_PARENTS.map(([name, desc]) => (
                <li key={name}><strong>{tr(name)}</strong> — {tr(desc)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Клубы */}
      <div id="clubs" style={{ margin: '100px 0', scrollMarginTop: '24px' }}>
        <div className="section-heading" style={{ marginBottom: '34px' }}>
          <div>
            <p className="eyebrow">{tr('После уроков')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,3.2vw,42px)', fontWeight: 400 }}>{tr('Клубы и студии')}</h2>
          </div>
          <Link href="/learning/studios" className="text-link">{tr('О дополнительных программах')}<ArrowRight size={16} /></Link>
        </div>
        <div className="club-grid">
          {CLUBS.map((club) => (
            <Link key={club.slug} href={`/clubs/${club.slug}`} className="club-card">
              <span className="club-photo">
                <img src={club.art} alt="" />
                <span className="club-members" style={{ background: club.tint, color: club.accent }}>{tr(club.members)}</span>
              </span>
              <span className="club-body">
                <h3>{tr(club.name)}</h3>
                <p>{tr(club.short)}</p>
                <span className="news-more">{tr('Узнать больше')}<ArrowRight size={15} /></span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Связь с семьёй и ресурсы для учёбы */}
      <PhotoBand
        image="/photos/class-band.jpg"
        eyebrow="Вы в курсе всего"
        title={tr('Школа на связи с семьёй каждый день')}
        text="Оценки, посещаемость и комментарии педагогов — в личном кабинете. Важное дублируем в мессенджере и на родительских встречах."
        height="lg"
      >
        <div className="photo-band-stats">
          <div><strong>24/7</strong><span>{tr('личный кабинет')}</span></div>
          <div><strong>{tr('1 раз')}</strong><span>{tr('в месяц — клуб родителей')}</span></div>
          <div><strong>{tr('48 ч')}</strong><span>{tr('ответ на обращение')}</span></div>
        </div>
        <div className="band-resources">
          <h3 className="band-resources-title">{tr('Всё, что нужно для учёбы')}</h3>
          <div className="resources-grid">
            {RESOURCES.map((group) => (
              <div key={group.title}>
                <h3>{tr(group.title)}</h3>
                <ul>{group.items.map((i) => <li key={i}>{tr(i)}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </PhotoBand>

      {/* Семинары */}
      <div className="reveal" style={{ margin: '100px 0' }}>
        <div className="section-heading" style={{ marginBottom: '28px' }}>
          <div>
            <p className="eyebrow">{tr('Обучение для родителей')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,3.2vw,42px)', fontWeight: 400 }}>{tr('Семинары и мастер-классы')}</h2>
          </div>
        </div>
        <EventCalendar
          events={upcoming(SEMINARS)}
          onRegister={setRegistering}
          listLabel="Списком"
          emptyText="В этом месяце семинаров нет — посмотрите следующий месяц"
        />
      </div>

      {/* Вопросы */}
      <div style={{ marginBottom: '100px' }}>
        <div className="section-heading" style={{ marginBottom: '34px' }}>
          <div>
            <p className="eyebrow">{tr('Коротко')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,3.2vw,42px)', fontWeight: 400 }}>{tr('Частые вопросы')}</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gap: '14px' }}>
          {FAQ.map((faq) => (
            <details key={faq.q} className="faq-item">
              <summary>{tr(faq.q)}</summary>
              <p>{tr(faq.a)}</p>
            </details>
          ))}
        </div>
      </div>

      {registering && <RegisterModal event={registering} onClose={() => setRegistering(null)} />}
    </InfoPage>
  )
}
