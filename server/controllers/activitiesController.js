const activitiesModel = require('../models/activitiesModel')

const listActivities = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const activities = await activitiesModel.listActivitiesForUser(userId)
  return res.json({ activities })
}

const getActivity = async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const activity = await activitiesModel.getActivityByIdForUser({ id, userId })
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' })
  }
  return res.json({ activity })
}

const createActivity = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { date, exerciseTypeId, durationMinutes, notes } = req.body
  if (!date || !exerciseTypeId || typeof durationMinutes !== 'number') {
    return res.status(400).json({ error: 'Missing or invalid required fields' })
  }
  if (durationMinutes <= 0) {
    return res.status(400).json({ error: 'durationMinutes must be positive' })
  }

  try {
    const activity = await activitiesModel.createActivity({
      userId,
      activityDate: date,
      exerciseTypeId,
      durationMinutes,
      notes: notes || null,
    })
    return res.status(201).json({ activity })
  } catch (err) {
    if (err.code === 'INVALID_ID') {
      return res.status(400).json({ error: 'Invalid exerciseTypeId' })
    }
    throw err
  }
}

const updateActivity = async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { date, exerciseTypeId, durationMinutes, notes } = req.body
  if (durationMinutes !== null && durationMinutes !== undefined && durationMinutes <= 0) {
    return res.status(400).json({ error: 'durationMinutes must be positive' })
  }

  try {
    const activity = await activitiesModel.updateActivityForUser({
      id,
      userId,
      activityDate: date,
      exerciseTypeId,
      durationMinutes,
      notes,
    })
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' })
    }
    return res.json({ activity })
  } catch (err) {
    if (err.code === 'INVALID_ID') {
      return res.status(400).json({ error: 'Invalid exerciseTypeId' })
    }
    throw err
  }
}

const deleteActivity = async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const deleted = await activitiesModel.deleteActivityForUser({ id, userId })
  if (!deleted) {
    return res.status(404).json({ error: 'Activity not found' })
  }
  return res.json({ success: true })
}

const getWeeklySummary = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { start } = req.query
  if (!start) {
    return res.status(400).json({ error: 'Missing start date' })
  }

  const summary = await activitiesModel.getWeeklySummaryForUser({ userId, startDate: start })
  if (!summary) {
    return res.status(400).json({ error: 'Invalid date format' })
  }
  return res.json({ summary })
}

const getStreak = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const streak = await activitiesModel.getStreakForUser(userId)
  return res.json({ streak })
}

const getFriendFeed = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { limit = 20 } = req.query
  const feed = await activitiesModel.listFriendFeed({ userId, limit: Number(limit) })
  return res.json({ feed })
}

module.exports = {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  getWeeklySummary,
  getStreak,
  getFriendFeed,
}
