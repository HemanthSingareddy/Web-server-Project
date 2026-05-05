const express = require('express')
const authRoutes = require('./auth')
const usersRoutes = require('./users')
const exerciseTypesRoutes = require('./exerciseTypes')
const activitiesRoutes = require('./activities')
const friendsRoutes = require('./friends')

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/users', usersRoutes)
router.use('/exercise-types', exerciseTypesRoutes)
router.use('/activities', activitiesRoutes)
router.use('/friends', friendsRoutes)

module.exports = router
