'use client'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export const LANGS = ['ru', 'kk'] as const
export type Lang = (typeof LANGS)[number]

/** Строка на двух языках: так хранится весь контент сайта. */
export type L = { ru: string; kk: string }
export type LList = { ru: string[]; kk: string[] }

const STORAGE_KEY = 'lang'
const DEFAULT: Lang = 'ru'

type Ctx = { lang: Lang; setLang: (l: Lang) => void }
const LangContext = createContext<Ctx>({ lang: DEFAULT, setLang: () => {} })

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
      if (saved && LANGS.includes(saved)) setLangState(saved)
    } catch {}
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {}
  }, [])

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)

/** Достаёт нужный язык из двуязычного значения. */
export function useLocale() {
  const { lang } = useLang()
  const pick = useCallback(<T extends { ru: unknown; kk: unknown }>(value: T): T['ru'] => value[lang] as T['ru'], [lang])
  return { lang, pick }
}
