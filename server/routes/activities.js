const express = require('express')
const { requireAuth } = require('../middleware/auth')
const activitiesController = require('../controllers/activitiesController')

const router = express.Router()

router.use(requireAuth)

router.get('/', activitiesController.listActivities)
router.post('/', activitiesController.createActivity)
router.get('/summary/weekly', activitiesController.getWeeklySummary)
router.get('/streak', activitiesController.getStreak)
router.get('/feed/friends', activitiesController.getFriendFeed)
router.get('/:id', activitiesController.getActivity)
router.put('/:id', activitiesController.updateActivity)
router.delete('/:id', activitiesController.deleteActivity)

module.exports = router
