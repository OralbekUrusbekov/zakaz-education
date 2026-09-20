import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Pagination } from '@/components/site/pagination'
import { Pager } from '@/components/cabinet/pager'

describe('пагинация сайта', () => {
  it('не показывается на одной странице', () => {
    const { container } = render(<Pagination page={1} total={1} onChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('рисует все страницы, когда их мало', () => {
    render(<Pagination page={1} total={3} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument()
  })

  it('сворачивает длинный список многоточиями', () => {
    render(<Pagination page={6} total={12} onChange={() => {}} />)
    expect(screen.getAllByText('…')).toHaveLength(2)
    expect(screen.getByRole('button', { name: '12' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '3' })).not.toBeInTheDocument()
  })

  it('стрелки блокируются на краях', () => {
    const { rerender } = render(<Pagination page={1} total={4} onChange={() => {}} />)
    expect(screen.getByLabelText('Предыдущая страница')).toBeDisabled()
    rerender(<Pagination page={4} total={4} onChange={() => {}} />)
    expect(screen.getByLabelText('Следующая страница')).toBeDisabled()
  })

  it('сообщает выбранную страницу', () => {
    const onChange = vi.fn()
    render(<Pagination page={2} total={5} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '4' }))
    fireEvent.click(screen.getByLabelText('Следующая страница'))
    expect(onChange).toHaveBeenNthCalledWith(1, 4)
    expect(onChange).toHaveBeenNthCalledWith(2, 3)
  })
})

describe('пагинация кабинета', () => {
  it('показывает диапазон записей', () => {
    render(<Pager page={2} pageCount={3} onChange={() => {}} from={21} to={40} total={54} />)
    expect(screen.getByText('Показано 21–40 из 54')).toBeInTheDocument()
  })

  it('скрыта при одной странице', () => {
    const { container } = render(<Pager page={1} pageCount={1} onChange={() => {}} from={1} to={5} total={5} />)
    expect(container).toBeEmptyDOMElement()
  })
})
