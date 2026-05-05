const db = require('../db')

const toActivity = (doc, { exerciseTypeName }) => ({
  id: doc._id.toString(),
  userId: doc.userId.toString(),
  date: doc.activityDate,
  exerciseTypeId: doc.exerciseTypeId.toString(),
  exerciseTypeName: exerciseTypeName || '',
  durationMinutes: doc.durationMinutes,
  notes: doc.notes ?? null,
  createdAt: doc.createdAt,
})

const createActivity = async ({ userId, activityDate, exerciseTypeId, durationMinutes, notes }) => {
  const activities = db.getCollection('activities')
  const types = db.getCollection('exerciseTypes')

  const userObjectId = db.toObjectId(userId)
  const typeObjectId = db.toObjectId(exerciseTypeId)
  if (!userObjectId || !typeObjectId) {
    const err = new Error('Invalid id')
    err.code = 'INVALID_ID'
    throw err
  }

  const typeDoc = await types.findOne({ _id: typeObjectId }, { projection: { name: 1 } })
  if (!typeDoc) return null

  const now = new Date()
  const result = await activities.insertOne({
    userId: userObjectId,
    activityDate,
    exerciseTypeId: typeObjectId,
    durationMinutes,
    notes: notes ?? null,
    createdAt: now,
  })

  const created = await activities.findOne({ _id: result.insertedId })
  return toActivity(created, { exerciseTypeName: typeDoc.name })
}

const getActivityByIdForUser = async ({ id, userId }) => {
  const activities = db.getCollection('activities')
  const types = db.getCollection('exerciseTypes')

  const objectId = db.toObjectId(id)
  const userObjectId = db.toObjectId(userId)
  if (!objectId || !userObjectId) return null

  const doc = await activities.findOne({ _id: objectId, userId: userObjectId })
  if (!doc) return null

  const typeDoc = await types.findOne({ _id: doc.exerciseTypeId }, { projection: { name: 1 } })
  return toActivity(doc, { exerciseTypeName: typeDoc?.name })
}

const listActivitiesForUser = async (userId) => {
  const activities = db.getCollection('activities')
  const types = db.getCollection('exerciseTypes')

  const userObjectId = db.toObjectId(userId)
  if (!userObjectId) {
    const err = new Error('Invalid id')
    err.code = 'INVALID_ID'
    throw err
  }

  const docs = await activities
    .find({ userId: userObjectId })
    .sort({ activityDate: -1, _id: -1 })
    .toArray()

  const typeIds = [...new Set(docs.map((d) => d.exerciseTypeId.toString()))].map((id) => db.toObjectId(id))
  const typeDocs = typeIds.length
    ? await types.find({ _id: { $in: typeIds } }, { projection: { name: 1 } }).toArray()
    : []
  const typeNameById = new Map(typeDocs.map((t) => [t._id.toString(), t.name]))

  return docs.map((d) => toActivity(d, { exerciseTypeName: typeNameById.get(d.exerciseTypeId.toString()) }))
}

const updateActivityForUser = async ({ id, userId, activityDate, exerciseTypeId, durationMinutes, notes }) => {
  const activities = db.getCollection('activities')
  const types = db.getCollection('exerciseTypes')

  const objectId = db.toObjectId(id)
  const userObjectId = db.toObjectId(userId)
  if (!objectId || !userObjectId) return null

  const set = {}
  if (activityDate !== null && activityDate !== undefined) set.activityDate = activityDate
  if (durationMinutes !== null && durationMinutes !== undefined) set.durationMinutes = durationMinutes
  if (notes !== null && notes !== undefined) set.notes = notes

  if (exerciseTypeId !== null && exerciseTypeId !== undefined) {
    const typeObjectId = db.toObjectId(exerciseTypeId)
    if (!typeObjectId) {
      const err = new Error('Invalid id')
      err.code = 'INVALID_ID'
      throw err
    }
    const typeDoc = await types.findOne({ _id: typeObjectId }, { projection: { _id: 1 } })
    if (!typeDoc) return null
    set.exerciseTypeId = typeObjectId
  }

  const result = await activities.updateOne({ _id: objectId, userId: userObjectId }, { $set: set })
  if (!result.matchedCount) return null
  return getActivityByIdForUser({ id, userId })
}

