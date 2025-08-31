// Minimal client shim replicating the API surface used in the app
// It calls the local dev server created in server/index.mjs

const BASE = (import.meta.env.VITE_API_BASE as string) || '/api'

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const spark = {
  async user() {
    return http<{ isOwner: boolean }>(`/user`)
  },
  kv: {
    async get<T = unknown>(key: string): Promise<T | null> {
      try {
        const data = await http<{ value: T }>(`/kv${normalizeKey(key)}`)
        return data.value ?? null
      } catch (e) {
        return null
      }
    },
    async set<T = unknown>(key: string, value: T): Promise<void> {
      await http(`/kv${normalizeKey(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      })
    },
    async delete(key: string): Promise<void> {
      await http(`/kv${normalizeKey(key)}`, { method: 'DELETE' })
    },
    async keys(): Promise<string[]> {
      return http<string[]>(`/kv/keys`)
    },
  },
}

function normalizeKey(key: string) {
  return key.startsWith('/') ? key : `/${key}`
}

declare global {
  // Make spark visible similar to original
  // but avoid polluting when not desired
  // @ts-ignore
  var spark: typeof spark | undefined
}

// Optionally expose on window for drop-in compatibility
if (typeof window !== 'undefined') {
  // @ts-ignore
  ;(window as any).spark = spark
}

export default spark
