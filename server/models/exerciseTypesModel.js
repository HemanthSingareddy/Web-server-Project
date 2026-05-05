const db = require('../db')

const toExerciseType = (doc) => ({
  id: doc._id.toString(),
  name: doc.name,
  description: doc.description ?? null,
  createdByUserId: doc.createdByUserId ? doc.createdByUserId.toString() : null,
  createdAt: doc.createdAt,
})

const createExerciseType = async ({ name, description, createdByUserId }) => {
  const exerciseTypes = db.getCollection('exerciseTypes')
  const now = new Date()
  const createdBy = createdByUserId ? db.toObjectId(createdByUserId) : null

  const result = await exerciseTypes.insertOne({
    name: String(name).trim(),
    description: description ?? null,
    createdByUserId: createdBy,
    createdAt: now,
  })

  const created = await exerciseTypes.findOne({ _id: result.insertedId })
  return toExerciseType(created)
}

const listExerciseTypes = async () => {
  const exerciseTypes = db.getCollection('exerciseTypes')
  const docs = await exerciseTypes.find({}).sort({ name: 1, _id: 1 }).toArray()
  return docs.map(toExerciseType)
}

const getExerciseTypeById = async (id) => {
  const exerciseTypes = db.getCollection('exerciseTypes')
  const objectId = db.toObjectId(id)
  if (!objectId) return null
  const doc = await exerciseTypes.findOne({ _id: objectId })
  return doc ? toExerciseType(doc) : null
}

const updateExerciseType = async ({ id, name, description }) => {
  const exerciseTypes = db.getCollection('exerciseTypes')
  const objectId = db.toObjectId(id)
  if (!objectId) return null

  const set = {}
  if (name !== undefined) set.name = String(name).trim()
  if (description !== undefined) set.description = description

  const result = await exerciseTypes.findOneAndUpdate(
    { _id: objectId },
    { $set: set },
    { returnDocument: 'after' }
  )
  return result ? toExerciseType(result) : null
}

const deleteExerciseType = async (id) => {
  const objectId = db.toObjectId(id)
  if (!objectId) return false

  const activities = db.getCollection('activities')
  const used = await activities.countDocuments({ exerciseTypeId: objectId }, { limit: 1 })
  if (used > 0) {
    const err = new Error('Exercise type is in use')
    err.code = 'TYPE_IN_USE'
    throw err
  }

  const exerciseTypes = db.getCollection('exerciseTypes')
  const result = await exerciseTypes.deleteOne({ _id: objectId })
  return Boolean(result.deletedCount)
}

module.exports = {
  createExerciseType,
  listExerciseTypes,
  getExerciseTypeById,
  updateExerciseType,
  deleteExerciseType,
}
