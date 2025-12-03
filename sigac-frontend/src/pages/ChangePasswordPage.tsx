import React, { useState } from 'react'

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (next.length < 8) { setMsg('Le nouveau mot de passe doit contenir au moins 8 caractères'); return }
    if (next !== confirm) { setMsg('Les mots de passe ne correspondent pas'); return }
    // TODO: appeler l’API backend /api/auth/change-password
    setMsg('Mot de passe mis à jour (démo)')
  }

  return (
    <div className="page" style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>🔐 Changer le mot de passe</h2>
      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <div style={{ fontSize: 13, marginBottom: 4 }}>Mot de passe actuel</div>
          <input type="password" value={current} onChange={e => setCurrent(e.target.value)} className="input" />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <div style={{ fontSize: 13, marginBottom: 4 }}>Nouveau mot de passe</div>
          <input type="password" value={next} onChange={e => setNext(e.target.value)} className="input" />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 4 }}>Confirmer le mot de passe</div>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input" />
        </label>
        {msg && <div style={{ marginBottom: 10, color: '#0f766e' }}>{msg}</div>}
        <button className="btn" type="submit" style={{ background: '#0ea5e9', color: 'white' }}>Mettre à jour</button>
      </form>
    </div>
  )
}
