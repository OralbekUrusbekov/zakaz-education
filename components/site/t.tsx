'use client'
import { useTr } from '@/lib/i18n/use-tr'

/** Переводит текст на выбранный язык. Работает и внутри серверных страниц. */
export function T({ children }: { children: string }) {
  const { tr } = useTr()
  return <>{tr(children)}</>
}
