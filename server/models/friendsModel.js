const db = require('../db')

const toFriend = (doc) => ({
  id: doc._id.toString(),
  userId: doc.userId.toString(),
  friendUserId: doc.friendUserId.toString(),
  createdAt: doc.createdAt,
})

const listFriendsForUser = async (userId) => {
  const friends = db.getCollection('friends')
  const users = db.getCollection('users')

  const userObjectId = db.toObjectId(userId)
  if (!userObjectId) {
    const err = new Error('Invalid id')
    err.code = 'INVALID_ID'
    throw err
  }

  const friendEdges = await friends.find({ userId: userObjectId }).toArray()
  const friendIds = friendEdges.map((e) => e.friendUserId)
  if (friendIds.length === 0) return []

  const friendUsers = await users.find({ _id: { $in: friendIds } }, { projection: { name: 1 } }).toArray()
  return friendUsers.map((u) => ({
    id: u._id.toString(),
    name: u.name,
  }))
}

const addFriend = async ({ userId, friendUserId }) => {
  const userObjectId = db.toObjectId(userId)
  const friendObjectId = db.toObjectId(friendUserId)

  if (!userObjectId || !friendObjectId) {
    const err = new Error('Invalid id')
    err.code = 'INVALID_ID'
    throw err
  }

  if (userObjectId.equals(friendObjectId)) {
    return { error: 'You cannot friend yourself' }
  }

  const friends = db.getCollection('friends')
  const now = new Date()

  await friends.updateOne(
    { userId: userObjectId, friendUserId: friendObjectId },
    {
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  )

  const edge = await friends.findOne({ userId: userObjectId, friendUserId: friendObjectId })
  return toFriend(edge)
}

const removeFriend = async ({ userId, friendUserId }) => {
  const userObjectId = db.toObjectId(userId)
  const friendObjectId = db.toObjectId(friendUserId)

  if (!userObjectId || !friendObjectId) {
    const err = new Error('Invalid id')
    err.code = 'INVALID_ID'
    throw err
  }

  const friends = db.getCollection('friends')
  const result = await friends.deleteOne({
    userId: userObjectId,
    friendUserId: friendObjectId,
  })
  return Boolean(result.deletedCount)
}

module.exports = {
  listFriendsForUser,
  addFriend,
  removeFriend,
}
