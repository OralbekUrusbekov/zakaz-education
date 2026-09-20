#!/usr/bin/env python3
"""Генерирует тематические обложки-иллюстрации в фирменном стиле.

Обложки лежат в public/clubs, public/programs и public/topics и используются в карточках,
где у школы пока нет собственной фотографии. Запуск: python3 scripts/build-art.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "public"


def cover(bg: str, accent: str, deep: str, icon: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500" role="img">
  <rect width="800" height="500" fill="{bg}"/>
  <g opacity=".35" stroke="{accent}" fill="none" stroke-width="1.5">
    <circle cx="700" cy="70" r="120"/><circle cx="90" cy="430" r="150"/>
  </g>
  <g transform="translate(400 250)" fill="none" stroke="{deep}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
    {icon}
  </g>
</svg>"""


# ---------- клубы ----------
CLUBS = {
    "robotics": ("#dcebf8", "#7aa8d8", "#2f5d9e", """
    <rect x="-95" y="-55" width="190" height="140" rx="26"/>
    <line x1="0" y1="-55" x2="0" y2="-95"/><circle cx="0" cy="-105" r="12" fill="#2f5d9e" stroke="none"/>
    <circle cx="-42" cy="5" r="17"/><circle cx="42" cy="5" r="17"/>
    <line x1="-35" y1="50" x2="35" y2="50"/>
    <line x1="-95" y1="15" x2="-135" y2="15"/><line x1="95" y1="15" x2="135" y2="15"/>"""),
    "theatre": ("#f6e4f1", "#c98bb9", "#8b3f7a", """
    <path d="M-120 -70h110v80a55 55 0 0 1-110 0z"/>
    <circle cx="-95" cy="-30" r="8" fill="#8b3f7a" stroke="none"/><circle cx="-35" cy="-30" r="8" fill="#8b3f7a" stroke="none"/>
    <path d="M-92 5q27 22 54 0"/>
    <path d="M10 -20h110v80a55 55 0 0 1-110 0z"/>
    <circle cx="35" cy="20" r="8" fill="#8b3f7a" stroke="none"/><circle cx="95" cy="20" r="8" fill="#8b3f7a" stroke="none"/>
    <path d="M38 62q27-22 54 0"/>"""),
    "debate": ("#e0f0e4", "#79b894", "#2f7a4f", """
    <path d="M-135 -75h150a20 20 0 0 1 20 20v70a20 20 0 0 1-20 20h-85l-45 38v-38h-20a20 20 0 0 1-20-20v-70a20 20 0 0 1 20-20z"/>
    <path d="M135 -20H45a20 20 0 0 0-20 20v60a20 20 0 0 0 20 20h60l40 34V80h10a20 20 0 0 0 20-20V0a20 20 0 0 0-20-20z" opacity=".75"/>"""),
    "art": ("#fbeedd", "#d9a668", "#a2691f", """
    <path d="M-30 -110a125 125 0 1 0 0 250c22 0 30-16 22-28-10-15 1-32 20-32h40a62 62 0 0 0 62-62c0-70-60-128-144-128z"/>
    <circle cx="-72" cy="-32" r="13" fill="#a2691f" stroke="none"/>
    <circle cx="-18" cy="-70" r="13" fill="#a2691f" stroke="none"/>
    <circle cx="42" cy="-58" r="13" fill="#a2691f" stroke="none"/>
    <circle cx="78" cy="-6" r="13" fill="#a2691f" stroke="none"/>"""),
    "sport": ("#fde3c4", "#dda05c", "#a35a12", """
    <circle cx="0" cy="0" r="118"/>
    <path d="M-118 0h236M0 -118v236"/>
    <path d="M-84 -84q84 84 168 168M84 -84Q0 0-84 84"/>"""),
    "journalism": ("#d9efec", "#6bb3aa", "#1f6f66", """
    <path d="M-135 -85h200v170h-200z"/>
    <path d="M65 -40h70v110a25 25 0 0 1-25 25h-45z"/>
    <path d="M-105 -50h140M-105 -12h140M-105 26h90"/>"""),
}

# ---------- ступени обучения ----------
PROGRAMS = {
    "primary": ("#f3ead8", "#cbb27a", "#8a6c22", """
    <rect x="-130" y="-60" width="100" height="100" rx="14"/>
    <rect x="-15" y="-60" width="100" height="100" rx="14"/>
    <rect x="-72" y="55" width="100" height="60" rx="14"/>
    <path d="M100 -95l45 45-90 90-45-45z"/><path d="M55 40l-25 10 10-25"/>"""),
    "middle": ("#e6ecfa", "#8ea3dd", "#3f55ad", """
    <circle cx="0" cy="0" r="30"/>
    <ellipse cx="0" cy="0" rx="130" ry="52"/>
    <ellipse cx="0" cy="0" rx="130" ry="52" transform="rotate(60)"/>
    <ellipse cx="0" cy="0" rx="130" ry="52" transform="rotate(-60)"/>"""),
    "high": ("#e4efe8", "#83b79b", "#2c6a4c", """
    <path d="M-140 -35L0 -100l140 65L0 30z"/>
    <path d="M-80 -10v70c0 22 36 40 80 40s80-18 80-40v-70"/>
    <path d="M125 -28v80"/><circle cx="125" cy="62" r="11" fill="#2c6a4c" stroke="none"/>"""),
    "studios": ("#f7e6ea", "#d093a1", "#973a52", """
    <path d="M-120 60V-70l90-25v130"/>
    <ellipse cx="-90" cy="62" rx="30" ry="22"/><ellipse cx="0" cy="38" rx="30" ry="22"/>
    <path d="M60 -80a60 60 0 1 1 0 120 30 30 0 0 0 0 60 90 90 0 1 0 0-180z"/>
    <circle cx="70" cy="-30" r="10" fill="#973a52" stroke="none"/>"""),
}

