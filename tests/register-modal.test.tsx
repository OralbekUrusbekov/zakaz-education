import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RegisterModal } from '@/components/site/register-modal'
import type { SiteEvent } from '@/lib/events'

const event: SiteEvent = {
  slug: 'open-day',
  title: 'День открытых дверей',
  desc: 'Экскурсия по кампусу',
  location: 'Главное здание',
  time: '10:00 – 14:00',
  type: 'Для семей',
  color: '#d4ad4f',
  date: '2026-09-25',
}

const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value } })

describe('модальное окно регистрации', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('показывает событие и его детали', () => {
    render(<RegisterModal event={event} onClose={() => {}} />)
    expect(screen.getByRole('dialog')).toHaveAccessibleName(/День открытых дверей/)
    expect(screen.getByText('25 сентября 2026')).toBeInTheDocument()
    expect(screen.getByText('Главное здание')).toBeInTheDocument()
  })

  it('требует имя и телефон', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<RegisterModal event={event} onClose={() => {}} />)

    fireEvent.submit(screen.getByRole('button', { name: /Отправить заявку/ }).closest('form')!)
    expect(await screen.findByText('Укажите имя и фамилию')).toBeInTheDocument()

    fill('Имя и фамилия', 'Айгуль Серикбаева')
    fireEvent.submit(screen.getByRole('button', { name: /Отправить заявку/ }).closest('form')!)
    expect(await screen.findByText('Укажите телефон для связи')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('отправляет заявку на бэкенд и показывает подтверждение', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<RegisterModal event={event} onClose={() => {}} />)

    fill('Имя и фамилия', 'Айгуль Серикбаева')
    fill('Телефон', '+7 777 123 45 67')
    fill('Сколько человек', '3')
    fill('Комментарий', 'Придём вдвоём')
    fireEvent.click(screen.getByRole('button', { name: /Отправить заявку/ }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/registrations')
    expect(JSON.parse(init.body)).toMatchObject({
      event_slug: 'open-day',
      event_title: 'День открытых дверей',
      full_name: 'Айгуль Серикбаева',
      people: 3,
      comment: 'Придём вдвоём',
    })
    expect(await screen.findByText('Заявка отправлена')).toBeInTheDocument()
  })

  it('показывает ошибку, если сервер недоступен', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<RegisterModal event={event} onClose={() => {}} />)
    fill('Имя и фамилия', 'Марат Асанов')
    fill('Телефон', '87001234567')
    fireEvent.click(screen.getByRole('button', { name: /Отправить заявку/ }))
    expect(await screen.findByText(/Не удалось отправить заявку/)).toBeInTheDocument()
  })

  it('закрывается по Escape и по кнопке', () => {
    const onClose = vi.fn()
    render(<RegisterModal event={event} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByLabelText('Закрыть'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
