'use client'
import { ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { SiteShell, SplitHero } from '@/components/site-shell'
import { PhotoSection } from '@/components/site/photo-section'
import { RegisterButton } from '@/components/site/register-button'
import { useTr } from '@/lib/i18n/use-tr'

const VALUES = [
  { title: 'Уважение', desc: 'К каждому человеку, его идеям и опыту' },
  { title: 'Честность', desc: 'В словах, действиях и взаимоотношениях' },
  { title: 'Инновация', desc: 'Смелость пробовать новое и учиться на ошибках' },
  { title: 'Включение', desc: 'Каждый ученик — часть нашего сообщества' },
]

const HISTORY = [
  { year: '2007', title: 'Основание Tech School', desc: 'Первый класс из 25 учеников и мечта об инновационном образовании.' },
  { year: '2011', title: 'Расширение', desc: 'Средняя школа, творческие студии и языковой центр.' },
  { year: '2015', title: 'Признание', desc: 'Лучшая школа района по результатам государственного тестирования.' },
  { year: '2019', title: 'Аккредитация', desc: 'Сертификаты международных организаций образования.' },
  { year: '2024', title: 'Современный кампус', desc: '720+ учеников, 48 преподавателей и новая лаборатория.' },
]

const MISSION: [string, string][] = [
  ['Думать критически', 'Ставить вопросы, искать ответы и создавать новое'],
  ['Расти как личность', 'Находить свой голос и уверенность в себе'],
  ['Служить обществу', 'Понимать свою роль в создании лучшего мира'],
]

export default function Page() {
  const { tr } = useTr()
  return (
    <SiteShell>
      <SplitHero
        eyebrow="О нас"
        title={tr('История и миссия Tech School')}
        text="Основанная в 2007 году, Tech School выросла из одного класса в образовательный центр, где каждый ученик становится открывателем нового мира."
        image="/photos/campus-wide.jpg"
        stats={[['18 лет', 'в образовании'], ['720+', 'учеников'], ['48', 'преподавателей']]}
      />

      {/* Миссия */}
      <section className="container-wide reveal" style={{ margin: '110px auto 0' }}>
        <div className="split-copy">
          <div>
            <p className="eyebrow">{tr('Наша миссия')}</p>
            <h2>{tr('Вдохновлять, развивать, вести')}</h2>
          </div>
          <p>
            {tr('Tech School верит, что образование — это не передача знаний, а пробуждение способности мыслить, чувствовать и действовать. Мы создаём среду, где ученик учится не ради оценки, а ради интереса.')}
          </p>
        </div>
        <div className="numbered">
          {MISSION.map(([title, desc], i) => (
            <article key={title}>
              <b>{String(i + 1).padStart(2, '0')}</b>
              <div>
                <h3>{tr(title)}</h3>
                <p>{tr(desc)}</p>
              </div>
            </article>
          ))}
          <article>
            <b><Check size={30} strokeWidth={1.4} /></b>
            <div>
              <h3>{tr('И делать это вместе')}</h3>
              <p>{tr('Ученики, преподаватели и родители — одна команда с общей целью')}</p>
            </div>
          </article>
        </div>
      </section>

      {/* Цитата и ценности */}
      <section className="container-wide reveal" style={{ margin: '110px auto' }}>
        <div className="quote-block">
          <p style={{ fontSize: '32px' }}>
            «Школа — это не здание и не расписание. Это люди, которые верят в ученика чуть раньше, чем он поверит в себя».
          </p>
          <span>{tr('Ерлан Сейтказиев, директор Tech School')}</span>
        </div>
        <div className="numbered" style={{ marginTop: '40px' }}>
          {VALUES.map((v) => (
            <article key={v.title}>
              <b>·</b>
              <div>
                <h3>{tr(v.title)}</h3>
                <p>{tr(v.desc)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PhotoSection
        image="/photos/story-bg.jpg"
        eyebrow="Наше сообщество"
        title={tr('Восемнадцать лет мы строим школу вместе с семьями')}
        text="От одного класса в 2007 году до образовательного центра с собственной лабораторией и студиями."
        action={<Link href="/learning#admission" className="text-link">{tr('Стать частью истории')}<ArrowRight size={16} /></Link>}
      >
        <div className="timeline">
          {HISTORY.map((h) => (
            <div className="timeline-item" key={h.year}>
              <strong>{h.year}</strong>
              <h3>{tr(h.title)}</h3>
              <p>{tr(h.desc)}</p>
            </div>
          ))}
        </div>
      </PhotoSection>

      {/* CTA */}
      <section className="container-wide reveal" style={{ margin: '100px auto 120px' }}>
        <div className="cta-band">
          <div>
            <h2>{tr('Хотите узнать больше?')}</h2>
            <p style={{ marginTop: '10px', maxWidth: '520px' }}>{tr('Посетите школу, встретьтесь с командой и почувствуйте дух Tech School.')}</p>
          </div>
          <RegisterButton
            style={{ whiteSpace: 'nowrap' }}
            subject={{ slug: 'school-tour', title: 'Экскурсия по школе', eyebrow: 'Запись на экскурсию', note: 'Проводим по будням в 11:00 и 15:00' }}
          >
            Записаться на экскурсию
          </RegisterButton>
        </div>
      </section>
    </SiteShell>
  )
}