# ---------- рубрики новостей ----------
TOPICS = {
    "events": ("#f2ecdd", "#cdb887", "#8a7333", """
    <rect x="-125" y="-95" width="250" height="200" rx="18"/>
    <path d="M-125 -40h250M-70 -95v-35M70 -95v-35"/>
    <circle cx="-45" cy="10" r="13" fill="#8a7333" stroke="none"/><circle cx="20" cy="10" r="13" fill="#8a7333" stroke="none"/>
    <circle cx="-45" cy="62" r="13" fill="#8a7333" stroke="none"/><circle cx="20" cy="62" r="13" fill="#8a7333" stroke="none"/>"""),
    "art": ("#fbeedd", "#d9a668", "#a2691f", """
    <rect x="-125" y="-95" width="250" height="190" rx="14"/>
    <path d="M-125 60l80-85 55 55 40-35 50 65"/>
    <circle cx="55" cy="-45" r="20"/>"""),
    "holidays": ("#f7e6ea", "#d093a1", "#973a52", """
    <path d="M0 -110v220M-95 -55l190 110M95 -55L-95 55"/>
    <circle cx="0" cy="0" r="26" fill="#973a52" stroke="none"/>
    <circle cx="0" cy="-110" r="12"/><circle cx="-95" cy="55" r="12"/><circle cx="95" cy="55" r="12"/>"""),
    "science": ("#e6ecfa", "#8ea3dd", "#3f55ad", """
    <path d="M-45 -100v70L-120 75a26 26 0 0 0 22 40h196a26 26 0 0 0 22-40L45 -30v-70z"/>
    <path d="M-70 -100h140"/>
    <circle cx="-20" cy="40" r="12" fill="#3f55ad" stroke="none"/><circle cx="35" cy="65" r="9" fill="#3f55ad" stroke="none"/>"""),
    "volunteer": ("#e4efe8", "#83b79b", "#2c6a4c", """
    <path d="M0 95C-40 55-115 10-115 -45a62 62 0 0 1 115-32 62 62 0 0 1 115 32c0 55-75 100-115 140z"/>"""),
    "career": ("#e9e7f4", "#9b95c9", "#4a4292", """
    <rect x="-125" y="-45" width="250" height="150" rx="16"/>
    <path d="M-45 -45v-35a20 20 0 0 1 20-20h50a20 20 0 0 1 20 20v35"/>
    <path d="M-125 20h250"/>"""),
    "culture": ("#eef0e2", "#adb97f", "#5e6b22", """
    <circle cx="0" cy="0" r="115"/>
    <path d="M-115 0h230"/>
    <path d="M0 -115C40-70 40 70 0 115M0 -115C-40-70-40 70 0 115"/>"""),
    "literature": ("#eae7f0", "#a197b6", "#564a72", """
    <path d="M0 -75C-35-110-90-110-125-85v160c35-25 90-25 125 10"/>
    <path d="M0 -75c35-35 90-35 125-10v160c-35-25-90-25-125 10"/>
    <path d="M0 -75v160"/>"""),
    "infrastructure": ("#e3eef2", "#87aebd", "#2c5f73", """
    <path d="M-130 80V-20l70-55 70 55v100"/>
    <path d="M10 80V10h120v70"/>
    <path d="M-60 80V25h0M40 40h60M40 65h60"/>"""),
    "sport": ("#fde3c4", "#dda05c", "#a35a12", """
    <circle cx="0" cy="0" r="105"/>
    <path d="M0 -105l30 55-30 55-30-55z"/>
    <path d="M-105 0l55 25M105 0l-55 25"/>"""),
    "media": ("#d9efec", "#6bb3aa", "#1f6f66", """
    <rect x="-130" y="-70" width="180" height="140" rx="16"/>
    <path d="M50 -25l80-45v130l-80-45z"/>
    <circle cx="-40" cy="0" r="26"/>"""),
    "parents": ("#f2ecdd", "#cdb887", "#8a7333", """
    <circle cx="-55" cy="-45" r="34"/><circle cx="55" cy="-55" r="28"/>
    <path d="M-125 85c0-40 32-66 70-66s70 26 70 66"/>
    <path d="M25 85c0-32 25-54 55-54s45 20 45 46"/>"""),
}

CATEGORY_TO_TOPIC = {
    "События": "events",
    "Искусство": "art",
    "Праздники": "holidays",
    "Наука и техника": "science",
    "Волонтёрство": "volunteer",
    "Карьера": "career",
    "Культура": "culture",
    "Литература": "literature",
    "Инфраструктура": "infrastructure",
    "Спорт": "sport",
    "Медиа": "media",
    "Родителям": "parents",
}


def write(folder: str, items: dict) -> None:
    out = ROOT / folder
    out.mkdir(parents=True, exist_ok=True)
    for name, (bg, accent, deep, icon) in items.items():
        (out / f"{name}.svg").write_text(cover(bg, accent, deep, icon))
    print(f"{folder}: {len(items)} обложек")


if __name__ == "__main__":
    write("clubs", CLUBS)
    write("programs", PROGRAMS)
    write("topics", TOPICS)
