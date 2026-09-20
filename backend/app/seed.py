"""Демо-данные. Все даты строятся относительно сегодняшнего дня, чтобы кабинеты всегда выглядели «живыми».

Запуск вручную (пересоздаёт базу):  python -m app.seed --reset
"""
import random
import sys
from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import Attendance, Comment, Course, Enrollment, Grade, Group, Homework, Lesson, Payment, Submission, User
from app.services import MONTHS_FULL

DEMO_PASSWORD = "password123"

COURSES = [
    ("Веб-разработка: HTML, CSS, JS", "Frontend", 20, 38000, "#18182d", [
        "Структура HTML-документа", "Семантическая вёрстка", "CSS: селекторы и каскад", "Flexbox",
        "CSS Grid", "Адаптивная вёрстка", "JavaScript: переменные и типы", "DOM и события",
        "Асинхронность и fetch", "Формы и валидация", "Сборка проекта", "Вёрстка лендинга",
    ]),
    ("Программирование на Python", "Backend", 24, 45000, "#4f6bd8", [
        "Переменные и типы данных", "Условия и циклы", "Функции", "Списки и словари", "Работа с файлами",
        "ООП: классы", "ООП: наследование", "Исключения", "Модули и пакеты", "Основы SQL",
        "REST API и requests", "Итоговый проект",
    ]),
    ("Базы данных и SQL", "Данные", 20, 32000, "#22a06b", [
        "Реляционная модель", "SELECT и фильтрация", "Сортировка и агрегаты", "GROUP BY и HAVING",
        "JOIN: связи таблиц", "Подзапросы", "Индексы и планы запросов", "Нормализация",
        "Транзакции", "Представления и процедуры", "Проектирование схемы", "Практикум: витрина данных",
    ]),
    ("UI/UX-дизайн в Figma", "Дизайн", 16, 40000, "#d4ad4f", [
        "Основы композиции", "Цвет и контраст в интерфейсе", "Типографика интерфейса", "Figma: интерфейс",
        "Сетки и автолейаут", "Компоненты и варианты", "Иконки и состояния", "Прототипирование",
        "UI: карточки и формы", "Портфолио дизайнера",
    ]),
    ("Мобильная разработка на Flutter", "Mobile", 16, 42000, "#c2410c", [
        "Dart: основы языка", "Виджеты и дерево UI", "Вёрстка экранов", "Навигация между экранами",
        "Состояние приложения", "Работа с HTTP API", "Локальное хранилище", "Анимации",
        "Сборка и публикация", "Итоговое приложение",
    ]),
    ("Кибербезопасность и сети", "Безопасность", 16, 30000, "#8b5cf6", [
        "Модель OSI и TCP/IP", "IP-адресация и маршрутизация", "HTTP и HTTPS", "Шифрование и хеширование",
        "Аутентификация и пароли", "Уязвимости веб-приложений", "Фишинг и социальная инженерия",
        "Безопасность сетей Wi-Fi", "Резервное копирование", "Итоговый аудит",
    ]),
]

TEACHERS = [
    ("teacher@techschool.kz", "Айгерим", "Нурланова"),
    ("d.akhmetov@techschool.kz", "Даурен", "Ахметов"),
    ("m.li@techschool.kz", "Мария", "Ли"),
    ("a.zhumabaeva@techschool.kz", "Асель", "Жумабаева"),
]

# (название, индекс курса, индекс преподавателя, дни недели, время, аудитория/None=онлайн, начало (дни от сегодня), конец)
GROUPS = [
    ("WEB-A1", 0, 0, (0, 2), time(18, 0), "Комп. класс 204", -98, 42),
    ("WEB-B2", 0, 0, (1, 3), time(17, 0), "Комп. класс 204", -84, 56),
    ("SEC-1", 5, 0, (5,), time(11, 0), "Комп. класс 105", -70, 42),
    ("PY-1", 1, 1, (1, 3), time(19, 30), None, -91, 77),
    ("PY-2", 1, 1, (0, 2), time(16, 0), "Лаб. 1", -56, 112),
    ("SQL-10", 2, 2, (0, 4), time(15, 0), "Комп. класс 301", -105, 35),
    ("MOB-1", 4, 2, (2, 4), time(17, 0), "Комп. класс 302", -63, 49),
    ("UX-1", 3, 3, (1, 4), time(18, 30), "Дизайн-студия", -77, 35),
    # завершённые группы
    ("WEB-S", 0, 0, (0, 2), time(18, 0), "Комп. класс 204", -330, -190),
    ("PY-0", 1, 1, (1, 3), time(19, 0), None, -300, -135),
    ("SQL-9", 2, 2, (0, 4), time(15, 0), "Комп. класс 301", -270, -150),
    ("UX-0", 3, 3, (1, 4), time(18, 30), "Дизайн-студия", -210, -100),
    ("MOB-0", 4, 2, (2, 4), time(17, 0), "Комп. класс 302", -170, -50),
    ("WEB-X", 0, 0, (1, 3), time(10, 0), "Комп. класс 201", -150, -20),
]

