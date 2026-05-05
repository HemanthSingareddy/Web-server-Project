const express = require('express')
const authController = require('../controllers/authController')

const router = express.Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/me', require('../middleware/auth').requireAuth, authController.me)

module.exports = router
