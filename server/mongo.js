import { MongoClient } from 'mongodb'

let client
let db

export async function getDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) return null
  if (db) return db
  client = new MongoClient(uri, { maxPoolSize: 5 })
  await client.connect()
  const dbName = process.env.MONGODB_DB || 'artgallery'
  db = client.db(dbName)
  return db
}

export async function closeDb() {
  if (client) await client.close()
  client = null
  db = null
}
