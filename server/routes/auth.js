const express = require('express')
const rateLimit = require('express-rate-limit')
const authController = require('../controllers/authController')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

router.post('/register', authLimiter, asyncHandler(authController.register))
router.post('/login', authLimiter, asyncHandler(authController.login))
router.get('/me', require('../middleware/auth').requireAuth, asyncHandler(authController.me))

module.exports = router
