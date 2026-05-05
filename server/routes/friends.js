const express = require('express')
const { requireAuth } = require('../middleware/auth')
const friendsController = require('../controllers/friendsController')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

router.use(requireAuth)

router.get('/', asyncHandler(friendsController.listFriends))
router.post('/', asyncHandler(friendsController.addFriend))
router.delete('/', asyncHandler(friendsController.removeFriend))

module.exports = router
