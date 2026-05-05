const friendsModel = require('../models/friendsModel')

const listFriends = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const friends = await friendsModel.listFriendsForUser(userId)
  return res.json({ friends })
}

const addFriend = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { friendUserId } = req.body
  if (!friendUserId) {
    return res.status(400).json({ error: 'Missing friendUserId' })
  }

  try {
    const result = await friendsModel.addFriend({ userId, friendUserId })
    if (result.error) {
      return res.status(400).json({ error: result.error })
    }
    return res.status(201).json({ friend: result })
  } catch (err) {
    if (err.code === 'INVALID_ID') {
      return res.status(400).json({ error: 'Invalid id' })
    }
    throw err
  }
}

const removeFriend = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { friendUserId } = req.body
  if (!friendUserId) {
    return res.status(400).json({ error: 'Missing friendUserId' })
  }

  try {
    const deleted = await friendsModel.removeFriend({ userId, friendUserId })
    if (!deleted) {
      return res.status(404).json({ error: 'Friend not found' })
    }
    return res.json({ success: true })
  } catch (err) {
    if (err.code === 'INVALID_ID') {
      return res.status(400).json({ error: 'Invalid id' })
    }
    throw err
  }
}

module.exports = {
  listFriends,
  addFriend,
  removeFriend,
}
