import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiClient, fileUrl, getToken, qs, setToken } from '@/lib/api/client'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('qs', () => {
  it('склеивает только заполненные параметры', () => {
    expect(qs({ group_id: 3, status: null, q: '', page: 2 })).toBe('?group_id=3&page=2')
    expect(qs({})).toBe('')
  })
})

describe('токен', () => {
  it('сохраняется и удаляется', () => {
    setToken('abc')
    expect(getToken()).toBe('abc')
    setToken(null)
    expect(getToken()).toBeNull()
  })
})

describe('fileUrl', () => {
  it('добавляет базовый адрес API', () => {
    expect(fileUrl('/uploads/a.pdf')).toContain('/uploads/a.pdf')
    expect(fileUrl(null)).toBeNull()
  })
})

describe('apiClient', () => {
  beforeEach(() => setToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it('подставляет заголовок авторизации', async () => {
    setToken('token-123')
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await apiClient('/students/me/overview')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/students/me/overview')
    expect(init.headers.Authorization).toBe('Bearer token-123')
    expect(init.headers['Content-Type']).toBe('application/json')
  })

  it('не ставит Content-Type для FormData', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}))
    vi.stubGlobal('fetch', fetchMock)
    const form = new FormData()
    form.append('text', 'ответ')

    await apiClient('/students/me/homework/1/submit', { method: 'POST', body: form })

    expect(fetchMock.mock.calls[0][1].headers['Content-Type']).toBeUndefined()
  })

  it('возвращает распарсенный ответ', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ id: 7 })))
    await expect(apiClient<{ id: number }>('/x')).resolves.toEqual({ id: 7 })
  })

  it('пробрасывает текст ошибки от бэкенда', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'Работа уже проверена' }, 400)))
    await expect(apiClient('/x')).rejects.toThrowError('Работа уже проверена')
  })

  it('разбирает ошибку валидации FastAPI', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: [{ msg: 'Поле обязательно' }] }, 422)))
    await expect(apiClient('/x')).rejects.toThrowError('Поле обязательно')
  })

  it('сообщает о недоступном сервере', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')))
    await expect(apiClient('/x')).rejects.toThrowError('Нет соединения с сервером')
  })

  it('на 401 очищает токен', async () => {
    // подменяем location, чтобы jsdom не ругался на переход
    vi.stubGlobal('location', { ...window.location, pathname: '/student', href: '' })
    setToken('stale')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'Необходима авторизация' }, 401)))
    await expect(apiClient('/students/me/overview')).rejects.toBeInstanceOf(ApiError)
    expect(getToken()).toBeNull()
  })

  it('204 возвращает пустой результат', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    await expect(apiClient('/grades/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })
})
