import express from 'express'
import cors from 'cors'
import { getDb } from './mongo.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
// Allow CORS so that a static frontend (e.g. GitHub Pages) can call the API
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*'
}))
app.use(express.json({ limit: '25mb' }))

const dataDir = path.join(__dirname, 'data')
const kvFile = path.join(dataDir, 'kv.json')

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(kvFile)) fs.writeFileSync(kvFile, JSON.stringify({}), 'utf8')
}

async function readKV() {
  const db = await getDb()
  if (db) {
    const docs = await db.collection('kv').find({}).toArray()
    const map = {}
    for (const d of docs) map[d.key] = d.value
    return map
  }
  ensureDataDir()
  try {
    return JSON.parse(fs.readFileSync(kvFile, 'utf8') || '{}')
  } catch (e) {
    return {}
  }
}

async function writeKV(obj) {
  const db = await getDb()
  if (db) {
    const coll = db.collection('kv')
    const bulk = coll.initializeUnorderedBulkOp()
    for (const [k, v] of Object.entries(obj)) {
      bulk.find({ key: k }).upsert().updateOne({ $set: { key: k, value: v } })
    }
    await bulk.execute()
    return
  }
  ensureDataDir()
  fs.writeFileSync(kvFile, JSON.stringify(obj, null, 2), 'utf8')
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// KV: list keys
app.get('/api/kv/keys', async (_req, res) => {
  const kv = await readKV()
  res.json(Object.keys(kv))
})

// KV: get value
app.get('/api/kv/*', async (req, res) => {
  const key = '/' + req.params[0]
  const kv = await readKV()
  if (!(key in kv)) return res.status(404).json({ error: 'Not found' })
  res.json({ value: kv[key] })
})

// KV: set value
app.put('/api/kv/*', async (req, res) => {
  const key = '/' + req.params[0]
  const { value } = req.body || {}
  if (typeof value === 'undefined') return res.status(400).json({ error: 'Missing value' })
  const kv = await readKV()
  kv[key] = value
  await writeKV(kv)
  res.json({ ok: true })
})

// KV: delete
app.delete('/api/kv/*', async (req, res) => {
  const key = '/' + req.params[0]
  const kv = await readKV()
  if (key in kv) {
    delete kv[key]
    await writeKV(kv)
  }
  res.json({ ok: true })
})

// User endpoint — for now, always owner in dev
app.get('/api/user', (_req, res) => {
  res.json({ isOwner: true })
})

// --- Static client (production) ---
// Serve the Vite build output if available
const distDir = path.resolve(__dirname, '..', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  // SPA fallback: send index.html for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    const indexFile = path.join(distDir, 'index.html')
    if (fs.existsSync(indexFile)) {
      return res.sendFile(indexFile)
    }
    next()
  })
}

const port = process.env.PORT || 8787
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
})
