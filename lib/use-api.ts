'use client'
import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

export function useApi<T>(fetcher: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const request = useRef(0)

  const load = useCallback(async () => {
    const id = ++request.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      if (id === request.current) setData(result)
    } catch (e) {
      if (id === request.current) setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      if (id === request.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    load()
  }, [load])

  return { data, error, loading, reload: load, setData }
}
