'use client'
import { useCallback } from 'react'
import { useLang } from './index'
import { translate } from './tr'

/** Хук перевода: tr('Текст') отдаёт строку на выбранном языке. */
export function useTr() {
  const { lang } = useLang()
  const tr = useCallback((text: string) => translate(text, lang), [lang])
  return { tr, lang }
}
