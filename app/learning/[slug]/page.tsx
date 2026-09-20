import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, CalendarDays, Wallet } from 'lucide-react'
import { AccentHero, PageHero, SiteShell, SplitHero } from '@/components/site-shell'
import { PhotoBand } from '@/components/site/photo-band'
import { RegisterButton } from '@/components/site/register-button'
import { PROGRAMS, getProgram } from '@/lib/programs'
import { T } from '@/components/site/t'

export const generateStaticParams = () => PROGRAMS.map((p) => ({ slug: p.slug }))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProgram((await params).slug)
  return p ? { title: `${p.title} — Tech School`, description: p.short } : { title: 'Программа не найдена' }
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const program = getProgram((await params).slug)
  if (!program) notFound()


  return (
    <SiteShell>
      {program.hero === 'split' && program.photo ? (
        <SplitHero
          eyebrow={program.age}
          title={program.title}
          text={program.lead}
          image={program.photo}
          stats={program.facts.slice(0, 3)}
        />
      ) : program.hero === 'accent' ? (
        <AccentHero eyebrow={program.age} title={program.title} text={program.lead} />
      ) : (
        <PageHero eyebrow={program.age} title={program.title} text={program.lead} />
      )}

      <section className="container-wide program-top">
        <Link href="/learning" className="article-back" style={{ color: 'var(--soft)', marginBottom: '32px' }}>
          <ArrowLeft size={15} /> Все программы
        </Link>

        <div className="split-copy" style={{ marginBottom: '60px' }}>
          <div>
            <p className="eyebrow">{<T>{'О программе'}</T>}</p>
            <h2><T>{program.short}</T></h2>
          </div>
          <div>
            {program.intro.map((p, i) => (
              <p key={i} style={{ marginBottom: i === program.intro.length - 1 ? 0 : '18px' }}>{<T>{p}</T>}</p>
            ))}
          </div>
        </div>

        <div className="fact-row reveal">
          {program.facts.map(([value, label]) => (
            <div key={label}><strong>{value}</strong><span><T>{label}</T></span></div>
          ))}
        </div>
      </section>

      {/* Предметы */}
      <section className="container-wide reveal" style={{ margin: '100px auto' }}>
        <div className="section-heading" style={{ marginBottom: '40px' }}>
          <div>
            <p className="eyebrow">{<T>{'Содержание'}</T>}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(30px,3.6vw,48px)', fontWeight: 400 }}>{<T>{'Что изучаем'}</T>}</h2>
          </div>
        </div>
        <div className="subject-grid">
          {program.subjects.map((s) => (
            <article key={s.name}>
              <h3><T>{s.name}</T></h3>
              <p><T>{s.desc}</T></p>
            </article>
          ))}
        </div>
      </section>

      {/* Формат */}
      <section className="container-wide reveal" style={{ margin: '100px auto' }}>
        <p className="eyebrow">{<T>{'Как это устроено'}</T>}</p>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(30px,3.6vw,48px)', fontWeight: 400, marginBottom: '40px' }}>{<T>{'Формат обучения'}</T>}</h2>
        <div className="numbered">
          {program.format.map(([title, desc], i) => (
            <article key={title}>
              <b>{String(i + 1).padStart(2, '0')}</b>
              <div>
                <h3><T>{title}</T></h3>
                <p><T>{desc}</T></p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PhotoBand
        image={program.hero === 'split' ? '/photos/class-band.jpg' : '/photos/campus-band.jpg'}
        eyebrow="Атмосфера"
        title={program.quote.text.replace(/^«|»$/g, '')}
        text={program.quote.author}
        tone={program.hero === 'accent' ? 'gold' : 'ink'}
        height="lg"
      />

      {/* Расписание и стоимость */}
      <section className="container-wide reveal" style={{ margin: '100px auto' }}>
        <div className="schedule-block">
          <div>
            <p className="eyebrow">{<T>{'Расписание'}</T>}</p>
            <h2>{<T>{'Когда проходят занятия'}</T>}</h2>
            <dl>
              {program.schedule.map(([when, time]) => (
                <div key={when}>
                  <dt><CalendarDays size={16} /> <T>{when}</T></dt>
                  <dd><T>{time}</T></dd>
                </div>
              ))}
            </dl>
          </div>
          <aside>
            <p className="eyebrow" style={{ color: '#6d5718' }}>{<T>{'Стоимость'}</T>}</p>
            <strong><T>{program.price}</T></strong>
            <p>{<T>{'В стоимость входят учебные материалы, доступ в личный кабинет и участие в школьных событиях.'}</T>}</p>
            <RegisterButton
              style={{ marginTop: '22px' }}
              subject={{
                slug: `program-${program.slug}`,
                title: `Программа «${program.title}»`,
                eyebrow: 'Запись на программу',
                note: `${program.age} · ${program.price}`,
              }}
            >
              <Wallet size={15} style={{ marginRight: '8px' }} /> Записаться на программу
            </RegisterButton>
          </aside>
        </div>
      </section>

      {/* Результаты */}
      <section className="figures-band reveal">
        <h2>{<T>{'Результаты программы'}</T>}</h2>
        <div className="figures-grid">
          {program.results.map(([num, label]) => (
            <div key={label}><strong>{num}</strong><p><T>{label}</T></p></div>
          ))}
        </div>
      </section>

      {/* Остались вопросы */}
      <section className="container-wide reveal" style={{ margin: '100px auto 120px' }}>
        <div className="cta-band">
          <div>
            <h2>{<T>{'Остались вопросы?'}</T>}</h2>
            <p style={{ marginTop: '10px', maxWidth: '520px' }}>{<T>{'Запишитесь на встречу — покажем школу и подберём программу под ребёнка.'}</T>}</p>
          </div>
          <Link href="/contacts" className="dark-button" style={{ whiteSpace: 'nowrap' }}>{<T>{'Связаться с нами'}</T>}</Link>
        </div>
      </section>
    </SiteShell>
  )
}
