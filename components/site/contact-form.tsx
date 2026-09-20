'use client'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useToast } from '@/components/cabinet/toast'
import { API_URL } from '@/lib/api/client'
import { useLocale } from '@/lib/i18n'
import { UI } from '@/lib/i18n/dict'

const TOPICS = [
  { ru: 'Вопрос о поступлении', kk: 'Қабылдау туралы сұрақ' },
  { ru: 'Вопрос об обучении', kk: 'Оқу туралы сұрақ' },
  { ru: 'Финансовые вопросы', kk: 'Қаржы мәселелері' },
  { ru: 'Техническая поддержка', kk: 'Техникалық қолдау' },
  { ru: 'Другое', kk: 'Басқа' },
]

const field: React.CSSProperties = {
  width: '100%', padding: '12px 16px', border: '1px solid var(--line)', borderRadius: '4px',
  fontFamily: 'Inter, sans-serif', fontSize: '16px', background: '#fff',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600,
}

/** Форма обратной связи: уходит на бэкенд и подтверждается всплывающим уведомлением. */
export function ContactForm() {
  const toast = useToast()
  const { lang, pick } = useLocale()
  const [form, setForm] = useState({ name: '', email: '', phone: '', topic: TOPICS[0].ru, message: '' })
  const [sending, setSending] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.name.trim().length < 2) return toast(pick(UI.errContactName), 'error')
    if (form.phone.trim().length < 5 && form.email.trim().length < 5) return toast(pick(UI.errContactWay), 'error')
    if (form.message.trim().length < 5) return toast(pick(UI.errContactText), 'error')

    setSending(true)
    try {
      const res = await fetch(`${API_URL}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_slug: 'contact-form',
          event_title: `Обращение: ${form.topic}`,
          event_date: null,
          full_name: form.name.trim(),
          phone: form.phone.trim() || '—',
          email: form.email.trim() || null,
          people: 1,
          comment: form.message.trim(),
        }),
      })
      if (!res.ok) throw new Error()
      toast(pick(UI.contactSent))
      setForm({ name: '', email: '', phone: '', topic: TOPICS[0].ru, message: '' })
    } catch {
      toast(pick(UI.contactError), 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <form style={{ display: 'grid', gap: '14px', maxWidth: '600px' }} onSubmit={submit}>
      <div>
        <label style={labelStyle} htmlFor="contact-name">{pick(UI.contactName)}</label>
        <input id="contact-name" style={field} placeholder="Иван Петров" value={form.name} onChange={set('name')} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="contact-email">Email</label>
        <input id="contact-email" type="email" style={field} placeholder="ivan@example.com" value={form.email} onChange={set('email')} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="contact-phone">{pick(UI.formPhone)}</label>
        <input id="contact-phone" style={field} placeholder="+7 (700) 000-00-00" value={form.phone} onChange={set('phone')} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="contact-topic">{pick(UI.contactTopic)}</label>
        <select id="contact-topic" style={field} value={form.topic} onChange={set('topic')}>
          {TOPICS.map((t) => <option key={t.ru} value={t.ru}>{lang === 'kk' ? t.kk : t.ru}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle} htmlFor="contact-message">{pick(UI.contactMessage)}</label>
        <textarea
          id="contact-message"
          rows={5}
          style={{ ...field, resize: 'vertical' }}
          placeholder={pick(UI.contactPlaceholder)}
          value={form.message}
          onChange={set('message')}
        />
      </div>
      <button
        type="submit"
        disabled={sending}
        style={{
          background: 'var(--ink)', color: '#fff', padding: '14px 24px', fontWeight: 600, fontSize: '14px',
          borderRadius: '4px', cursor: sending ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center',
          gap: '10px', width: 'fit-content', opacity: sending ? 0.7 : 1,
        }}
      >
        {sending ? pick(UI.formSending) : pick(UI.send)} <ArrowRight size={16} />
      </button>
    </form>
  )
}
