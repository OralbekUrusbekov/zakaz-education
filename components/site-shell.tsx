'use client'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, Camera, PlayCircle, Send, UserCircle } from 'lucide-react'
import { ScrollReveal } from './reveal'
import { SiteSearch } from './site/site-search'
import { CONTACTS, SOCIALS } from '@/lib/site'
import { useLocale } from '@/lib/i18n'
import { useTr } from '@/lib/i18n/use-tr'
import { UI } from '@/lib/i18n/dict'
import { LangSwitch } from './site/lang-switch'

export const navItems = [
  [UI.nav.home, '/'], [UI.nav.about, '/about'], [UI.nav.learning, '/learning'], [UI.nav.news, '/news'],
  [UI.nav.events, '/events'], [UI.nav.community, '/community'], [UI.nav.contacts, '/contacts'],
] as const

export function SiteShell({ children }: { children: ReactNode }) {
  const { pick } = useLocale()
  return <main className="school-site">
    <header className="school-header">
      <div className="brand-row container-wide">
        <SiteSearch />
        <Link href="/" className="school-brand"><span className="crest">T</span><span><strong>Tech School</strong><small>{pick(UI.brandTagline)}</small></span></Link>
        <div className="socials"><LangSwitch />
          <Link href="/login" aria-label={pick(UI.cabinet)} title={pick(UI.cabinet)}><UserCircle size={24} strokeWidth={1.5} /></Link>
          {SOCIALS.map((s) => {
            const Icon = s.key === 'instagram' ? Camera : s.key === 'youtube' ? PlayCircle : Send
            return (
              <a key={s.key} href={s.href} target="_blank" rel="noreferrer noopener" aria-label={s.label} title={s.label}>
                <Icon size={19} strokeWidth={1.6} />
              </a>
            )
          })}
        </div>
      </div>
      <nav className="school-nav"><div className="nav-inner">{navItems.map(([label, href]) => <Link href={href} key={href}>{pick(label)}</Link>)}</div></nav>
    </header>{children}<ScrollReveal /><footer className="school-footer"><div className="container-wide footer-grid"><div><span className="footer-brand">Tech School</span><p>{pick(UI.footerTagline)}</p></div><div><strong>{pick(UI.footerContacts)}</strong><p>{CONTACTS.address}<br /><a href={`tel:${CONTACTS.phone.replace(/[^+\d]/g, '')}`}>{CONTACTS.phone}</a><br /><a href={`mailto:${CONTACTS.email}`}>{CONTACTS.email}</a></p></div><div><strong>{pick(UI.footerNav)}</strong><p><Link href="/about">{pick(UI.nav.about)}</Link> · <Link href="/learning">{pick(UI.nav.learning)}</Link> · <Link href="/news">{pick(UI.nav.news)}</Link></p>
      <strong style={{ display: 'block', marginTop: '18px' }}>{pick(UI.footerSocial)}</strong>
      <p>{SOCIALS.map((s) => <a key={s.key} href={s.href} target="_blank" rel="noreferrer noopener" style={{ marginRight: '14px' }}>{s.label}</a>)}</p></div></div></footer>
  </main>
}

export function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  const { tr } = useTr()
  return <section className="page-hero"><div className="container-wide"><p className="eyebrow">{tr(eyebrow)}</p><h1>{tr(title)}</h1><p className="page-hero-text">{tr(text)}</p></div></section>
}

/** Светлый hero: текст на кремовом фоне + фотография справа */
export function SplitHero({
  eyebrow, title, text, image, stats = [],
}: { eyebrow: string; title: string; text: string; image: string; stats?: [string, string][] }) {
  const { tr } = useTr()
  return (
    <section className="split-hero">
      <div className="split-hero-copy">
        <p className="eyebrow">{tr(eyebrow)}</p>
        <h1>{tr(title)}</h1>
        <p>{tr(text)}</p>
        {stats.length > 0 && (
          <div className="split-hero-stats">
            {stats.map(([value, label]) => (
              <div key={label}><strong>{tr(value)}</strong><span>{tr(label)}</span></div>
            ))}
          </div>
        )}
      </div>
      <div className="split-hero-photo"><img src={image} alt="" /></div>
    </section>
  )
}

/** Золотой hero с крупным заголовком */
export function AccentHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  const { tr } = useTr()
  return (
    <section className="accent-hero">
      <div className="container-wide">
        <p className="eyebrow">{tr(eyebrow)}</p>
        <h1>{tr(title)}</h1>
        <p>{tr(text)}</p>
      </div>
    </section>
  )
}

/** Тёмный hero под афишу: снизу на него заходит карточка главного события */
export function PosterHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  const { tr } = useTr()
  return (
    <section className="poster-hero">
      <div className="container-wide">
        <p className="eyebrow">{tr(eyebrow)}</p>
        <h1>{tr(title)}</h1>
        <p>{tr(text)}</p>
      </div>
    </section>
  )
}

export function InfoPage({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children: ReactNode }) {
  return <SiteShell><PageHero eyebrow={eyebrow} title={title} text={text} /><section className="inner-page container-wide">{children}</section></SiteShell>
}

export function LinkCard({ title, text, href = '/' }: { title: string; text: string; href?: string }) {
  const { tr } = useTr()
  return <Link href={href} className="link-card"><span><h3>{tr(title)}</h3><p>{tr(text)}</p></span><ArrowRight size={18} /></Link>
}

export const mockNews = ['Новый учебный год начинается вместе', 'Открытая встреча для родителей', 'Лаборатория будущего открыта', 'Команда Tech School выиграла городской хакатон', 'Неделя искусства и науки завершилась выставкой', 'Ученики провели благотворительный фестиваль']
export const mockEvents = ['День открытых дверей', 'Научная ярмарка', 'Осенний концерт', 'Родительский клуб', 'Спортивный день', 'Выпускной вечер']
export const mockPrograms = ['Начальная школа', 'Средняя школа', 'Старшая школа', 'Подготовка к экзаменам', 'Творческие студии', 'Языковой центр']
export const mockStats = [['720', 'учеников'], ['48', 'преподавателей'], ['18', 'лет опыта'], ['96%', 'поступления в вузы']]
// Keep these as frontend-only fixtures until a backend is connected.
void mockStats
void mockPrograms
void mockEvents
void mockNews
void InfoPage
void LinkCard
void PageHero
void SiteShell
void navItems
void UserCircle
void ArrowRight
void Camera
