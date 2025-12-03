import axios from 'axios'

// Détermination de la base URL API avec normalisation du suffixe '/api'
function normalizeBaseUrl(raw?: string): string {
  const fallback = 'http://localhost:5210/api'
  let url = (raw && raw.trim()) ? raw.trim() : fallback
  // Si l'URL se termine déjà par '/api' ou contient '/api/' comme chemin terminal, on garde
  // Sinon on ajoute proprement '/api'
  try {
    const u = new URL(url.includes('://') ? url : `http://${url}`)
    // Reconstituer sans double slash
    if (!u.pathname.match(/\/api\/?$/)) {
      u.pathname = (u.pathname.replace(/\/$/, '') + '/api')
    }
    url = u.origin + u.pathname
  } catch {
    // Fallback simple si URL invalide
    if (!url.endsWith('/api')) url = url.replace(/\/$/, '') + '/api'
  }
  return url
}

const envBaseRaw = import.meta.env.VITE_API_URL || 'http://localhost:5210/api'
const storedBaseRaw = typeof window !== 'undefined' ? (localStorage.getItem('apiBaseUrl') || '') : ''
const baseURL = normalizeBaseUrl(storedBaseRaw || envBaseRaw)
const timeout = Number(import.meta.env.VITE_API_TIMEOUT ?? 30000)

const api = axios.create({
  baseURL,
  timeout
})

export function getApiBaseUrl(): string {
  return api.defaults.baseURL || baseURL
}

export function setApiBaseUrl(url: string) {
  const normalized = normalizeBaseUrl(url)
  api.defaults.baseURL = normalized
  try { localStorage.setItem('apiBaseUrl', normalized) } catch {}
}

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
