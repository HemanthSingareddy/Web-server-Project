const express = require('express')
const rateLimit = require('express-rate-limit')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const usersController = require('../controllers/usersController')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

const peopleLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

router.get('/people', peopleLimiter, requireAuth, asyncHandler(usersController.listPeople))

router.use(requireAdmin)
router.get('/', asyncHandler(usersController.listUsers))
router.get('/:id', asyncHandler(usersController.getUser))
router.put('/:id', asyncHandler(usersController.updateUser))
router.delete('/:id', asyncHandler(usersController.deleteUser))

module.exports = router
