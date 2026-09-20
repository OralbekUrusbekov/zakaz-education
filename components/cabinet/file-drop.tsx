'use client'
import { useRef, useState } from 'react'
import { FileText, UploadCloud, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_MB = 10

export function FileDrop({ file, onChange, onError }: { file: File | null; onChange: (f: File | null) => void; onError: (msg: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const pick = (f: File | undefined) => {
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) return onError(`Файл больше ${MAX_MB} МБ`)
    onChange(f)
  }

  if (file)
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
        <FileText size={20} className="text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-primary">{file.name}</p>
          <p className="text-xs text-muted">{(file.size / 1024).toFixed(0)} КБ</p>
        </div>
        <button onClick={() => onChange(null)} className="rounded-full p-1 text-muted hover:bg-white" aria-label="Убрать файл"><X size={16} /></button>
      </div>
    )

  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]) }}
      className={cn('flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed p-6 text-center transition', over ? 'border-gold bg-gold-light/50' : 'border-line hover:border-primary/40 hover:bg-surface')}
    >
      <UploadCloud size={26} className="text-gold-dark" />
      <span className="text-sm font-medium text-primary">Перетащите файл или нажмите, чтобы выбрать</span>
      <span className="text-xs text-muted">PDF, DOCX, изображения, архивы — до {MAX_MB} МБ</span>
      <input ref={input} type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </button>
  )
}
