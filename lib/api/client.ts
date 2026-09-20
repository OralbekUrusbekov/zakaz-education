export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8020/api/v1'

const TOKEN_KEY = 'token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function errorMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg)
  if (status >= 500) return 'Сервер недоступен, попробуйте позже'
  return 'Не удалось выполнить запрос'
}

export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const isForm = init.body instanceof FormData
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    })
  } catch {
    throw new ApiError(0, 'Нет соединения с сервером')
  }
  if (res.status === 401 && path !== '/auth/login') {
    setToken(null)
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') window.location.href = '/login'
    throw new ApiError(401, 'Необходима авторизация')
  }
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, errorMessage(body, res.status))
  return body as T
}

export const fileUrl = (path: string | null) => (path ? `${API_URL}${path}` : null)

export const qs = (params: Record<string, string | number | null | undefined>) => {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== '') s.set(k, String(v))
  const str = s.toString()
  return str ? `?${str}` : ''
}
