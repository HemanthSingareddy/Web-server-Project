const express = require('express')
const rateLimit = require('express-rate-limit')
const authController = require('../controllers/authController')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

// Strict limiter for unauthenticated credential endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

// Permissive limiter for the session-check endpoint (called frequently by the SPA)
const meLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

router.post('/register', authLimiter, asyncHandler(authController.register))
router.post('/login', authLimiter, asyncHandler(authController.login))
router.get('/me', meLimiter, require('../middleware/auth').requireAuth, asyncHandler(authController.me))

module.exports = router
