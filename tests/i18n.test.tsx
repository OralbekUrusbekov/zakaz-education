import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LANGS, LanguageProvider, useLocale } from '@/lib/i18n'
import { UI } from '@/lib/i18n/dict'
import { KK } from '@/lib/i18n/kk'
import { translate } from '@/lib/i18n/tr'
import { T } from '@/components/site/t'
import { LangSwitch } from '@/components/site/lang-switch'

const KAZAKH_ONLY = /[әғқңөұүһі]/i

const leaves = (node: unknown, path = 'UI'): [string, { ru: string; kk: string }][] => {
  if (node && typeof node === 'object' && 'ru' in node && 'kk' in node) return [[path, node as { ru: string; kk: string }]]
  if (node && typeof node === 'object') return Object.entries(node).flatMap(([k, v]) => leaves(v, `${path}.${k}`))
  return []
}

describe('словарь интерфейса', () => {
  it('у каждой строки есть оба языка и они непустые', () => {
    const all = leaves(UI)
    expect(all.length).toBeGreaterThan(30)
    for (const [path, value] of all) {
      expect(typeof value.ru, path).toBe('string')
      expect(typeof value.kk, path).toBe('string')
      expect(value.ru.trim(), path).not.toBe('')
      expect(value.kk.trim(), path).not.toBe('')
    }
  })
  it('казахский перевод отличается от русского, кроме заимствований', () => {
    const same = leaves(UI).filter(([, v]) => v.ru === v.kk)
    expect(same.map(([p]) => p)).toEqual(['UI.footerNav', 'UI.formPhone', 'UI.formEmail'])
  })
})

describe('словарь контента', () => {
  it('переводов достаточно для всего публичного сайта', () => {
    expect(Object.keys(KK).length).toBeGreaterThan(600)
  })
  it('ни один перевод не пустой и не совпадает с оригиналом', () => {
    for (const [ru, kk] of Object.entries(KK)) {
      expect(kk.trim(), ru).not.toBe('')
      expect(kk, ru).not.toBe(ru)
    }
  })
  it('большинство переводов содержит казахские буквы', () => {
    const withKazakh = Object.values(KK).filter((v) => KAZAKH_ONLY.test(v)).length
    expect(withKazakh / Object.keys(KK).length).toBeGreaterThan(0.7)
  })
  it('переводит по словарю и откатывается к оригиналу', () => {
    expect(translate('Поддержка', 'ru')).toBe('Поддержка')
    expect(translate('Поддержка', 'kk')).toBe('Қолдау')
    expect(translate('Строки нет в словаре', 'kk')).toBe('Строки нет в словаре')
  })
})

const Demo = () => {
  const { pick } = useLocale()
  return (
    <>
      <LangSwitch />
      <p>{pick(UI.nav.news)}</p>
      <span><T>Поддержка</T></span>
    </>
  )
}

describe('переключатель языка', () => {
  it('меняет и словарные, и контентные строки', () => {
    render(
      <LanguageProvider>
        <Demo />
      </LanguageProvider>,
    )
    expect(screen.getByText('Новости')).toBeTruthy()
    expect(screen.getByText('Поддержка')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Қаз' }))
    expect(screen.getByText(UI.nav.news.kk)).toBeTruthy()
    expect(screen.getByText('Қолдау')).toBeTruthy()
    expect(screen.queryByText('Новости')).toBeNull()
    expect(screen.queryByText('Поддержка')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Рус' }))
    expect(screen.getByText('Новости')).toBeTruthy()
    expect(screen.getByText('Поддержка')).toBeTruthy()
  })

  it('запоминает выбор языка', () => {
    render(
      <LanguageProvider>
        <LangSwitch />
      </LanguageProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Қаз' }))
    expect(localStorage.getItem('lang')).toBe('kk')
  })

  it('отмечает активный язык для скринридера', () => {
    render(
      <LanguageProvider>
        <LangSwitch />
      </LanguageProvider>,
    )
    expect(screen.getByRole('button', { name: 'Рус' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Қаз' }))
    expect(screen.getByRole('button', { name: 'Қаз' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Рус' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('поддерживает ровно два языка', () => expect([...LANGS]).toEqual(['ru', 'kk']))
})
