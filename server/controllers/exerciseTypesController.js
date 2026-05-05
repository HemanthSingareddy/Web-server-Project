const exerciseTypesModel = require('../models/exerciseTypesModel')

const listExerciseTypes = async (req, res) => {
  const types = await exerciseTypesModel.listExerciseTypes()
  return res.json({ types })
}

const getExerciseType = async (req, res) => {
  const { id } = req.params
  const type = await exerciseTypesModel.getExerciseTypeById(id)
  if (!type) {
    return res.status(404).json({ error: 'Exercise type not found' })
  }
  return res.json({ type })
}

const createExerciseType = async (req, res) => {
  const { name, description } = req.body
  if (!name) {
    return res.status(400).json({ error: 'Missing name' })
  }

  try {
    const type = await exerciseTypesModel.createExerciseType({
      name,
      description: description || null,
      createdByUserId: req.user?.id,
    })
    return res.status(201).json({ type })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Exercise type already exists' })
    }
    throw err
  }
}

const updateExerciseType = async (req, res) => {
  const { id } = req.params
  const { name, description } = req.body

  const updated = await exerciseTypesModel.updateExerciseType({ id, name, description })
  if (!updated) {
    return res.status(404).json({ error: 'Exercise type not found' })
  }
  return res.json({ type: updated })
}

const deleteExerciseType = async (req, res) => {
  const { id } = req.params

  try {
    const deleted = await exerciseTypesModel.deleteExerciseType(id)
    if (!deleted) {
      return res.status(404).json({ error: 'Exercise type not found' })
    }
    return res.json({ success: true })
  } catch (err) {
    if (err.code === 'TYPE_IN_USE') {
      return res.status(409).json({ error: err.message })
    }
    throw err
  }
}

module.exports = {
  listExerciseTypes,
  getExerciseType,
  createExerciseType,
  updateExerciseType,
  deleteExerciseType,
}
