const db = require('../db')

const toUserPublic = (doc) => ({
  id: doc._id.toString(),
  name: doc.name,
  email: doc.email,
  role: doc.role,
  createdAt: doc.createdAt,
})

const createUser = async ({ name, email, passwordHash, role = 'user' }) => {
  const users = db.getCollection('users')
  const now = new Date()
  const result = await users.insertOne({
    name,
    email: String(email).trim().toLowerCase(),
    passwordHash,
    role,
    createdAt: now,
  })
  const created = await users.findOne({ _id: result.insertedId })
  return toUserPublic(created)
}

const getUserByEmailWithPassword = async (email) => {
  const users = db.getCollection('users')
  const doc = await users.findOne({ email: String(email).trim().toLowerCase() })
  if (!doc) return null
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    password_hash: doc.passwordHash,
    created_at: doc.createdAt,
  }
}

const getUserById = async (id) => {
  const users = db.getCollection('users')
  const objectId = db.toObjectId(id)
  if (!objectId) return null
  const doc = await users.findOne({ _id: objectId })
  return doc ? toUserPublic(doc) : null
}

const listUsers = async () => {
  const users = db.getCollection('users')
  const docs = await users
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: 1, _id: 1 })
    .toArray()
  return docs.map(toUserPublic)
}

const countUsers = async () => {
  const users = db.getCollection('users')
  return users.countDocuments()
}

const updateUser = async ({ id, name, role }) => {
  const users = db.getCollection('users')
  const objectId = db.toObjectId(id)
  if (!objectId) return null

  const set = {}
  if (name !== undefined) set.name = name
  if (role !== undefined) set.role = role

  const result = await users.findOneAndUpdate(
    { _id: objectId },
    { $set: set },
    { returnDocument: 'after', projection: { passwordHash: 0 } }
  )
  return result.value ? toUserPublic(result.value) : null
}

const deleteUser = async (id) => {
  const users = db.getCollection('users')
  const activities = db.getCollection('activities')
  const friends = db.getCollection('friends')

  const objectId = db.toObjectId(id)
  if (!objectId) return false

  const result = await users.deleteOne({ _id: objectId })
  if (!result.deletedCount) return false

  await Promise.all([
    activities.deleteMany({ userId: objectId }),
    friends.deleteMany({ userId: objectId }),
    friends.deleteMany({ friendUserId: objectId }),
  ])

  return true
}

const listPeople = async ({ excludeUserId }) => {
  const users = db.getCollection('users')
  const excludeId = db.toObjectId(excludeUserId)
  if (!excludeId) {
    const err = new Error('Invalid id')
    err.code = 'INVALID_ID'
    throw err
  }
  const docs = await users
    .find({ _id: { $ne: excludeId } }, { projection: { name: 1 } })
    .sort({ name: 1, _id: 1 })
    .toArray()
  return docs.map((d) => ({ id: d._id.toString(), name: d.name }))
}

module.exports = {
  createUser,
  getUserByEmailWithPassword,
  getUserById,
  listUsers,
  countUsers,
  listPeople,
  updateUser,
  deleteUser,
}
