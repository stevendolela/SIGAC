import React, { useState } from 'react'
import api from '../api/api-client'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const resp = await api.post('/Auth/login', { username, password })
      const data = resp.data
      localStorage.setItem('token', data.token)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.location.reload()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ marginBottom: 8 }}>Taajii GED</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>
            Gestion Électronique des Dossiers
          </p>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Nom d'utilisateur</label>
            <input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="message error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ 
          marginTop: 24, 
          paddingTop: 24, 
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          fontSize: 12,
          color: '#9ca3af'
        }}>
          Taji@2025
        </div>
      </div>
    </div>
  )
}
