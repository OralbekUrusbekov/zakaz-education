'use client'
import { useState, type ReactNode } from 'react'
import { RegisterModal, type RegisterSubject } from './register-modal'
import { useTr } from '@/lib/i18n/use-tr'

/** Кнопка, которая открывает форму заявки прямо на странице. */
export function RegisterButton({
  subject, children, className = 'dark-button', style,
}: { subject: RegisterSubject; children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const { tr } = useTr()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={className} style={style} onClick={() => setOpen(true)}>
        {typeof children === 'string' ? tr(children) : children}
      </button>
      {open && <RegisterModal event={subject} onClose={() => setOpen(false)} />}
    </>
  )
}
