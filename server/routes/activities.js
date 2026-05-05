const express = require('express')
const { requireAuth } = require('../middleware/auth')
const activitiesController = require('../controllers/activitiesController')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

router.use(requireAuth)

router.get('/', asyncHandler(activitiesController.listActivities))
router.post('/', asyncHandler(activitiesController.createActivity))
router.get('/summary/weekly', asyncHandler(activitiesController.getWeeklySummary))
router.get('/streak', asyncHandler(activitiesController.getStreak))
router.get('/feed/friends', asyncHandler(activitiesController.getFriendFeed))
router.get('/:id', asyncHandler(activitiesController.getActivity))
router.put('/:id', asyncHandler(activitiesController.updateActivity))
router.delete('/:id', asyncHandler(activitiesController.deleteActivity))

module.exports = router
