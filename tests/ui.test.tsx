import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Avatar, Badge, GradePill, Modal, ProgressBar, StatCard, StatusBadge, Tabs } from '@/components/cabinet/ui'
import { attendanceLabel, paymentLabel } from '@/lib/format'

describe('бейджи и статусы', () => {
  it('переводит статус посещаемости', () => {
    render(<StatusBadge status="late" map={attendanceLabel} />)
    expect(screen.getByText('Опоздал')).toBeInTheDocument()
  })

  it('переводит статус оплаты', () => {
    render(<StatusBadge status="overdue" map={paymentLabel} />)
    expect(screen.getByText('Просрочено')).toBeInTheDocument()
  })

  it('красит бейдж по тону', () => {
    render(<Badge tone="success">Готово</Badge>)
    expect(screen.getByText('Готово').className).toContain('text-success')
  })
})

describe('оценка', () => {
  it('десятка помещается и красится как отличная', () => {
    render(<GradePill value={10} />)
    const pill = screen.getByText('10')
    expect(pill.className).toContain('text-success')
    expect(pill.className).toContain('min-w-8')
  })

  it('низкая оценка тревожного цвета', () => {
    render(<GradePill value={3} />)
    expect(screen.getByText('3').className).toContain('text-danger')
  })
})

describe('прогресс', () => {
  it('ограничивает значение и отдаёт aria', () => {
    render(<ProgressBar value={140} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '140')
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '100%' })
  })
})

describe('вкладки', () => {
  it('подсвечивает активную и сообщает о выборе', () => {
    const onChange = vi.fn()
    render(
      <Tabs
        value="active"
        onChange={onChange}
        tabs={[{ value: 'active', label: 'Активные', count: 5 }, { value: 'done', label: 'Сданные', count: 0 }]}
      />,
    )
    expect(screen.getByRole('tab', { name: /Активные/ })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: /Сданные/ }))
    expect(onChange).toHaveBeenCalledWith('done')
  })

  it('оставляет отступ, чтобы рамки кнопок не обрезались', () => {
    const { container } = render(<Tabs value="a" onChange={() => {}} tabs={[{ value: 'a', label: 'A' }]} />)
    expect(container.querySelector('[role=tablist]')!.className).toContain('py-1.5')
  })
})

describe('карточка показателя', () => {
  it('показывает рост и скрывает нулевое изменение', () => {
    const { rerender } = render(<StatCard label="Студенты" value={80} delta={12.5} />)
    expect(screen.getByText(/12.5%/)).toBeInTheDocument()
    rerender(<StatCard label="Студенты" value={80} delta={0} />)
    expect(screen.queryByText(/0%/)).not.toBeInTheDocument()
  })
})

describe('модальное окно кабинета', () => {
  it('не затемняет страницу', () => {
    const { container } = render(<Modal open onClose={() => {}} title="Сдать задание"><p>Тело</p></Modal>)
    const backdrop = container.querySelector('.fixed.inset-0')!
    expect(backdrop.className).not.toContain('bg-primary/40')
    expect(backdrop.className).not.toContain('backdrop-blur')
  })

  it('закрывается по Escape', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="Окно"><p>Тело</p></Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('не рендерится закрытым', () => {
    const { container } = render(<Modal open={false} onClose={() => {}} title="Окно"><p>Тело</p></Modal>)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('аватар', () => {
  it('показывает инициалы', () => {
    render(<Avatar name="Анна Ким" />)
    expect(screen.getByText('АК')).toBeInTheDocument()
  })
})
