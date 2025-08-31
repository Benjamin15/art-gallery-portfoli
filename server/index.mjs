import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json({ limit: '25mb' }))

const dataDir = path.join(__dirname, 'data')
const kvFile = path.join(dataDir, 'kv.json')

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(kvFile)) fs.writeFileSync(kvFile, JSON.stringify({}), 'utf8')
}

function readKV() {
  ensureDataDir()
  try {
    return JSON.parse(fs.readFileSync(kvFile, 'utf8') || '{}')
  } catch (e) {
    return {}
  }
}

function writeKV(obj) {
  ensureDataDir()
  fs.writeFileSync(kvFile, JSON.stringify(obj, null, 2), 'utf8')
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// KV: list keys
app.get('/api/kv/keys', (_req, res) => {
  const kv = readKV()
  res.json(Object.keys(kv))
})

// KV: get value
app.get('/api/kv/*', (req, res) => {
  const key = '/' + req.params[0]
  const kv = readKV()
  if (!(key in kv)) return res.status(404).json({ error: 'Not found' })
  res.json({ value: kv[key] })
})

// KV: set value
app.put('/api/kv/*', (req, res) => {
  const key = '/' + req.params[0]
  const { value } = req.body || {}
  if (typeof value === 'undefined') return res.status(400).json({ error: 'Missing value' })
  const kv = readKV()
  kv[key] = value
  writeKV(kv)
  res.json({ ok: true })
})

// KV: delete
app.delete('/api/kv/*', (req, res) => {
  const key = '/' + req.params[0]
  const kv = readKV()
  if (key in kv) {
    delete kv[key]
    writeKV(kv)
  }
  res.json({ ok: true })
})

// User endpoint — for now, always owner in dev
app.get('/api/user', (_req, res) => {
  res.json({ isOwner: true })
})

const port = process.env.PORT || 8787
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
})
