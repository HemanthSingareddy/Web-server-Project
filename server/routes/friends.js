const express = require('express')
const { requireAuth } = require('../middleware/auth')
const friendsController = require('../controllers/friendsController')

const router = express.Router()

router.use(requireAuth)

router.get('/', friendsController.listFriends)
router.post('/', friendsController.addFriend)
router.delete('/', friendsController.removeFriend)

module.exports = router
