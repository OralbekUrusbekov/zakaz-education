'use client'
import Link from 'next/link'
import { ArrowRight, Award, Users, BookOpen, Zap } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { NEWS, formatNewsDateShort, newsArt } from '@/lib/news'
import { RegisterButton } from '@/components/site/register-button'
import { HeroMedia } from '@/components/site/hero-media'
import { useTr } from '@/lib/i18n/use-tr'

const programs = [
  { title: 'Начальная школа', desc: 'Классы 1-4. Фундамент любопытства и уверенности', href: '/learning/primary', photo: '/programs/primary.jpg' },
  { title: 'Средняя школа', desc: 'Классы 5-9. Углубленное изучение, творчество и STEM', href: '/learning/middle', photo: '/programs/middle.jpg' },
  { title: 'Старшая школа', desc: 'Классы 10-11. Подготовка к профессиональной карьере', href: '/learning/high', photo: '/programs/high.jpg' },
  { title: 'Дополнительные студии', desc: 'Искусство, музыка, программирование, спорт', href: '/learning/studios', photo: '/programs/studios.jpg' },
]

const testimonials = [
  { name: 'Айнур Касимова', grade: 'Ученица 9 класса', text: 'Tech School — это не просто школа. Здесь я нашла друзей, вдохновение и уверенность в себе.' },
  { name: 'Марат Асанов', grade: 'Родитель', text: 'Мой сын за год в Tech School стал более самостоятельным и любознательным. Спасибо команде!' },
  { name: 'Лейла Абдрахманова', grade: 'Ученица 11 класса', text: 'Учителя здесь действительно верят в каждого ученика. Поступила в мечтный вуз!' }
]

