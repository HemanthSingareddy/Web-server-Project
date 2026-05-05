const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { getEnv } = require('../config/env')
const usersModel = require('../models/usersModel')
const db = require('../db')

const signJwt = (userId, role, name, email) => {
  const { jwtSecret } = getEnv()
  return jwt.sign(
    {
      sub: userId,
      role,
      name,
      email,
    },
    jwtSecret,
    { expiresIn: '7 days' }
  )
}

const register = async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const count = await usersModel.countUsers()
  const role = count === 0 ? 'admin' : 'user'

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await usersModel.createUser({ name, email, passwordHash, role })
    const token = signJwt(user.id, user.role, user.name, user.email)
    return res.status(201).json({ user, token })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' })
    }
    throw err
  }
}

const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' })
  }

  const userRow = await usersModel.getUserByEmailWithPassword(email)
  if (!userRow) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const passwordMatch = await bcrypt.compare(password, userRow.password_hash)
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = signJwt(userRow.id, userRow.role, userRow.name, userRow.email)
  const user = {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    role: userRow.role,
  }
  return res.status(200).json({ user, token })
}

const me = async (req, res) => {
  const { id, role, name, email } = req.user

  const objectId = db.toObjectId(id)
  if (!objectId) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const currentUser = await usersModel.getUserById(id)
  if (!currentUser) {
    return res.status(401).json({ error: 'User not found' })
  }

  return res.json({
    user: {
      id,
      name,
      email,
      role,
      createdAt: currentUser.createdAt,
    },
    token: req.headers.authorization?.split(' ')[1],
  })
}

module.exports = { register, login, me }