const deleteActivityForUser = async ({ id, userId }) => {
  const activities = db.getCollection('activities')
  const objectId = db.toObjectId(id)
  const userObjectId = db.toObjectId(userId)
  if (!objectId || !userObjectId) return false

  const result = await activities.deleteOne({ _id: objectId, userId: userObjectId })
  return Boolean(result.deletedCount)
}

const getWeeklySummaryForUser = async ({ userId, startDate }) => {
  const activities = db.getCollection('activities')
  const userObjectId = db.toObjectId(userId)
  if (!userObjectId) {
    const err = new Error('Invalid id')
    err.code = 'INVALID_ID'
    throw err
  }

  const start = String(startDate)
  const startDt = new Date(`${start}T00:00:00.000Z`)
  if (Number.isNaN(startDt.getTime())) {
    return null
  }
  const endDt = new Date(startDt)
  endDt.setUTCDate(endDt.getUTCDate() + 6)
  const end = endDt.toISOString().slice(0, 10)

  const docs = await activities
    .find({ userId: userObjectId, activityDate: { $gte: start, $lte: end } }, { projection: { durationMinutes: 1 } })
    .toArray()

  const totalWorkouts = docs.length
  const totalMinutes = docs.reduce((sum, d) => sum + (d.durationMinutes || 0), 0)
  const avgMinutes = totalWorkouts ? Math.round(totalMinutes / totalWorkouts) : 0

  return {
    start_date: start,
    end_date: end,
    total_workouts: totalWorkouts,
    total_minutes: totalMinutes,
    avg_minutes: avgMinutes,
  }
}

const getStreakForUser = async (userId) => {
  const activities = db.getCollection('activities')
  const userObjectId = db.toObjectId(userId)
  if (!userObjectId) {
    const err = new Error('Invalid id')
    err.code = 'INVALID_ID'
    throw err
  }

  const dates = await activities.distinct('activityDate', { userId: userObjectId })
  const dateSet = new Set(dates)

  let streak = 0
  let cursor = new Date()
  while (true) {
    const day = cursor.toISOString().slice(0, 10)
    if (!dateSet.has(day)) break
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return streak
}

const listFriendFeed = async ({ userId, limit = 20 }) => {
  const friends = db.getCollection('friends')
  const activities = db.getCollection('activities')
  const users = db.getCollection('users')
  const types = db.getCollection('exerciseTypes')

  const userObjectId = db.toObjectId(userId)
  if (!userObjectId) {
    const err = new Error('Invalid id')
    err.code = 'INVALID_ID'
    throw err
  }

  const edges = await friends.find({ userId: userObjectId }).toArray()
  const friendIds = edges.map((e) => e.friendUserId)
  if (friendIds.length === 0) return []

  const activityDocs = await activities
    .find({ userId: { $in: friendIds } })
    .sort({ activityDate: -1, _id: -1 })
    .limit(limit)
    .toArray()

  const neededUserIds = [...new Set(activityDocs.map((a) => a.userId.toString()))].map((id) => db.toObjectId(id))
  const neededTypeIds = [...new Set(activityDocs.map((a) => a.exerciseTypeId.toString()))].map((id) => db.toObjectId(id))

  const [userDocs, typeDocs] = await Promise.all([
    users.find({ _id: { $in: neededUserIds } }, { projection: { name: 1 } }).toArray(),
    types.find({ _id: { $in: neededTypeIds } }, { projection: { name: 1 } }).toArray(),
  ])

  const userNameById = new Map(userDocs.map((u) => [u._id.toString(), u.name]))
  const typeNameById = new Map(typeDocs.map((t) => [t._id.toString(), t.name]))

  return activityDocs.map((doc) => ({
    ...toActivity(doc, { exerciseTypeName: typeNameById.get(doc.exerciseTypeId.toString()) }),
    userName: userNameById.get(doc.userId.toString()) || 'Unknown',
  }))
}

module.exports = {
  createActivity,
  getActivityByIdForUser,
  listActivitiesForUser,
  updateActivityForUser,
  deleteActivityForUser,
  getWeeklySummaryForUser,
  getStreakForUser,
  listFriendFeed,
}
