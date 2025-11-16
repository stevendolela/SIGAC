import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const timeout = Number(import.meta.env.VITE_API_TIMEOUT ?? 30000)

const api = axios.create({
  baseURL,
  timeout
})

// Attach Bearer token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Auto-refresh token on 401 once
let isRefreshing = false
let pendingRequests: Array<(token: string | null) => void> = []

async function refreshToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      pendingRequests.push((t) => resolve(t))
    })
  }
  isRefreshing = true
  try {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return null
    const resp = await api.post('/Auth/refresh', { refreshToken })
    const data = resp.data
    const newToken = data?.token as string | undefined
    const newRefresh = data?.refreshToken as string | undefined
    if (newToken) localStorage.setItem('token', newToken)
    if (newRefresh) localStorage.setItem('refreshToken', newRefresh)
    return newToken ?? null
  } catch (e) {
    return null
  } finally {
    isRefreshing = false
    const token = localStorage.getItem('token')
    pendingRequests.forEach((cb) => cb(token))
    pendingRequests = []
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const newToken = await refreshToken()
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return api(originalRequest)
      } else {
        // logout
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        // best effort redirect
        if (typeof window !== 'undefined') window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default api
