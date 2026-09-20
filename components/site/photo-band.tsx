'use client'
import type { ReactNode } from 'react'
import { useTr } from '@/lib/i18n/use-tr'

/**
 * Широкая фотополоса с затемнением и короткой фразой — разбивает длинные текстовые страницы.
 * tone: 'ink' — тёмная подложка, 'gold' — тёплая.
 */
export function PhotoBand({
  image, eyebrow, title, text, tone = 'ink', align = 'left', height = 'md', children,
}: {
  image: string
  eyebrow?: string
  title: string
  text?: string
  tone?: 'ink' | 'gold'
  align?: 'left' | 'center'
  height?: 'sm' | 'md' | 'lg'
  children?: ReactNode
}) {
  const { tr } = useTr()
  return (
    <section className={`photo-band tone-${tone} align-${align} h-${height}`}>
      <img src={image} alt="" />
      <div className="photo-band-body container-wide">
        {eyebrow && <p className="eyebrow">{tr(eyebrow)}</p>}
        <h2>{tr(title)}</h2>
        {text && <p>{tr(text)}</p>}
        {children}
      </div>
    </section>
  )
}
