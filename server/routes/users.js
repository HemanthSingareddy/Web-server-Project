const express = require('express')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const usersController = require('../controllers/usersController')

const router = express.Router()

router.get('/people', requireAuth, usersController.listPeople)

router.use(requireAdmin)
router.get('/', usersController.listUsers)
router.get('/:id', usersController.getUser)
router.put('/:id', usersController.updateUser)
router.delete('/:id', usersController.deleteUser)

module.exports = router