MALE = ["Арман", "Нурлан", "Тимур", "Алихан", "Данияр", "Ерасыл", "Максим", "Санжар", "Бекзат", "Руслан", "Азамат", "Дмитрий", "Ильяс", "Темирлан"]
FEMALE = ["Аружан", "Дана", "Алина", "Камила", "Жанель", "Мадина", "Айым", "Софья", "Томирис", "Сабина", "Амина", "Виктория", "Айдана", "Лейла"]
SURNAMES = [("Серикбаев", "Серикбаева"), ("Касымов", "Касымова"), ("Омаров", "Омарова"), ("Иванов", "Иванова"),
            ("Жаксылыков", "Жаксылыкова"), ("Тулегенов", "Тулегенова"), ("Садыков", "Садыкова"), ("Петров", "Петрова"),
            ("Байжанов", "Байжанова"), ("Абдрахманов", "Абдрахманова"), ("Ким", "Ким"), ("Пак", "Пак"),
            ("Есенов", "Есенова"), ("Муратов", "Муратова"), ("Кенжебаев", "Кенжебаева"), ("Смагулов", "Смагулова")]

TEACHER_COMMENTS = {
    "praise": ["Отличная работа на занятии, так держать!", "Заметен большой прогресс за последний месяц.",
               "Очень аккуратно выполненное задание.", "Хорошо помогаешь одногруппникам, спасибо!"],
    "remark": ["Пропущено несколько занятий подряд, нужно наверстать материал.",
               "Домашние задания сдаются с опозданием.", "Будь внимательнее к деталям в заданиях."],
    "recommendation": ["Рекомендую повторить материал последних двух тем.",
                       "Попробуй решать по две задачи в день на тренажёре.",
                       "Советую больше практиковаться: пиши код каждый день хотя бы по 30 минут.", "Посмотри дополнительные материалы в чате группы."],
}
REVIEW_COMMENTS = ["Хорошо, без замечаний.", "Есть пара неточностей, в целом верно.", "Отлично!",
                   "Разберём ошибки на занятии.", "Нужно доработать вторую часть."]


def _grade_value(rng: random.Random, diligence: float) -> int:
    """Оценка по десятибалльной шкале: чем выше прилежание, тем выше балл."""
    return max(1, min(10, round(3.6 + diligence * 5.6 + rng.uniform(-1.4, 1.4))))


