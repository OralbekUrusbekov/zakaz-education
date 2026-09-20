#!/usr/bin/env python3
"""Собирает видео для главного экрана из картинок в public/hero.

Каждый кадр показывается SECONDS секунд с медленным зумом, между кадрами — плавное
перетекание FADE секунд. Чтобы поменять видео, положите свои фотографии в public/hero
(любые jpg/png, порядок — по имени файла) и запустите:

    python3 scripts/build-hero-video.py
    python3 scripts/build-hero-video.py --seconds 5 --fade 0.4
"""
import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRAMES_DIR = ROOT / "public" / "hero"
OUTPUT = ROOT / "public" / "hero.mp4"
FPS = 25
SIZE = (1920, 1080)


def frames() -> list[Path]:
    files = sorted(p for p in FRAMES_DIR.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
    if not files:
        sys.exit(f"Не нашёл картинок в {FRAMES_DIR}")
    return files


def build(seconds: float, fade: float, crf: int) -> None:
    images = frames()
    n = len(images)
    hold = int(seconds * FPS)
    w, h = SIZE

    cmd: list[str] = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    for img in images:
        cmd += ["-loop", "1", "-t", f"{seconds}", "-i", str(img)]

    parts = []
    for i in range(n):
        # чётные кадры приближаются, нечётные отдаляются — движение не выглядит однообразным
        zoom = (
            f"min(zoom+{0.0012:.4f},1.12)"
            if i % 2 == 0
            else f"if(lte(zoom,1.0),1.12,max(1.001,zoom-{0.0012:.4f}))"
        )
        parts.append(
            f"[{i}:v]scale={w * 2}:-2,crop={w * 2}:{int(w * 2 * h / w)},"
            f"zoompan=z='{zoom}':d={hold}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={w}x{h}:fps={FPS},"
            f"setsar=1[v{i}]"
        )

    prev = "[v0]"
    for i in range(1, n):
        offset = i * (seconds - fade)
        label = "[vout]" if i == n - 1 else f"[x{i}]"
        parts.append(f"{prev}[v{i}]xfade=transition=fade:duration={fade}:offset={offset:.2f}{label}")
        prev = label
    parts.append(f"{prev}format=yuv420p[v]" if n > 1 else "[v0]format=yuv420p[v]")

    total = n * seconds - (n - 1) * fade
    cmd += [
        "-filter_complex", ";".join(parts),
        "-map", "[v]",
        "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
        "-movflags", "+faststart", "-an", "-t", f"{total:.2f}",
        str(OUTPUT),
    ]

    subprocess.run(cmd, check=True)
    size_mb = OUTPUT.stat().st_size / 1024 / 1024
    print(f"Готово: {OUTPUT.relative_to(ROOT)} — {n} кадров, {total:.1f} c, {size_mb:.1f} МБ")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--seconds", type=float, default=4.0, help="сколько секунд держится кадр")
    parser.add_argument("--fade", type=float, default=0.6, help="длительность перехода")
    parser.add_argument("--crf", type=int, default=28, help="качество: меньше — лучше и тяжелее")
    args = parser.parse_args()
    build(args.seconds, args.fade, args.crf)
