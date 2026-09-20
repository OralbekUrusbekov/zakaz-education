import { describe, expect, it } from 'vitest'
import {
  addDays, attendanceLabel, fmtGrade, fmtMoney, fmtPct, gradeTone, homeworkLabel, initials,
  isSameDay, paymentLabel, plural, relativeDays, startOfWeek, toLocalISO,
} from '@/lib/format'

describe('числа и деньги', () => {
  it('форматирует тенге', () => {
    expect(fmtMoney(45000).replace(/ /g, ' ')).toBe('45 000 ₸')
  })
  it('форматирует проценты и пропуски', () => {
    expect(fmtPct(93.4)).toBe('93%')
    expect(fmtPct(null)).toBe('—')
  })
  it('форматирует оценку с одним знаком', () => {
    expect(fmtGrade(8.75)).toBe('8.8')
    expect(fmtGrade(null)).toBe('—')
  })
})

describe('десятибалльная шкала', () => {
  it('9–10 — отлично', () => {
    expect(gradeTone(10)).toBe('success')
    expect(gradeTone(9)).toBe('success')
  })
  it('7–8 — хорошо', () => {
    expect(gradeTone(8)).toBe('info')
    expect(gradeTone(7)).toBe('info')
  })
  it('5–6 — удовлетворительно, ниже — тревога', () => {
    expect(gradeTone(6)).toBe('warning')
    expect(gradeTone(4)).toBe('danger')
    expect(gradeTone(1)).toBe('danger')
  })
})

describe('склонения', () => {
  it.each([
    [1, 'задание'],
    [2, 'задания'],
    [5, 'заданий'],
    [11, 'заданий'],
    [21, 'задание'],
    [104, 'задания'],
  ])('%i → %s', (n, expected) => {
    expect(plural(n, 'задание', 'задания', 'заданий')).toBe(expected)
  })
})

describe('даты', () => {
  it('относительные подписи', () => {
    const today = new Date()
    expect(relativeDays(today)).toBe('Сегодня')
    expect(relativeDays(addDays(today, 1))).toBe('Завтра')
    expect(relativeDays(addDays(today, -1))).toBe('Вчера')
    expect(relativeDays(addDays(today, 3))).toBe('Через 3 дня')
    expect(relativeDays(addDays(today, -2))).toBe('2 дня назад')
  })
  it('начало недели — понедельник', () => {
    expect(startOfWeek(new Date(2026, 8, 18)).getDay()).toBe(1)
    expect(startOfWeek(new Date(2026, 8, 20)).getDate()).toBe(14) // воскресенье относится к прошлой неделе
  })
  it('локальная ISO-строка без часового пояса', () => {
    expect(toLocalISO(new Date(2026, 8, 18, 9, 5))).toBe('2026-09-18T09:05:00')
  })
  it('сравнение дней', () => {
    expect(isSameDay(new Date(2026, 0, 1, 8), new Date(2026, 0, 1, 23))).toBe(true)
    expect(isSameDay(new Date(2026, 0, 1), new Date(2026, 0, 2))).toBe(false)
  })
  it('инициалы', () => {
    expect(initials('Анна Ким')).toBe('АК')
    expect(initials('Айгерим')).toBe('А')
  })
})

describe('словари статусов', () => {
  it('в каждом статусе есть подпись и тон', () => {
    for (const map of [attendanceLabel, homeworkLabel, paymentLabel]) {
      for (const [label, tone] of Object.values(map)) {
        expect(label.length).toBeGreaterThan(2)
        expect(tone).toBeTruthy()
      }
    }
  })
})
