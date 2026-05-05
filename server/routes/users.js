const express = require('express')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const usersController = require('../controllers/usersController')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

router.get('/people', requireAuth, asyncHandler(usersController.listPeople))

router.use(requireAdmin)
router.get('/', asyncHandler(usersController.listUsers))
router.get('/:id', asyncHandler(usersController.getUser))
router.put('/:id', asyncHandler(usersController.updateUser))
router.delete('/:id', asyncHandler(usersController.deleteUser))

module.exports = router
