import { beforeEach, describe, expect, it, vi } from 'vitest'
import { studentApi } from '@/lib/api/student'
import { teacherApi } from '@/lib/api/teacher'
import { adminApi } from '@/lib/api/admin'
import { login } from '@/lib/api/auth'
import { getToken, setToken } from '@/lib/api/client'

const ok = (body: unknown = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  setToken(null)
  fetchMock = vi.fn().mockResolvedValue(ok())
  vi.stubGlobal('fetch', fetchMock)
})

const lastCall = () => fetchMock.mock.calls[0] as [string, RequestInit]

describe('студенческое API', () => {
  it('расписание передаёт диапазон', async () => {
    await studentApi.schedule('2026-09-14T00:00:00', '2026-09-21T00:00:00')
    expect(lastCall()[0]).toContain('/students/me/schedule?start=2026-09-14T00%3A00%3A00&end=2026-09-21T00%3A00%3A00')
  })

  it('сдача ДЗ уходит как multipart', async () => {
    const file = new File(['x'], 'answer.pdf', { type: 'application/pdf' })
    await studentApi.submitHomework(12, 'Готово', file)
    const [url, init] = lastCall()
    expect(url).toContain('/students/me/homework/12/submit')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
    expect((init.body as FormData).get('text')).toBe('Готово')
    expect((init.body as FormData).get('file')).toBeInstanceOf(File)
  })

  it('оплата — POST без тела', async () => {
    await studentApi.pay(5)
    expect(lastCall()[0]).toContain('/students/me/payments/5/pay')
    expect(lastCall()[1].method).toBe('POST')
  })
})

describe('преподавательское API', () => {
  it('выставление оценки', async () => {
    await teacherApi.createGrade({ student_id: 1, group_id: 2, lesson_id: 3, value: 9, type: 'classwork' })
    const [url, init] = lastCall()
    expect(url).toContain('/grades')
    expect(JSON.parse(String(init.body))).toMatchObject({ value: 9, group_id: 2 })
  })

  it('проверка работы', async () => {
    await teacherApi.review(4, { status: 'reviewed', grade: 10, teacher_comment: 'Отлично' })
    const [url, init] = lastCall()
    expect(url).toContain('/submissions/4')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(String(init.body)).grade).toBe(10)
  })

  it('посещаемость отправляет список отметок', async () => {
    await teacherApi.saveAttendance(9, [{ student_id: 1, status: 'late' }])
    expect(JSON.parse(String(lastCall()[1].body))).toEqual({ lesson_id: 9, records: [{ student_id: 1, status: 'late' }] })
  })

  it('фильтр по группе необязателен', async () => {
    await teacherApi.students(null)
    expect(lastCall()[0]).toMatch(/\/teachers\/me\/students$/)
  })
})

describe('API руководства', () => {
  it('дашборд с периодом и курсом', async () => {
    await adminApi.dashboard('quarter', 3)
    expect(lastCall()[0]).toContain('/analytics/dashboard?period=quarter&course_id=3')
  })
})

describe('вход', () => {
  it('сохраняет токен и возвращает пользователя', async () => {
    fetchMock.mockResolvedValue(ok({ access_token: 'jwt', token_type: 'bearer', user: { id: 1, role: 'student' } }))
    const user = await login('student@techschool.kz', 'password123')
    expect(user).toMatchObject({ role: 'student' })
    expect(getToken()).toBe('jwt')
  })
})
