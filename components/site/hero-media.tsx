'use client'
import { useState } from 'react'

/**
 * Фон главного экрана: видео с автозапуском без звука.
 * Если файла нет или браузер не смог его проиграть — остаётся фотография.
 */
export function HeroMedia({ video = '/hero.mp4', poster = '/hero/01.jpg' }: { video?: string; poster?: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) return <img src={poster} alt="Ученики Tech School" />

  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={poster}
      aria-label="Ученики Tech School"
      onError={() => setFailed(true)}
    >
      <source src={video} type="video/mp4" />
    </video>
  )
}
