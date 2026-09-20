#!/usr/bin/env python3
"""Готовит все изображения сайта из исходников в assets/source.

Из одного исходника делаются кадры нужных пропорций: обложки карточек (16:10),
широкие полосы (21:9), кадры для видео на главной (16:9) и затемнённые фоны секций.
Запуск: python3 scripts/build-photos.py
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "source"
PUB = ROOT / "public"

CARD = (1200, 750)     # 16:10 — карточки клубов, программ, рубрик
BAND = (1920, 820)     # ~21:9 — широкие фотополосы
FRAME = (1920, 1080)   # 16:9 — кадры для видео главной


def run(args: list[str]) -> None:
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode:
        sys.exit(f"ffmpeg: {result.stderr[:400]}")


def crop(src: str, out: Path, size: tuple[int, int], *, focus: float = 0.5, extra: str = "") -> None:
    """Кадрирует картинку под нужный размер, focus — вертикальный центр кадра (0 — верх, 1 — низ)."""
    w, h = size
    out.parent.mkdir(parents=True, exist_ok=True)
    vf = (
        f"scale={w}:{h}:force_original_aspect_ratio=increase:flags=lanczos,"
        f"crop={w}:{h}:(iw-{w})/2:(ih-{h})*{focus},"
        f"unsharp=5:5:0.4,eq=saturation=1.04:contrast=1.02"
    )
    if extra:
        vf += "," + extra
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(SRC / src), "-vf", vf, "-q:v", "4", str(out)])


# исходник → где используется
CARDS = {
    # клубы
    "clubs/robotics.jpg": ("robotics.jpg", 0.5),
    "clubs/theatre.jpg": ("girls-class.jpg", 0.4),
    "clubs/debate.jpg": ("teens-library.jpg", 0.4),
    "clubs/art.jpg": ("kids-tablets.jpg", 0.5),
    "clubs/sport.jpg": ("campus-students.jpg", 0.55),
    "clubs/journalism.jpg": ("modern-library.jpg", 0.5),
    # ступени обучения
    "programs/primary.jpg": ("kids-tablets.jpg", 0.45),
    "programs/middle.jpg": ("classroom-kids.jpg", 0.45),
    "programs/high.jpg": ("exam-class.jpg", 0.45),
    "programs/studios.jpg": ("teacher-girls.jpg", 0.4),
    # рубрики новостей
    "topics/events.jpg": ("school-building.jpg", 0.5),
    "topics/art.jpg": ("kids-tablets.jpg", 0.35),
    "topics/holidays.jpg": ("classroom-kids.jpg", 0.55),
    "topics/science.jpg": ("robotics.jpg", 0.4),
    "topics/volunteer.jpg": ("teacher-girls.jpg", 0.5),
    "topics/career.jpg": ("teens-library.jpg", 0.5),
    "topics/culture.jpg": ("girls-class.jpg", 0.55),
    "topics/literature.jpg": ("teens-library.jpg", 0.55),
    "topics/infrastructure.jpg": ("school-building.jpg", 0.3),
    "topics/sport.jpg": ("campus-students.jpg", 0.45),
    "topics/media.jpg": ("exam-class.jpg", 0.55),
    "topics/parents.jpg": ("school-bus.jpg", 0.5),
    # крупные кадры для разделов
    "photos/campus-wide.jpg": ("campus-students.jpg", 0.45),
    "photos/class-wide.jpg": ("classroom-study.jpg", 0.45),
    "photos/campus-center.jpg": ("school-building.jpg", 0.5),
    "photos/class-center.jpg": ("classroom-kids.jpg", 0.45),
    "photos/teachers.jpg": ("teacher-girls.jpg", 0.45),
}

BANDS = {
    "photos/campus-band.jpg": ("campus-students.jpg", 0.5),
    "photos/class-band.jpg": ("classroom-study.jpg", 0.5),
    "photos/school-band.jpg": ("school-building.jpg", 0.5),
}

# затемнённые и размытые фоны под текст
DARK = {
    "photos/story-bg.jpg": ("campus-students.jpg", "gblur=sigma=5,eq=brightness=-0.14:saturation=0.7"),
    "photos/method-bg.jpg": ("classroom-study.jpg", "gblur=sigma=5,eq=brightness=-0.15:saturation=0.68"),
}

# кадры для видео на главной — по порядку показа
HERO = [
    ("campus-students.jpg", 0.45),
    ("classroom-kids.jpg", 0.45),
    ("teens-library.jpg", 0.4),
    ("kids-tablets.jpg", 0.5),
    ("girls-class.jpg", 0.4),
    ("classroom-study.jpg", 0.45),
    ("robotics.jpg", 0.45),
    ("modern-library.jpg", 0.45),
    ("exam-class.jpg", 0.45),
    ("school-building.jpg", 0.5),
]


def main() -> None:
    if not SRC.exists():
        sys.exit(f"Нет папки с исходниками: {SRC}")
    for out, (src, focus) in CARDS.items():
        crop(src, PUB / out, CARD, focus=focus)
    for out, (src, focus) in BANDS.items():
        crop(src, PUB / out, BAND, focus=focus)
    for out, (src, extra) in DARK.items():
        crop(src, PUB / out, BAND, focus=0.5, extra=extra)
    hero_dir = PUB / "hero"
    for old in hero_dir.glob("*"):
        old.unlink()
    for i, (src, focus) in enumerate(HERO, start=1):
        crop(src, hero_dir / f"{i:02d}.jpg", FRAME, focus=focus)
    print(f"Готово: {len(CARDS)} обложек, {len(BANDS) + len(DARK)} полос, {len(HERO)} кадров для видео")


if __name__ == "__main__":
    main()
