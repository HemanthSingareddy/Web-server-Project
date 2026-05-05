const path = require('path')
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const { getEnv } = require('./config/env')
const db = require('./db')
const apiRoutes = require('./routes')

const start = async () => {
  const env = getEnv()
  await db.initDb({ mongoUri: env.mongoUri, dbName: env.mongoDbName })
  await db.ensureIndexes()

  const app = express()

  app.use(cors({ origin: env.corsOrigin, credentials: false }))
  app.use(express.json())

  app.use('/api', apiRoutes)

  // Serve the built Vue app when deployed as a single Render service.
  if (env.isProd) {
    const clientDist = path.join(__dirname, '..', 'get-fit-buddy', 'dist')
    app.use(express.static(clientDist))
    app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')))
  }

  // Error handler
  app.use((err, _req, res, _next) => {
    console.error(err)
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Duplicate value' })
    }
    if (err?.code === 'TYPE_IN_USE') {
      return res.status(409).json({ error: 'Exercise type is in use by activities' })
    }
    if (err?.code === 'INVALID_ID') {
      return res.status(400).json({ error: 'Invalid id' })
    }
    return res.status(500).json({ error: 'Server error' })
  })

  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
})
