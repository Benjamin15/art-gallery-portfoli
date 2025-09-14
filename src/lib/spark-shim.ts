// Shim côté client sans serveur: lit /data/kv.json (statique) et persiste les modifs en localStorage.

type StaticKV = Record<string, any>

const STATIC_KV_URL = `${import.meta.env.BASE_URL || '/'}data/kv.json`

let staticCache: StaticKV | null = null
let staticLoadPromise: Promise<StaticKV> | null = null

async function loadStaticKV(): Promise<StaticKV> {
  if (staticCache) return staticCache
  if (!staticLoadPromise) {
    staticLoadPromise = fetch(STATIC_KV_URL)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load ${STATIC_KV_URL}`)
        return r.json()
      })
  .then((json: any) => {
        // Deux formats possibles:
        // 1) Map plate avec clés "/gallery-artworks" et "/images/..."
        // 2) Objet { gallery-artworks, images: { ... } }
        const normalized: StaticKV = {}
        if (json && typeof json === 'object' && !Array.isArray(json)) {
          const keys = Object.keys(json)
          const hasSlashKeys = keys.some(k => k.startsWith('/'))
          if (hasSlashKeys) {
            // Format (1)
            for (const k of keys) normalized[k] = json[k]
          } else {
            // Format (2)
            if ('gallery-artworks' in json) normalized['/gallery-artworks'] = json['gallery-artworks']
            if (json.images && typeof json.images === 'object') {
              for (const [k, v] of Object.entries<any>(json.images)) {
                const key = k.startsWith('/images/') ? k : `/images/${k}`
                normalized[key] = v
              }
            }
            // Inclure autres champs top-level (ex: bio, bioPhoto, etc.) sans slash
            for (const [k, v] of Object.entries<any>(json)) {
              if (k === 'gallery-artworks' || k === 'images') continue
              normalized[k] = v
            }
          }
        }
        staticCache = normalized
        return normalized
      })
      .catch(() => (staticCache = {} as StaticKV))
  }
  return staticLoadPromise
}

function normalizeKey(key: string) {
  return key.startsWith('/') ? key : `/${key}`
}

function localGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`kv:${key}`)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function localSet<T>(key: string, value: T) {
  try {
    localStorage.setItem(`kv:${key}`, JSON.stringify(value))
  } catch {}
}

function localDelete(key: string) {
  try {
    localStorage.removeItem(`kv:${key}`)
  } catch {}
}

function localKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) || ''
    if (k.startsWith('kv:/')) keys.push(k.substring(3))
  }
  return keys
}

export const spark = {
  async user() {
    // Pas d'auth serveur: considérer l'utilisateur comme propriétaire.
    return { isOwner: true }
  },
  kv: {
    async get<T = unknown>(key: string): Promise<T | null> {
      const k = normalizeKey(key)
      // Priorité aux valeurs locales (modifiées côté client)
      const lv = localGet<T>(k)
      if (lv !== null && lv !== undefined) return lv
      // Sinon, lire le JSON statique
      const data = await loadStaticKV()
      if (k in data) return data[k] as T
      // Compat sans slash
      const alt = key
      if (alt in data) return data[alt] as T
      return null
    },
    async set<T = unknown>(key: string, value: T): Promise<void> {
      const k = normalizeKey(key)
      localSet(k, value)
    },
    async delete(key: string): Promise<void> {
      const k = normalizeKey(key)
      localDelete(k)
    },
    async keys(): Promise<string[]> {
      const data = await loadStaticKV()
      const staticKeys = Object.keys(data)
      const lkeys = localKeys()
      return Array.from(new Set([...staticKeys, ...lkeys])).sort()
    },
  },
}

declare global {
  // @ts-ignore
  var spark: typeof spark | undefined
}

if (typeof window !== 'undefined') {
  // @ts-ignore
  ;(window as any).spark = spark
}

export default spark
