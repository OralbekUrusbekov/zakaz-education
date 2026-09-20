'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LogIn } from 'lucide-react'
import { Button, Field, Input } from '@/components/cabinet/ui'
import { homeForRole, useAuth } from '@/lib/auth-context'
import type { Role } from '@/lib/types'
import { useTr } from '@/lib/i18n/use-tr'

const DEMO: { role: Role; label: string; email: string; hint: string }[] = [
  { role: 'student', label: 'Студент', email: 'student@techschool.kz', hint: 'Анна Ким' },
  { role: 'teacher', label: 'Преподаватель', email: 'teacher@techschool.kz', hint: 'Айгерим Нурланова' },
  { role: 'admin', label: 'Руководство', email: 'admin@techschool.kz', hint: 'Ерлан Сейтказиев' },
]
const DEMO_PASSWORD = 'password123'

export default function LoginPage() {
  const { tr } = useTr()
  const router = useRouter()
  const { user, loading, login } = useAuth()
  const [role, setRole] = useState<Role>('student')
  const [email, setEmail] = useState(DEMO[0].email)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace(homeForRole(user.role))
  }, [loading, user, router])

  const pickRole = (r: Role) => {
    setRole(r)
    setEmail(DEMO.find((d) => d.role === r)!.email)
    setPassword(DEMO_PASSWORD)
    setError(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const u = await login(email.trim(), password)
      router.replace(homeForRole(u.role))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-7 flex items-center justify-center gap-3">
          <span className="flex h-12 w-11 items-center justify-center rounded-[48%_48%_44%_44%] border-2 border-primary font-serif text-xl font-bold text-primary">T</span>
          <span>
            <span className="block font-serif text-2xl text-primary">Tech School</span>
            <span className="text-[11px] tracking-[0.12em] text-muted uppercase">{tr('Образовательный центр')}</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_8px_30px_rgba(16,24,40,.06)] md:p-8">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-primary"><ArrowLeft size={15} />{tr('На главную')}</Link>
          <h1 className="mt-5 font-serif text-3xl text-primary">{tr('Вход в кабинет')}</h1>
          <p className="mt-2 text-sm text-muted">{tr('Выберите роль для демо-доступа или введите свои данные')}</p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {DEMO.map((d) => (
              <button
                key={d.role}
                type="button"
                onClick={() => pickRole(d.role)}
                className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition ${
                  role === d.role ? 'border-primary bg-primary-light text-primary' : 'border-line text-muted hover:border-primary/40'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </Field>
            <Field label="Пароль">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </Field>
            {error && <p className="rounded-xl bg-danger-light px-3.5 py-2.5 text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              <LogIn size={17} /> {busy ? 'Входим…' : 'Войти'}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted">
            Демо-доступ: {DEMO.find((d) => d.role === role)!.hint} · пароль <code className="rounded bg-surface px-1.5 py-0.5">{DEMO_PASSWORD}</code>
          </p>
        </div>
      </div>
    </main>
  )
}
