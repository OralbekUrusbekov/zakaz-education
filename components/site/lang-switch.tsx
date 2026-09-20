'use client'
import { LANGS, useLang, type Lang } from '@/lib/i18n'

const LABEL: Record<Lang, string> = { ru: 'Рус', kk: 'Қаз' }

/** Переключатель языка сайта. */
export function LangSwitch() {
  const { lang, setLang } = useLang()
  return (
    <div className="lang-switch" role="group" aria-label="Язык сайта">
      {LANGS.map((l) => (
        <button key={l} onClick={() => setLang(l)} className={l === lang ? 'is-active' : ''} aria-pressed={l === lang}>
          {LABEL[l]}
        </button>
      ))}
    </div>
  )
}
