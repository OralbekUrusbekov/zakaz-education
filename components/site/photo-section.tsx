'use client'
import type { ReactNode } from 'react'
import { useTr } from '@/lib/i18n/use-tr'

/** Секция целиком на фотографии: заголовок и содержимое на затемнённом фоне. */
export function PhotoSection({
  image, eyebrow, title, text, action, children,
}: { image: string; eyebrow?: string; title: string; text?: string; action?: ReactNode; children: ReactNode }) {
  const { tr } = useTr()
  return (
    <section className="photo-section">
      <img src={image} alt="" />
      <div className="photo-section-inner container-wide">
        <header>
          <div>
            {eyebrow && <p className="eyebrow">{tr(eyebrow)}</p>}
            <h2>{tr(title)}</h2>
            {text && <p className="photo-section-text">{tr(text)}</p>}
          </div>
          {action}
        </header>
        {children}
      </div>
    </section>
  )
}
