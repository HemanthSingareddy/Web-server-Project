const usersModel = require('../models/usersModel')
const db = require('../db')

const listUsers = async (req, res) => {
  const users = await usersModel.listUsers()
  return res.json({ users })
}

const getUser = async (req, res) => {
  const { id } = req.params
  const user = await usersModel.getUserById(id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  return res.json({ user })
}

const updateUser = async (req, res) => {
  const { id } = req.params
  const { name, role } = req.body

  const updated = await usersModel.updateUser({ id, name, role })
  if (!updated) {
    return res.status(404).json({ error: 'User not found' })
  }
  return res.json({ user: updated })
}

const deleteUser = async (req, res) => {
  const { id } = req.params
  const deleted = await usersModel.deleteUser(id)
  if (!deleted) {
    return res.status(404).json({ error: 'User not found' })
  }
  return res.json({ success: true })
}

const listPeople = async (req, res) => {
  const excludeUserId = req.user?.id
  if (!excludeUserId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const people = await usersModel.listPeople({ excludeUserId })
  return res.json({ people })
}

module.exports = {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  listPeople,
}
