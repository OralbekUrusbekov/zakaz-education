import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EventCalendar } from '@/components/site/event-calendar'
import type { SiteEvent } from '@/lib/events'

const makeEvent = (day: number, extra: Partial<SiteEvent> = {}): SiteEvent => {
  const d = new Date()
  d.setDate(d.getDate() + day)
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return {
    slug: `event-${day}`,
    title: `Событие ${day}`,
    desc: 'Описание события',
    location: 'Актовый зал',
    time: '15:00 – 17:00',
    type: 'Учебное',
    color: '#4f6bd8',
    date: iso,
    ...extra,
  }
}

describe('календарь событий', () => {
  it('открывается на месяце ближайшего события', () => {
    render(<EventCalendar events={[makeEvent(2)]} />)
    const month = new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(month)
  })

  it('показывает событие в сетке', () => {
    render(<EventCalendar events={[makeEvent(1, { title: 'Научная ярмарка' })]} />)
    expect(screen.getByText(/Научная ярмарка/)).toBeInTheDocument()
  })

  it('по клику на день открывает панель с событиями', () => {
    render(<EventCalendar events={[makeEvent(1, { title: 'Концерт студии' })]} />)
    fireEvent.click(screen.getByText(/Концерт студии/).closest('.calendar-cell')!)
    expect(screen.getByText('1 событие')).toBeInTheDocument()
    expect(screen.getByText('Описание события')).toBeInTheDocument()
  })

  it('кнопка регистрации вызывает обработчик', () => {
    const onRegister = vi.fn()
    const event = makeEvent(1)
    render(<EventCalendar events={[event]} onRegister={onRegister} />)
    fireEvent.click(screen.getByText(/Событие 1/).closest('.calendar-cell')!)
    fireEvent.click(screen.getAllByRole('button', { name: 'Зарегистрироваться' })[0])
    expect(onRegister).toHaveBeenCalledWith(event)
  })

  it('переключается на список', () => {
    render(<EventCalendar events={[makeEvent(1), makeEvent(5)]} listLabel="Списком" />)
    fireEvent.click(screen.getByRole('button', { name: /Списком/ }))
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(2)
    expect(screen.getAllByText('Актовый зал').length).toBeGreaterThan(0)
  })

  it('листает месяцы и сообщает о пустом месяце', () => {
    render(<EventCalendar events={[makeEvent(1)]} emptyText="Событий нет" />)
    fireEvent.click(screen.getByLabelText('Следующий месяц'))
    fireEvent.click(screen.getByLabelText('Следующий месяц'))
    expect(screen.getByText('Событий нет')).toBeInTheDocument()
  })
})
