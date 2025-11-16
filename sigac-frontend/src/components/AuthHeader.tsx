import React, { useEffect, useState } from 'react'
import api from '../api/api-client'

export default function AuthHeader() {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchUser() {
      try {
        const resp = await api.get('/Auth/me')
        if (mounted) setUser(resp.data)
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Impossible de récupérer le profil')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchUser()
    return () => { mounted = false }
  }, [])

  async function logout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      await api.post('/Auth/logout', { refreshToken })
    } catch (e) {
      // ignore errors on logout
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.reload()
    }
  }

  if (loading) return <div className="auth-header">Chargement...</div>
  if (error) return <div className="auth-header">Erreur: {error}</div>

  return (
    <div className="auth-header">
      <span>Connecté en tant que: <strong>{user?.username ?? user?.email}</strong> ({user?.role})</span>
      <button style={{ marginLeft: 12 }} onClick={logout}>Déconnexion</button>
    </div>
  )
}
