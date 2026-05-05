const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'

class ApiError extends Error {
  constructor(status, details) {
    super(details.error || 'Unknown error')
    this.status = status
    this.details = details
  }
}

export const apiRequest = async (path, { method = 'GET', token, body } = {}) => {
  const url = `${API_BASE}${path}`
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (token) {
    options.headers.Authorization = `Bearer ${token}`
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(url, options)
  const data = await res.json()

  if (!res.ok) {
    throw new ApiError(res.status, data)
  }

  return data
}
