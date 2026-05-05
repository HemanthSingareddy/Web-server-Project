const { MongoClient, ObjectId } = require('mongodb')

let client
let database

const initDb = async ({ mongoUri, dbName }) => {
  client = new MongoClient(mongoUri)
  await client.connect()
  database = client.db(dbName)
  return database
}

const getDb = () => {
  if (!database) {
    throw new Error('DB not initialized. Call initDb() first.')
  }
  return database
}

const getCollection = (name) => getDb().collection(name)

const toObjectId = (value) => {
  if (!value) return null
  if (value instanceof ObjectId) return value
  if (!ObjectId.isValid(String(value))) return null
  return new ObjectId(String(value))
}

const ensureIndexes = async () => {
  // Users
  await getCollection('users').createIndex({ email: 1 }, { unique: true })
  await getCollection('users').createIndex({ createdAt: 1 })

  // Exercise types
  await getCollection('exerciseTypes').createIndex({ name: 1 }, { unique: true })
  await getCollection('exerciseTypes').createIndex({ createdAt: 1 })

  // Activities
  await getCollection('activities').createIndex({ userId: 1, activityDate: -1 })
  await getCollection('activities').createIndex({ exerciseTypeId: 1 })

  // Friends
  await getCollection('friends').createIndex({ userId: 1, friendUserId: 1 }, { unique: true })
  await getCollection('friends').createIndex({ userId: 1 })
}

const closeDb = async () => {
  if (!client) return
  await client.close()
  client = null
  database = null
}

module.exports = {
  initDb,
  getDb,
  getCollection,
  ensureIndexes,
  toObjectId,
  closeDb,
}
