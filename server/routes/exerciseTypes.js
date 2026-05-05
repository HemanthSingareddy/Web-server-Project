const express = require('express')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const exerciseTypesController = require('../controllers/exerciseTypesController')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

router.get('/', asyncHandler(exerciseTypesController.listExerciseTypes))
router.get('/:id', asyncHandler(exerciseTypesController.getExerciseType))

router.use(requireAuth)
router.post('/', requireAdmin, asyncHandler(exerciseTypesController.createExerciseType))
router.put('/:id', requireAdmin, asyncHandler(exerciseTypesController.updateExerciseType))
router.delete('/:id', requireAdmin, asyncHandler(exerciseTypesController.deleteExerciseType))

module.exports = router