def seed(db: Session) -> None:
    rng = random.Random(42)
    today = date.today()
    now = datetime.now()
    pw = hash_password(DEMO_PASSWORD)

    admin = User(email="admin@techschool.kz", password_hash=pw, first_name="Ерлан", last_name="Сейтказиев",
                 role="admin", phone="+7 701 000 00 01", last_active_at=now)
    teachers = [User(email=e, password_hash=pw, first_name=f, last_name=l, role="teacher",
                     phone=f"+7 702 000 00 1{i}", last_active_at=now) for i, (e, f, l) in enumerate(TEACHERS)]
    db.add_all([admin, *teachers])

    courses = []
    for name, cat, weeks, price, color, _ in COURSES:
        courses.append(Course(name=name, category=cat, duration_weeks=weeks, price=price, color=color,
                              description=f"Курс «{name}» для групп до 14 человек."))
    db.add_all(courses)
    db.flush()

    # --- студенты ---
    anna = User(email="student@techschool.kz", password_hash=pw, first_name="Анна", last_name="Ким",
                role="student", phone="+7 705 123 45 67")
    students = [anna]
    diligence = {0: 0.93}
    used = set()
    while len(students) < 96:
        male = rng.random() < 0.5
        first = rng.choice(MALE if male else FEMALE)
        last = rng.choice(SURNAMES)[0 if male else 1]
        if (first, last) in used:
            continue
        used.add((first, last))
        students.append(User(email=f"student{len(students)}@techschool.kz", password_hash=pw, first_name=first,
                             last_name=last, role="student", phone=f"+7 7{rng.randint(0, 9)}{rng.randint(0, 9)} {rng.randint(100, 999)} {rng.randint(10, 99)} {rng.randint(10, 99)}"))
        diligence[len(students) - 1] = rng.uniform(0.5, 0.99)
    db.add_all(students)
    db.flush()
    dil = {students[i].id: d for i, d in diligence.items()}

    # --- группы и занятия ---
    groups: list[Group] = []
    lessons_by_group: dict[int, list[Lesson]] = {}
    for name, ci, ti, weekdays, start_time, room, start_off, end_off in GROUPS:
        g = Group(name=name, course_id=courses[ci].id, teacher_id=teachers[ti].id,
                  start_date=today + timedelta(days=start_off), end_date=today + timedelta(days=end_off))
        db.add(g)
        db.flush()
        topics = COURSES[ci][5]
        lessons, day, n = [], g.start_date, 0
        while day <= g.end_date:
            if day.weekday() in weekdays:
                starts = datetime.combine(day, start_time)
                topic = topics[min(n * len(topics) // max(1, _count_lessons(g, weekdays)), len(topics) - 1)]
                lessons.append(Lesson(group_id=g.id, topic=topic, starts_at=starts, ends_at=starts + timedelta(minutes=90),
                                      room=room, is_online=room is None))
                n += 1
            day += timedelta(days=1)
        db.add_all(lessons)
        groups.append(g)
        lessons_by_group[g.id] = lessons
    db.flush()

    # --- зачисления ---
    active_groups = [g for g in groups if g.end_date >= today]
    done_groups = [g for g in groups if g.end_date < today]
    by_name = {g.name: g for g in groups}
    enrollments: list[Enrollment] = []

    def enroll(student: User, g: Group, status: str) -> None:
        enrolled_at = g.start_date + timedelta(days=rng.choice([0, 0, 0, 3, 7, 14]))
        e = Enrollment(student_id=student.id, group_id=g.id, status=status, enrolled_at=enrolled_at,
                       completed_at=g.end_date if status == "completed" else None)
        enrollments.append(e)

    for gname in ("WEB-A1", "PY-1", "SQL-10"):
        enroll(anna, by_name[gname], "active")
    enroll(anna, by_name["UX-0"], "completed")

    others = students[1:]
    for g in done_groups:
        for s in rng.sample(others, rng.randint(11, 14)):
            enroll(s, g, "dropped" if rng.random() < 0.12 else "completed")
    pool = others[:78]
    rng.shuffle(pool)
    slots = {g.id: 1 if g.name in ("WEB-A1", "PY-1", "SQL-10") else 0 for g in active_groups}
    for i, s in enumerate(pool):
        picks = rng.sample(active_groups, 2 if i % 3 == 0 else 1)
        for g in picks:
            if slots[g.id] < 14:
                slots[g.id] += 1
                enroll(s, g, "dropped" if rng.random() < 0.05 else "active")
    db.add_all(enrollments)
    db.flush()

    # --- посещаемость и оценки ---
    for e in enrollments:
        d = dil[e.student_id]
        past = [lsn for lsn in lessons_by_group[e.group_id] if lsn.starts_at < now and lsn.starts_at.date() >= e.enrolled_at]
        if e.status == "dropped":
            past = past[: max(1, len(past) // 3)]
        for idx, lsn in enumerate(past):
            r = rng.random()
            if r < d:
                status = "present"
            else:
                status = rng.choices(["late", "absent", "excused"], [0.4, 0.45, 0.15])[0]
            db.add(Attendance(lesson_id=lsn.id, student_id=e.student_id, status=status))
            if status in ("present", "late"):
                is_test = idx % 8 == 7
                if is_test or rng.random() < 0.3:
                    db.add(Grade(student_id=e.student_id, group_id=e.group_id, lesson_id=lsn.id,
                                 value=_grade_value(rng, d), type="test" if is_test else "classwork",
                                 date=lsn.starts_at.date(),
                                 comment="Контрольная работа" if is_test else None))
    db.flush()

    # --- домашние задания ---
    members: dict[int, list[Enrollment]] = {}
    for e in enrollments:
        members.setdefault(e.group_id, []).append(e)
    for g in groups:
        past_lessons = [lsn for lsn in lessons_by_group[g.id] if lsn.starts_at < now]
        last_past = past_lessons[-1] if past_lessons and g.end_date >= today else None
        for idx, lsn in enumerate(past_lessons):
            if idx % 3 != 1 and lsn is not last_past:
                continue
            days_to_due = 8 if lsn is last_past else rng.randint(4, 6)
            due = datetime.combine(lsn.starts_at.date() + timedelta(days=days_to_due), time(23, 59))
            hw = Homework(group_id=g.id, title=f"ДЗ: {lsn.topic}", created_at=lsn.ends_at, due_date=due,
                          description=f"Выполните упражнения по теме «{lsn.topic}» из методички и прикрепите файл или ответ.")
            db.add(hw)
            db.flush()
            for e in members.get(g.id, []):
                if e.status == "dropped" or e.enrolled_at > lsn.starts_at.date():
                    continue
                d = dil[e.student_id]
                if due < now:
                    if rng.random() > d * 0.97:
                        continue
                    submitted_at = due - timedelta(hours=rng.randint(2, 70))
                    pending = (now - due).days < 6 and rng.random() < 0.6
                    status = "submitted" if pending else ("revision" if rng.random() < 0.05 else "reviewed")
                else:
                    if rng.random() > 0.3 or e.student_id == anna.id:
                        continue
                    submitted_at, status = now - timedelta(hours=rng.randint(1, 30)), "submitted"
                value = _grade_value(rng, d) if status == "reviewed" else None
                sub = Submission(homework_id=hw.id, student_id=e.student_id, status=status, submitted_at=submitted_at,
                                 text="Задание выполнено, решение во вложении.", file_name=f"{g.name.lower()}_{hw.id}.pdf",
                                 grade=value, teacher_comment=rng.choice(REVIEW_COMMENTS) if status != "submitted" else None,
                                 reviewed_at=submitted_at + timedelta(days=1) if status != "submitted" else None)
                db.add(sub)
                db.flush()
                if value:
                    db.add(Grade(student_id=e.student_id, group_id=g.id, submission_id=sub.id, value=value,
                                 type="homework", date=(submitted_at + timedelta(days=1)).date(), comment=hw.title))
    db.flush()

    # --- оплаты ---
    course_by_group = {g.id: next(c for c in courses if c.id == g.course_id) for g in groups}
    for e in enrollments:
        g = next(x for x in groups if x.id == e.group_id)
        course = course_by_group[g.id]
        last = min(g.end_date, today)
        if e.status == "dropped":
            last = min(last, e.enrolled_at + timedelta(days=30))
        y, m = e.enrolled_at.year, e.enrolled_at.month
        d = dil[e.student_id]
        while (y, m) <= (last.year, last.month):
            due = date(y, m, 25)
            current = (y, m) == (today.year, today.month)
            prev_month = (y, m) == ((today.replace(day=1) - timedelta(days=1)).year, (today.replace(day=1) - timedelta(days=1)).month)
            if current and due >= today:
                paid = e.student_id != anna.id and rng.random() < 0.45
                status = "paid" if paid else "pending"
            elif prev_month and d < 0.68 and rng.random() < 0.6:
                status = "overdue"
            else:
                status = "paid"
            db.add(Payment(student_id=e.student_id, course_id=course.id, period=f"{MONTHS_FULL[m - 1]} {y}",
                           amount=course.price, due_date=due, status=status,
                           paid_at=datetime.combine(due - timedelta(days=rng.randint(1, 12)), time(12, 0)) if status == "paid" else None))
            y, m = (y + 1, 1) if m == 12 else (y, m + 1)

    # --- комментарии ---
    for g in active_groups:
        active_members = [e for e in members.get(g.id, []) if e.status == "active" and e.student_id != anna.id]
        for e in rng.sample(active_members, min(len(active_members), rng.randint(3, 6))):
            d = dil[e.student_id]
            kind = "praise" if d > 0.85 else ("remark" if d < 0.65 else "recommendation")
            db.add(Comment(teacher_id=g.teacher_id, student_id=e.student_id, kind=kind,
                           text=rng.choice(TEACHER_COMMENTS[kind]), created_at=now - timedelta(days=rng.randint(1, 40))))
    for g, kind, text, days in [
        (by_name["WEB-A1"], "praise", "Анна, отличная вёрстка! Чистая семантика и аккуратный адаптив.", 2),
        (by_name["PY-1"], "recommendation", "Повтори тему «ООП: наследование» перед следующим занятием — будет практика.", 6),
        (by_name["SQL-10"], "praise", "Запросы с JOIN написала без единой ошибки, так держать.", 12),
    ]:
        db.add(Comment(teacher_id=g.teacher_id, student_id=anna.id, kind=kind, text=text, created_at=now - timedelta(days=days)))

    # --- активность ---
    for s in students:
        s.last_active_at = now - timedelta(hours=rng.randint(1, 24 * 12))
    anna.last_active_at = now
    db.commit()


def _count_lessons(g: Group, weekdays: tuple[int, ...]) -> int:
    days = (g.end_date - g.start_date).days + 1
    return sum((g.start_date + timedelta(days=i)).weekday() in weekdays for i in range(days))


def seed_if_empty(db: Session) -> None:
    if db.scalar(select(User.id).limit(1)) is None:
        seed(db)


if __name__ == "__main__":
    from app.core.database import Base, SessionLocal, engine

    if "--reset" in sys.argv:
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        seed_if_empty(session)
    print("Готово. Демо-пароль для всех аккаунтов:", DEMO_PASSWORD)
