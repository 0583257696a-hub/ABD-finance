'use client'
import { useCallback, useEffect, useState } from 'react'

export function useAdvisorData<T = unknown>(key?: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/data')
      if (!res.ok) throw new Error('Failed to load advisor data')
      const json = await res.json()
      setData(key ? json.data?.[key] ?? null : json.data ?? null)
      return json.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [key])

  const saveData = useCallback(async (saveKey: string, value: unknown) => {
    setError(null)
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: saveKey, data: value }),
    })
    if (!res.ok) {
      const message = 'Failed to save advisor data'
      setError(message)
      throw new Error(message)
    }
    const json = await res.json()
    if (!key || key === saveKey) setData(value as T)
    return json.data
  }, [key])

  useEffect(() => {
    void loadData()
  }, [loadData])

  return { data, loading, error, loadData, saveData }
}
