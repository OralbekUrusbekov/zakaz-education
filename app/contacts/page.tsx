'use client'
import { ArrowRight, Phone, Mail, MapPin, Clock } from 'lucide-react'
import { InfoPage } from '@/components/site-shell'
import { ContactForm } from '@/components/site/contact-form'
import { CONTACTS, SOCIALS } from '@/lib/site'
import { useTr } from '@/lib/i18n/use-tr'

export default function Page() {
  const { tr } = useTr()
  return (
    <InfoPage 
      eyebrow="Контакты" 
      title={tr('Свяжитесь с нами')}
      text="Мы рады ответить на ваши вопросы. Выберите удобный способ связи."
    >
      {/* Contact Info */}
      <div style={{ marginBottom: '100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px', marginBottom: '60px' }}>
          <div style={{ background: 'var(--cream)', padding: '40px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <Phone size={32} style={{ color: 'var(--gold)' }} />
              <div>
                <p style={{ fontSize: '12px', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--soft)', marginBottom: '8px' }}>{tr('Телефон')}</p>
                <p style={{ fontSize: '18px', fontWeight: 600 }}>+7 (727) 000-00-00</p>
                <p style={{ fontSize: '14px', color: 'var(--soft)', marginTop: '4px' }}>{tr('Пн-Пт: 8:00 - 17:00')}</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--cream)', padding: '40px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <Mail size={32} style={{ color: 'var(--gold)' }} />
              <div>
                <p style={{ fontSize: '12px', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--soft)', marginBottom: '8px' }}>Email</p>
                <p style={{ fontSize: '18px', fontWeight: 600 }}>info@techschool.kz</p>
                <p style={{ fontSize: '14px', color: 'var(--soft)', marginTop: '4px' }}>{tr('Ответ в течение 24 часов')}</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--cream)', padding: '40px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <MapPin size={32} style={{ color: 'var(--gold)' }} />
              <div>
                <p style={{ fontSize: '12px', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--soft)', marginBottom: '8px' }}>{tr('Адрес')}</p>
                <p style={{ fontSize: '16px', fontWeight: 600 }}>{tr('Алматы')}</p>
                <p style={{ fontSize: '15px', lineHeight: 1.6 }}>{tr('Улица Манаса 34/1, кампус МУИТ')}</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--cream)', padding: '40px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <Clock size={32} style={{ color: 'var(--gold)' }} />
              <div>
                <p style={{ fontSize: '12px', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--soft)', marginBottom: '8px' }}>{tr('Часы работы')}</p>
                <p style={{ fontSize: '15px' }}>{tr('Пн-Пт: 8:00 - 17:00')}</p>
                <p style={{ fontSize: '15px' }}>{tr('Сб: 9:00 - 13:00')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div style={{ marginBottom: '100px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '42px', fontWeight: 400, marginBottom: '50px' }}>{tr('Отправьте сообщение')}</h2>
        <div style={{ background: 'var(--cream)', padding: '60px', borderRadius: '8px' }}>
          <ContactForm />
        </div>
      </div>

      {/* Departments */}
      <div style={{ marginBottom: '100px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '42px', fontWeight: 400, marginBottom: '50px' }}>{tr('Отделы и специалисты')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          {[
            { dept: 'Приёмная комиссия', contact: 'admissions@techschool.kz', phone: '+7 (727) 000-0001' },
            { dept: 'Родительский отдел', contact: 'parents@techschool.kz', phone: '+7 (727) 000-0002' },
            { dept: 'Академический отдел', contact: 'academics@techschool.kz', phone: '+7 (727) 000-0003' },
            { dept: 'Внеклассные программы', contact: 'activities@techschool.kz', phone: '+7 (727) 000-0004' }
          ].map((dept, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid var(--line)', padding: '30px', borderRadius: '6px' }}>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 400, marginBottom: '16px' }}>{tr(dept.dept)}</h3>
              <p style={{ fontSize: '14px', color: 'var(--soft)', marginBottom: '8px' }}>
                <strong>Email:</strong> {dept.contact}
              </p>
              <p style={{ fontSize: '14px', color: 'var(--soft)' }}>
                <strong>{tr('Телефон:')}</strong> {dept.phone}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Карта */}
      <div className="map-block">
        <a
          className="map-image"
          href={CONTACTS.mapLink}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={tr('Открыть адрес школы в картах')}
        >
          <img src="/photos/map-almaty.jpg" alt={tr('Карта: Алматы, улица Манаса 34/1')} />
          <span className="map-pin" aria-hidden />
          <span className="map-credit">© OpenStreetMap</span>
        </a>
        <div className="map-card">
          <p className="eyebrow">{tr('Как добраться')}</p>
          <h3>{tr('Алматы, улица Манаса 34/1')}</h3>
          <ul>
            <li>{tr('Кампус МУИТ, угол улиц Манаса и Джандосова')}</li>
            <li>{tr('Автобусы 5, 32, 63, 126 — остановка «МУИТ»')}</li>
            <li>{tr('Парковка для родителей со стороны двора')}</li>
          </ul>
          <a className="dark-button" href={CONTACTS.mapLink} target="_blank" rel="noreferrer noopener">
            Открыть в картах
          </a>
        </div>
      </div>

      {/* Social Media */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 400, marginBottom: '30px' }}>{tr('Следите за нами')}</h2>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {SOCIALS.map((s) => (
            <a key={s.key} href={s.href} target="_blank" rel="noreferrer noopener" className="social-chip">
              {s.label}
            </a>
          ))}
          <a href={`https://wa.me/${CONTACTS.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer noopener" className="social-chip">
            WhatsApp
          </a>
        </div>
      </div>
    </InfoPage>
  )
}
