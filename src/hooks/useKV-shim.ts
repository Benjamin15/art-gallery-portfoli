import { useEffect, useRef, useState } from 'react'
import spark from '@/lib/spark-shim'

// API-compatible signature used in the codebase
export function useKV<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial)
  const mounted = useRef(false)
  // Évite la première persistance immédiatement après le chargement initial
  const skipNextPersist = useRef(false)

  // Load initial from server
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const v = await spark.kv.get<T>(key)
        if (!cancelled && v !== null && v !== undefined) {
          setValue(v)
          // Sauter la prochaine persistance (sinon on ré-écrit le même contenu et Vite recharge)
          skipNextPersist.current = true
        }
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [key])

  // Persist on change (skip first render if it equals initial)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    if (skipNextPersist.current) {
      skipNextPersist.current = false
      return
    }
    spark.kv.set(key, value).catch(() => {})
  }, [key, value])

  const update = (v: T | ((prev: T) => T)) => {
    setValue(prev => (typeof v === 'function' ? (v as any)(prev) : v))
  }

  return [value, update]
}

export default useKV
