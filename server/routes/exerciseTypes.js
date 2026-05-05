const express = require('express')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const exerciseTypesController = require('../controllers/exerciseTypesController')

const router = express.Router()

router.get('/', exerciseTypesController.listExerciseTypes)
router.get('/:id', exerciseTypesController.getExerciseType)

router.use(requireAuth)
router.post('/', requireAdmin, exerciseTypesController.createExerciseType)
router.put('/:id', requireAdmin, exerciseTypesController.updateExerciseType)
router.delete('/:id', requireAdmin, exerciseTypesController.deleteExerciseType)

module.exports = router
