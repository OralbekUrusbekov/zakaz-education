import { KK } from './kk'
import type { Lang } from './index'

/** Переводит строку на казахский по словарю; если перевода нет — возвращает оригинал. */
export function translate(text: string, lang: Lang): string {
  if (lang === 'ru') return text
  return KK[text] ?? text
}
