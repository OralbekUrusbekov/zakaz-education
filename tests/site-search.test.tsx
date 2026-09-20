import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SiteSearch } from '@/components/site/site-search'
import { SOCIALS } from '@/lib/site'

const openSearch = () => {
  render(<SiteSearch />)
  fireEvent.click(screen.getByLabelText('Поиск по сайту'))
}
const type = (value: string) => fireEvent.change(screen.getByLabelText('Поисковый запрос'), { target: { value } })

describe('поиск по сайту', () => {
  it('открывается по клику на лупу', () => {
    openSearch()
    expect(screen.getByRole('dialog', { name: 'Поиск по сайту' })).toBeInTheDocument()
  })

  it('открывается по ⌘K', () => {
    render(<SiteSearch />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('просит ввести хотя бы два символа', () => {
    openSearch()
    type('а')
    expect(screen.getByText('Введите хотя бы два символа')).toBeInTheDocument()
  })

  it('находит программу и ведёт на её страницу', () => {
    openSearch()
    type('начальная')
    const link = screen.getByRole('link', { name: /Начальная школа/ })
    expect(link).toHaveAttribute('href', '/learning/primary')
    expect(screen.getByText('Программы')).toBeInTheDocument()
  })

  it('находит клуб и новость', () => {
    openSearch()
    type('робот')
    expect(screen.getByRole('link', { name: /Робот-клуб/ })).toHaveAttribute('href', '/clubs/robotics')
    expect(screen.getByText(/Найдено:/)).toBeInTheDocument()
  })

  it('ищет без учёта регистра и буквы ё', () => {
    openSearch()
    type('РЕБЁНК')
    expect(screen.queryByText(/Ничего не нашлось/)).not.toBeInTheDocument()
  })

  it('показывает пустой результат по несуществующему запросу', () => {
    openSearch()
    type('квантовая телепортация')
    expect(screen.getByText(/Ничего не нашлось/)).toBeInTheDocument()
  })

  it('подсказки подставляют запрос', () => {
    openSearch()
    fireEvent.click(screen.getByRole('button', { name: 'Робот-клуб' }))
    expect(screen.getByLabelText('Поисковый запрос')).toHaveValue('Робот-клуб')
  })

  it('закрывается по Escape', () => {
    openSearch()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('соцсети', () => {
  it('ведут на внешние адреса', () => {
    expect(SOCIALS).toHaveLength(3)
    for (const s of SOCIALS) {
      expect(s.href).toMatch(/^https:\/\//)
      expect(s.label).toBeTruthy()
    }
  })
})
