'use client'
import { ArrowRight, Calendar, CheckCircle, FileText } from 'lucide-react'
import Link from 'next/link'
import { AccentHero, SiteShell } from '@/components/site-shell'
import { PhotoBand } from '@/components/site/photo-band'
import { PhotoSection } from '@/components/site/photo-section'
import { PROGRAMS } from '@/lib/programs'
import { RegisterButton } from '@/components/site/register-button'
import { useTr } from '@/lib/i18n/use-tr'

const APPROACH: [string, string][] = [
  ['Персонализированное обучение', 'Индивидуальные планы, которые соответствуют интересам и темпу ученика.'],
  ['Проектное обучение', 'Реальные проекты: знания применяются на практике, а не остаются в тетради.'],
  ['Технологии и инновации', 'Современные инструменты и платформы для цифрового будущего.'],
  ['Мировоззрение', 'Воспитываем граждан, которые понимают разнообразие и действуют ответственно.'],
]

export default function Page() {
  const { tr } = useTr()
  return (
    <SiteShell>
      <AccentHero
        eyebrow="Обучение и поступление"
        title={tr('Программы Tech School и путь в школу')}
        text="Четыре ступени обучения, методика, результаты — и понятный процесс поступления в конце страницы."
      />

      {/* Программы — зигзаг */}
      <section className="container-wide reveal" style={{ margin: '100px auto' }}>
        <div className="section-heading" style={{ marginBottom: '46px' }}>
          <div>
            <p className="eyebrow">{tr('Основные программы')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(30px,3.6vw,48px)', fontWeight: 400 }}>{tr('Четыре ступени обучения')}</h2>
          </div>
        </div>
        <div className="zigzag">
          {PROGRAMS.map((p) => (
            <Link className="zigzag-row" key={p.slug} href={`/learning/${p.slug}`}>
              <span className="zigzag-media">
                <img src={p.photo ?? p.art} alt="" />
              </span>
              <span className="zigzag-body">
                <span className="eyebrow">{tr(p.age)}</span>
                <h3>{tr(p.title)}</h3>
                <span className="zigzag-text">{tr(p.short)}</span>
                <span className="chips">{p.subjects.slice(0, 6).map((s) => <span key={s.name}>{tr(s.name)}</span>)}</span>
                <span className="zigzag-more">{tr('Подробнее о программе')}<ArrowRight size={15} /></span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <PhotoSection
        image="/photos/method-bg.jpg"
        eyebrow="Методика"
        title={tr('Учим так, чтобы знание оставалось после урока')}
        text="Меньше конспектов под диктовку — больше вопросов, экспериментов и работы в командах."
      >
        <div className="numbered">
          {APPROACH.map(([title, desc], i) => (
            <article key={title}>
              <b>{String(i + 1).padStart(2, '0')}</b>
              <div>
                <h3>{tr(title)}</h3>
                <p>{tr(desc)}</p>
              </div>
            </article>
          ))}
        </div>
      </PhotoSection>

      {/* Поступление */}
      <section className="container-wide reveal" style={{ margin: '100px auto 0' }} id="admission">
        <div className="section-heading" style={{ marginBottom: '20px' }}>
          <div>
            <p className="eyebrow">{tr('Поступление')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(30px,3.8vw,52px)', fontWeight: 400 }}>{tr('Как попасть в Tech School')}</h2>
          </div>
          <RegisterButton
            className="dark-button"
            subject={{ slug: 'admission', title: 'Заявка на поступление', eyebrow: 'Поступление', note: 'Приёмная комиссия свяжется в течение дня' }}
          >
            Подать заявку
          </RegisterButton>
        </div>
      </section>
      <section className="inner-page container-wide" style={{ paddingTop: '40px' }}>
      {/* Application Steps */}
      <div style={{ marginBottom: '100px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '42px', fontWeight: 400, marginBottom: '60px' }}>{tr('Процесс поступления')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--line)' }}>
          {[
            { step: '1', title: 'Подача заявления', desc: 'Заполните онлайн-форму с базовой информацией', duration: 'День' },
            { step: '2', title: 'Вступительный тест', desc: 'Оцениваем навыки по основным предметам', duration: '1-2 недели' },
            { step: '3', title: 'Собеседование', desc: 'Встреча с администратором и учителем', duration: 'Согласовано' },
            { step: '4', title: 'Решение', desc: 'Получение результатов и оферта', duration: '3 дня' }
          ].map((step, i) => (
            <div key={i} style={{ background: 'var(--cream)', padding: '40px', minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '48px', fontWeight: 400, color: 'var(--gold)' }}>{step.step}</div>
              <div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 400, marginBottom: '12px' }}>{tr(step.title)}</h3>
                <p style={{ color: 'var(--soft)', lineHeight: 1.6, marginBottom: '20px' }}>{tr(step.desc)}</p>
              </div>
              <div style={{ marginTop: 'auto', fontSize: '13px', color: 'var(--soft)', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                ⏱ {tr(step.duration)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div style={{ marginBottom: '100px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '42px', fontWeight: 400, marginBottom: '50px' }}>{tr('Требования и календарь поступления')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '60px' }}>
          <div>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 400, marginBottom: '30px' }}>{tr('Необходимые документы')}</h3>
            <ul style={{ listStyle: 'none', padding: 0, color: 'var(--soft)' }}>
              {['Свидетельство о рождении', 'Паспорт ученика', 'Выписка из предыдущей школы', 'Медицинский осмотр', 'Рекомендательные письма', 'Резюме ученика'].map((item, i) => (
                <li key={i} style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <CheckCircle size={20} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  <span>{tr(item)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 400, marginBottom: '30px' }}>{tr('Критерии принятия')}</h3>
            <ul style={{ listStyle: 'none', padding: 0, color: 'var(--soft)' }}>
              {['Академическая успеваемость', 'Мотивация и любознательность', 'Социальные навыки', 'Соответствие ценностям школы', 'Готовность развиваться', 'Участие в сообществе'].map((item, i) => (
                <li key={i} style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <CheckCircle size={20} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  <span>{tr(item)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 400, marginBottom: '30px' }}>{tr('Календарь 2027')}</h3>
            <div style={{ borderLeft: '3px solid var(--gold)', paddingLeft: '28px' }}>
              {[
                { date: '1 февраля 2027', title: 'Открыт период подачи заявлений' },
                { date: '28 февраля 2027', title: 'Дедлайн подачи заявлений' },
                { date: '10–15 марта 2027', title: 'Вступительные тесты' },
                { date: '20–25 марта 2027', title: 'Собеседования' },
                { date: '31 марта 2027', title: 'Объявление результатов' },
                { date: '30 апреля 2027', title: 'Подтверждение зачисления' },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: '26px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '-36px', top: '6px', width: '15px', height: '15px', background: 'var(--gold)', borderRadius: '50%', border: '3px solid #fff' }} />
                  <p style={{ fontSize: '12px', letterSpacing: '.12em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '4px' }}>{item.date}</p>
                  <p style={{ color: 'var(--soft)', lineHeight: 1.5 }}>{tr(item.title)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cost */}
      <PhotoBand
        image="/photos/campus-center.jpg"
        eyebrow="Почему к нам приходят"
        title={tr('Ребёнка видят — не по фамилии в журнале, а по тому, что ему интересно')}
        text="Приёмная комиссия знакомится с каждой семьёй лично: мы подбираем программу под ребёнка, а не наоборот."
        tone="gold"
        height="sm"
      />

      <div style={{ background: 'var(--cream)', padding: '60px', marginBottom: '100px', borderRadius: '8px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '42px', fontWeight: 400, marginBottom: '50px', textAlign: 'center' }}>{tr('Стоимость обучения')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
          {[
            { name: 'Начальная школа', price: '450,000 ₸', period: 'в год' },
            { name: 'Средняя школа', price: '550,000 ₸', period: 'в год' },
            { name: 'Старшая школа', price: '650,000 ₸', period: 'в год' }
          ].map((tier, i) => (
            <div key={i} style={{ background: '#fff', padding: '40px', borderRadius: '6px', textAlign: 'center', border: i === 1 ? '3px solid var(--gold)' : 'none' }}>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 400, marginBottom: '16px' }}>{tier.name}</h3>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '42px', fontWeight: 400, color: 'var(--gold)', marginBottom: '8px' }}>{tier.price}</div>
              <p style={{ color: 'var(--soft)', marginBottom: '24px' }}>{tier.period}</p>
              <div style={{ fontSize: '13px', color: 'var(--soft)', background: 'var(--cream)', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>
                {tr('Возможны скидки за отличную успеваемость и льготы для нескольких детей')}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '15px', color: 'var(--soft)' }}>
          <p>{tr('Стоимость включает обучение, питание, внеклассные занятия и транспорт')}</p>
          <p style={{ marginTop: '12px' }}>{tr('Стипендии и финансовая помощь доступны для квалифицированных кандидатов')}</p>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ marginBottom: '100px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '42px', fontWeight: 400, marginBottom: '50px' }}>{tr('Часто задаваемые вопросы')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {[
            { q: 'Со скольких лет можно поступить?', a: 'В начальную школу от 6 лет. Для других классов определяется в зависимости от уровня.' },
            { q: 'Сложно ли вступительные экзамены?', a: 'Тесты оценивают текущий уровень знаний, не являются сложными, помогают понять зону развития.' },
            { q: 'Что если ребёнок не прошёл тест?', a: 'Мы рекомендуем подготовку и попробовать в следующий год. Даём консультацию по улучшению.' },
            { q: 'Есть ли финансовая помощь?', a: 'Да, у нас есть стипендии за академические достижения и программы финансовой помощи.' },
            { q: 'Какой размер класса?', a: 'Максимум 20-25 учеников в классе для персонализированного внимания.' }
          ].map((faq, i) => (
            <details key={i} className="faq-item">
              <summary>{tr(faq.q)}</summary>
              <p>{tr(faq.a)}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div style={{ background: 'var(--gold)', padding: '60px', borderRadius: '8px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '42px', fontWeight: 400, marginBottom: '24px' }}>{tr('Готовы начать?')}</h2>
        <p style={{ marginBottom: '30px', fontSize: '17px', maxWidth: '600px', margin: 'auto' }}>{tr('Подайте заявку сегодня и начните путь вашего ребёнка в Tech School. Мы ждём вас!')}</p>
        <RegisterButton
          className="dark-button"
          style={{ padding: '16px 32px', fontSize: '16px' }}
          subject={{ slug: 'admission', title: 'Заявка на поступление', eyebrow: 'Поступление', note: 'Приёмная комиссия свяжется в течение дня' }}
        >
          Начать заявку <ArrowRight size={18} />
        </RegisterButton>
      </div>
      </section>

    </SiteShell>
  )
}
