'use client'
import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored != null) setValue(JSON.parse(stored) as T)
    } catch {
      setValue(initialValue)
    }
  }, [key, initialValue])

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage may be unavailable in private mode.
    }
  }, [key, value])

  return [value, setValue] as const
}
