const requireEnv = (key) => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value
}

const getEnv = () => {
  const nodeEnv = process.env.NODE_ENV || 'development'

  return {
    nodeEnv,
    isProd: nodeEnv === 'production',
    port: Number(process.env.PORT || 3000),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    mongoUri: requireEnv('MONGODB_URI'),
    mongoDbName: process.env.MONGODB_DB_NAME || 'get_fit_buddy',
    jwtSecret: requireEnv('JWT_SECRET'),
  }
}

module.exports = { getEnv }