export default function Page() {
  const { tr } = useTr()
  return (
    <SiteShell>
      {/* Hero Section */}
      <section className="school-hero">
        <HeroMedia />
        <div className="hero-copy">
          <p>{tr('Образование начинается с вдохновения')}</p>
          <h1>{tr('Будущее начинается здесь')}</h1>
          <Link href="/learning#admission" className="outline-button">{tr('Начать путь')}<ArrowRight size={16} /></Link>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="intro-section container-wide">
        <div>
          <p className="eyebrow">{tr('Добро пожаловать в Tech School')}</p>
          <h2>{tr('Школа, где любопытство становится силой')}</h2>
        </div>
        <div className="intro-text">
          <p>{tr('Мы создали пространство, где каждый ученик может думать шире, учиться с удовольствием и уверенно строить своё будущее. Tech School — это не просто учреждение образования, это сообщество людей, которые верят в силу знаний и личностного развития.')}</p>
          <Link href="/about" className="text-link">{tr('О нашей философии')}<ArrowRight size={16} /></Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="feature-grid">
        <article className="feature-card feature-dark">
          <p className="eyebrow">{tr('Подход')}</p>
          <h2>{tr('Личностно-ориентированное обучение')}</h2>
          <p>{tr('Каждый ученик — уникален. Мы создаём условия для раскрытия полного потенциала каждого.')}</p>
          <Link href="/learning" className="text-link light">{tr('Смотреть программы')}<ArrowRight size={16} /></Link>
        </article>
        <article className="feature-card feature-gold">
          <p className="eyebrow">{tr('Сообщество')}</p>
          <h2>{tr('Вместе мы сильнее')}</h2>
          <p>{tr('Поддерживающая среда, где ценят индивидуальность, уважают разнообразие, и все растут вместе.')}</p>
          <Link href="/events" className="text-link">{tr('Наши события')}<ArrowRight size={16} /></Link>
        </article>
      </section>

      {/* Stats Section */}
      <section className="container-wide" style={{ margin: '120px auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--line)' }}>
        <div className="stat">
          <strong>720+</strong>
          <span>{tr('Учеников')}</span>
        </div>
        <div className="stat">
          <strong>48</strong>
          <span>{tr('Высокопрофессиональных преподавателей')}</span>
        </div>
        <div className="stat">
          <strong>{tr('18 лет')}</strong>
          <span>{tr('Опыта образования')}</span>
        </div>
        <div className="stat">
          <strong>96%</strong>
          <span>{tr('Поступления в топ вузы')}</span>
        </div>
      </section>

      {/* Programs Section */}
      <section className="container-wide" style={{ margin: '100px auto' }}>
        <div style={{ marginBottom: '60px' }}>
          <p className="eyebrow">{tr('Программы обучения')}</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(34px, 4vw, 56px)', marginBottom: '24px' }}>{tr('Путь обучения для каждого возраста')}</h2>
        </div>
        <div className="program-cards">
          {programs.map((prog) => (
            <Link key={prog.title} href={prog.href} className="program-card">
              <span className="program-card-photo"><img src={prog.photo} alt="" /></span>
              <span className="program-card-body">
                <h3>{tr(prog.title)}</h3>
                <p>{tr(prog.desc)}</p>
                <span className="news-more">{tr('Подробнее')}<ArrowRight size={15} /></span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* News & Events Section */}
      <section className="container-wide" style={{ margin: '100px auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px', gap: '24px' }}>
          <div>
            <p className="eyebrow">{tr('Из жизни школы')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(34px, 4vw, 56px)' }}>{tr('Новости и события')}</h2>
          </div>
          <Link href="/news" className="text-link">{tr('Все новости')}<ArrowRight size={16} /></Link>
        </div>
        <div className="news-cards">
          {NEWS.slice(0, 3).map((n) => (
            <Link key={n.slug} href={`/news/${n.slug}`} className="news-card">
              <span className="news-card-photo"><img src={newsArt(n)} alt="" /></span>
              <span className="news-card-body">
                <span className="news-card-meta">
                  <span className="news-tag">{tr(n.category)}</span>
                  <span className="news-date">{formatNewsDateShort(n.date)}</span>
                </span>
                <h2>{tr(n.title)}</h2>
                <p>{tr(n.excerpt)}</p>
                <span className="news-more">{tr('Читать')}<ArrowRight size={15} /></span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{ background: 'var(--cream)', padding: '100px 0', margin: '100px 0' }}>
        <div className="container-wide">
          <div style={{ marginBottom: '60px' }}>
            <p className="eyebrow">{tr('Отзывы')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(34px, 4vw, 56px)' }}>{tr('Что говорят наши ученики и родители')}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
            {testimonials.map((test, i) => (
              <figure key={i} className="testimonial">
                <span className="testimonial-mark">“</span>
                <blockquote>{tr(test.text)}</blockquote>
                <figcaption>
                  <span className="testimonial-avatar">{test.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                  <span>
                    <strong>{test.name}</strong>
                    <small>{tr(test.grade)}</small>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="container-wide" style={{ margin: '100px auto' }}>
        <div style={{ marginBottom: '60px' }}>
          <p className="eyebrow">{tr('Почему Tech School')}</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(34px, 4vw, 56px)' }}>{tr('Четыре столпа нашей философии')}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--line)' }}>
          {[
            { icon: <BookOpen size={40} />, title: 'Интеллектуальное развитие', desc: 'Глубокие знания + критическое мышление' },
            { icon: <Users size={40} />, title: 'Социальное формирование', desc: 'Лидерство, сотрудничество, эмпатия' },
            { icon: <Zap size={40} />, title: 'Творческое выражение', desc: 'Искусство, музыка, инновация' },
            { icon: <Award size={40} />, title: 'Личностный рост', desc: 'Самопознание, уверенность, resilience' }
          ].map((item, i) => (
            <div key={i} style={{ background: 'var(--cream)', padding: '40px', minHeight: '280px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ color: 'var(--gold)' }}>{item.icon}</div>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 400 }}>{tr(item.title)}</h3>
              <p style={{ color: 'var(--soft)', lineHeight: 1.6, fontSize: '15px' }}>{tr(item.desc)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Faculty Preview */}
      <section style={{ background: '#f0ebe4', padding: '100px 0', margin: '100px 0' }}>
        <div className="container-wide">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <p className="eyebrow">{tr('Преподаватели')}</p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(34px, 4vw, 56px)', marginBottom: '24px' }}>{tr('Опытная и вдохновляющая команда')}</h2>
              <p style={{ fontSize: '17px', lineHeight: 1.8, color: 'var(--soft)', marginBottom: '24px' }}>{tr('Наша команда состоит из 48 квалифицированных преподавателей с глубокими знаниями и страстью к образованию. Каждый верит в потенциал учеников и помогает раскрыть его.')}</p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {['Магистры и кандидаты наук', 'Прошли международные сертификации', 'Участники профессиональных конференций', 'Менторы и лидеры своих областей'].map((item, i) => (
                  <li key={i} style={{ padding: '8px 0', fontSize: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>+</span> {tr(item)}
                  </li>
                ))}
              </ul>
            </div>
            <img src="/photos/teachers.jpg" alt={tr('Преподаватели и ученики Tech School')} style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '12px' }} />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section style={{ background: 'var(--ink)', color: '#fff', padding: '80px 0', margin: '100px 0' }}>
        <div className="container-wide" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(40px, 5vw, 64px)', marginBottom: '24px' }}>{tr('Готовы присоединиться к Tech School?')}</h2>
          <p style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto 40px', color: '#d4d3df' }}>{tr('Начните путь вашего ребенка в школу, где каждый голос слышен и каждый талант развивается.')}</p>
          <RegisterButton
            className="gold-button"
            style={{ padding: '14px 28px', fontSize: '14px' }}
            subject={{ slug: 'admission', title: 'Заявка на поступление', eyebrow: 'Поступление', note: 'Приёмная комиссия свяжется в течение дня' }}
          >
            {tr('Подать заявку на поступление')} <ArrowRight size={16} />
          </RegisterButton>
        </div>
      </section>
    </SiteShell>
  )
}
