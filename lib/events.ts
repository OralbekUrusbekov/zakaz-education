/** События и семинары. Даты считаются от сегодняшнего дня, чтобы календарь всегда был живым. */

export type SiteEvent = {
  slug: string
  title: string
  desc: string
  location: string
  time: string
  type: 'Для семей' | 'Учебное' | 'Творчество' | 'Спорт' | 'Семинар'
  color: string
  date: string // ISO yyyy-mm-dd
  image?: string
}

const iso = (offsetDays: number) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const EVENT_COLORS: Record<SiteEvent['type'], string> = {
  'Для семей': '#d4ad4f',
  'Учебное': '#4f6bd8',
  'Творчество': '#8b5cf6',
  'Спорт': '#1f8a5b',
  'Семинар': '#c2410c',
}

const event = (o: Omit<SiteEvent, 'color' | 'date'> & { in: number }): SiteEvent => ({
  ...o,
  date: iso(o.in),
  color: EVENT_COLORS[o.type],
})

export const EVENTS: SiteEvent[] = [
  event({ in: 4, slug: 'open-day', title: 'День открытых дверей', time: '10:00 – 14:00', location: 'Главное здание школы', type: 'Для семей', image: '/photos/campus-wide.jpg', desc: 'Экскурсия по кампусу, встреча с преподавателями и ответы на вопросы о поступлении.' }),
  event({ in: 9, slug: 'science-fair', title: 'Научная ярмарка Tech School', time: '14:00 – 18:00', location: 'Спортзал и холлы', type: 'Учебное', image: '/photos/class-wide.jpg', desc: 'Ученики представляют свои научные проекты: выставка, демонстрации и конкурсы.' }),
  event({ in: 12, slug: 'music-concert', title: 'Концерт музыкальной студии', time: '16:00 – 20:00', location: 'Актовый зал', type: 'Творчество', desc: 'Выступления учащихся: классическая музыка, джаз и современные композиции.' }),
  event({ in: 17, slug: 'sport-day', title: 'Спортивный день Tech School', time: '09:00 – 13:00', location: 'Спортивный комплекс', type: 'Спорт', desc: 'Волейбол, баскетбол, эстафеты и командные соревнования для всех возрастов.' }),
  event({ in: 21, slug: 'robotics-cup', title: 'Школьный робо-турнир', time: '11:00 – 16:00', location: 'Лаборатория будущего', type: 'Учебное', desc: 'Команды 5–11 классов соревнуются в скорости и точности своих роботов.' }),
  event({ in: 26, slug: 'charity-fest', title: 'Благотворительный фестиваль', time: '14:00 – 19:00', location: 'Школьный двор', type: 'Для семей', desc: 'Ярмарка, концерт и фудкорт. Сбор средств для помощи нуждающимся семьям.' }),
  event({ in: 33, slug: 'theatre-premiere', title: 'Премьера театральной студии', time: '18:00 – 20:00', location: 'Актовый зал', type: 'Творчество', desc: 'Осенняя постановка: работа учеников от сценария до декораций.' }),
  event({ in: 40, slug: 'debate-cup', title: 'Городской турнир по дебатам', time: '10:00 – 17:00', location: 'Конференц-зал', type: 'Учебное', desc: 'Команда Tech School принимает восемь школ города на ежегодном турнире.' }),
  event({ in: 47, slug: 'family-picnic', title: 'Семейный пикник Tech School', time: '12:00 – 16:00', location: 'Парк за школой', type: 'Для семей', desc: 'Игры, спортивные эстафеты и совместный обед учеников, родителей и педагогов.' }),
]

export const SEMINARS: SiteEvent[] = [
  event({ in: 5, slug: 'ent-strategy', title: 'Подготовка к ЕНТ: стратегия и поддержка', time: '15:00 – 17:00', location: 'Конференц-зал', type: 'Семинар', desc: 'Как выстроить подготовку за год, распределить силы и поддержать ребёнка без давления.' }),
  event({ in: 11, slug: 'motivation', title: 'Как помочь ребёнку с мотивацией', time: '18:00 – 19:30', location: 'Онлайн (Zoom)', type: 'Семинар', desc: 'Разбираем, откуда берётся «не хочу учиться» и что работает вместо контроля.' }),
  event({ in: 18, slug: 'digital-safety', title: 'Цифровая безопасность для подростков', time: '18:00 – 19:30', location: 'Конференц-зал', type: 'Семинар', desc: 'Экранное время, соцсети и травля в сети: практические договорённости для семьи.' }),
  event({ in: 25, slug: 'career-talk', title: 'Выбор карьеры: диалог с ребёнком', time: '15:00 – 17:00', location: 'Конференц-зал', type: 'Семинар', desc: 'Как говорить о будущем так, чтобы это был разговор, а не инструкция.' }),
  event({ in: 32, slug: 'teen-psychology', title: 'Подростковый возраст без конфликтов', time: '18:00 – 19:30', location: 'Онлайн (Zoom)', type: 'Семинар', desc: 'Школьный психолог о границах, самостоятельности и доверии в семье.' }),
  event({ in: 39, slug: 'university-abroad', title: 'Поступление за рубеж: с чего начать', time: '17:00 – 19:00', location: 'Конференц-зал', type: 'Семинар', desc: 'Сроки, экзамены, документы и бюджет — понятный план для родителей 9–11 классов.' }),
]

export const upcoming = (list: SiteEvent[]) => {
  const today = iso(0)
  return [...list].filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
}

export const formatEventDate = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', '')

export const formatEventDay = (d: string) => new Date(d).getDate()
export const formatEventMonth = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')
