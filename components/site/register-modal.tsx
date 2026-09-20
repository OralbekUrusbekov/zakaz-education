'use client'
import { useEffect, useState } from 'react'
import { CalendarDays, Check, Clock, MapPin, X } from 'lucide-react'
import { useToast } from '@/components/cabinet/toast'
import { API_URL } from '@/lib/api/client'
import { formatEventDate } from '@/lib/events'
import { useLocale } from '@/lib/i18n'
import { UI } from '@/lib/i18n/dict'

type Status = 'form' | 'sending' | 'done'

/** Заявка: событие, семинар, программа или клуб — у всех один набор полей. */
export type RegisterSubject = {
  slug: string
  title: string
  date?: string
  time?: string
  location?: string
  eyebrow?: string
  note?: string
}

export function RegisterModal({ event, onClose }: { event: RegisterSubject; onClose: () => void }) {
  const toast = useToast()
  const { pick } = useLocale()
  const [status, setStatus] = useState<Status>('form')
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', people: 1, comment: '' })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.full_name.trim().length < 2) return setError(pick(UI.errName))
    if (form.phone.trim().length < 5) return setError(pick(UI.errPhone))
    setStatus('sending')
    setError(null)
    try {
      const res = await fetch(`${API_URL}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_slug: event.slug,
          event_title: event.title,
          event_date: event.date ? formatEventDate(event.date) : (event.note ?? null),
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          people: Number(form.people) || 1,
          comment: form.comment.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('Не удалось отправить заявку')
      setStatus('done')
      toast(pick(UI.toastSent))
    } catch {
      setStatus('form')
      setError(pick(UI.errSend))
      toast(pick(UI.toastError), 'error')
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-window" role="dialog" aria-modal="true" aria-label={`Регистрация: ${event.title}`} onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={pick(UI.close)}><X size={18} /></button>

        {status === 'done' ? (
          <div className="modal-done">
            <span className="modal-done-icon"><Check size={26} /></span>
            <h3>{pick(UI.formDone)}</h3>
            <p>«{event.title}» — {pick(UI.formDoneText)}</p>
            <button className="dark-button" onClick={onClose}>{pick(UI.formOk)}</button>
          </div>
        ) : (
          <>
            <p className="eyebrow">{event.eyebrow ?? pick(UI.registration)}</p>
            <h3 className="modal-title">{event.title}</h3>
            <div className="modal-meta">
              {event.date && <span><CalendarDays size={15} /> {formatEventDate(event.date)}</span>}
              {event.time && <span><Clock size={15} /> {event.time}</span>}
              {event.location && <span><MapPin size={15} /> {event.location}</span>}
              {!event.date && event.note && <span><CalendarDays size={15} /> {event.note}</span>}
            </div>

            <form className="modal-form" onSubmit={submit}>
              <label>
                <span>{pick(UI.formName)} *</span>
                <input value={form.full_name} onChange={set('full_name')} placeholder="Айгуль Серикбаева" required />
              </label>
              <div className="modal-row">
                <label>
                  <span>{pick(UI.formPhone)} *</span>
                  <input value={form.phone} onChange={set('phone')} placeholder="+7 777 000 00 00" required />
                </label>
                <label>
                  <span>{pick(UI.formPeople)}</span>
                  <input type="number" min={1} max={20} value={form.people} onChange={set('people')} />
                </label>
              </div>
              <label>
                <span>{pick(UI.formEmail)}</span>
                <input type="email" value={form.email} onChange={set('email')} placeholder="mail@example.com" />
              </label>
              <label>
                <span>{pick(UI.formComment)}</span>
                <textarea value={form.comment} onChange={set('comment')} rows={3} placeholder={pick(UI.formCommentHint)} />
              </label>
              {error && <p className="modal-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="outline-dark" onClick={onClose}>{pick(UI.cancel)}</button>
                <button type="submit" className="dark-button" disabled={status === 'sending'}>
                  {status === 'sending' ? pick(UI.formSending) : pick(UI.formSubmit)}
                </button>
              </div>
              <p className="modal-note">{pick(UI.formNote)}</p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
