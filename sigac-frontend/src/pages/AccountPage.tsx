import React, { useRef, useState } from 'react'

export default function AccountPage() {
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const [avatarUrl, setAvatarUrl] = useState<string | null>(localStorage.getItem('userAvatar'))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [nomComplet, setNomComplet] = useState(user?.nomComplet || '')
  const [email, setEmail] = useState(user?.email || '')

  function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 2 MB')
      return
    }

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image')
      return
    }

    // Upload vers le backend
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('token')
    fetch('http://localhost:5210/api/users/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.avatarUrl) {
          const fullUrl = `http://localhost:5210${data.avatarUrl}`
          setAvatarUrl(fullUrl)
          localStorage.setItem('userAvatar', fullUrl)
          // Mettre à jour l'objet user
          if (user) {
            user.avatarUrl = fullUrl
            localStorage.setItem('user', JSON.stringify(user))
          }
          // Déclencher un événement pour synchroniser avec App.tsx
          window.dispatchEvent(new Event('storage'))
          alert('Avatar mis à jour avec succès!')
        }
      })
      .catch(err => {
        console.error(err)
        alert('Erreur lors de l\'upload de l\'avatar')
      })
  }

  function handleRemoveAvatar() {
    setAvatarUrl(null)
    localStorage.removeItem('userAvatar')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSaveProfile() {
    const token = localStorage.getItem('token')
    
    fetch('http://localhost:5210/api/users/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nomComplet,
        email
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.nomComplet) {
          // Mettre à jour l'objet user
          if (user) {
            user.nomComplet = data.nomComplet
            user.email = data.email
            localStorage.setItem('user', JSON.stringify(user))
          }
          // Déclencher un événement pour synchroniser avec App.tsx
          window.dispatchEvent(new Event('storage'))
          alert('Profil mis à jour avec succès!')
          setIsEditing(false)
        }
      })
      .catch(err => {
        console.error(err)
        alert('Erreur lors de la mise à jour du profil')
      })
  }

  return (
    <div className="page" style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>⚙️ Mon compte</h2>
      {!user && <div>Utilisateur non connecté.</div>}
      {user && (
        <div className="card" style={{ maxWidth: 720, padding: 24 }}>
          {/* Avatar Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <div 
              onClick={handleAvatarClick}
              style={{ 
                position: 'relative',
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 700,
                fontSize: 32,
                color: 'white',
                cursor: 'pointer',
                border: '4px solid #e2e8f0',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
              className="avatar-upload-hover"
            >
              {!avatarUrl && (
                <span>{((user.nomComplet || user.username)?.[0] || '').toUpperCase()}{((user.nomComplet || user.username)?.[1] || '').toUpperCase()}</span>
              )}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                fontSize: 14,
                fontWeight: 600
              }} className="avatar-overlay">
                📷 Modifier
              </div>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="btn" onClick={handleAvatarClick} style={{ fontSize: 13, padding: '6px 12px' }}>
                📁 Choisir une image
              </button>
              {avatarUrl && (
                <button className="btn" onClick={handleRemoveAvatar} style={{ fontSize: 13, padding: '6px 12px', background: '#ef4444', color: 'white' }}>
                  🗑️ Supprimer
                </button>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
            {!isEditing ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Nom complet</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{user.nomComplet || user.username}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Email</div>
                  <div style={{ fontSize: 16 }}>{user.email || '—'}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Nom d'utilisateur</div>
                  <div style={{ fontSize: 16 }}>{user.username}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Rôle</div>
                  <span className="badge" style={{ background: '#ddd6fe', color: '#5b21b6', fontSize: 12, padding: '4px 10px' }}>{user.role}</span>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Matricule</div>
                  <div style={{ fontSize: 16 }}>{user.matricule || '—'}</div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Dernière connexion</div>
                  <div style={{ fontSize: 16 }}>{user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : '—'}</div>
                </div>
                <button className="btn" onClick={() => setIsEditing(true)} style={{ background: '#3b82f6', color: 'white' }}>
                  ✏️ Modifier mes informations
                </button>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block' }}>Nom complet</label>
                  <input 
                    type="text" 
                    value={nomComplet}
                    onChange={(e) => setNomComplet(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block' }}>Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn" onClick={handleSaveProfile} style={{ background: '#10b981', color: 'white' }}>
                    💾 Enregistrer
                  </button>
                  <button className="btn" onClick={() => setIsEditing(false)} style={{ background: '#64748b', color: 'white' }}>
                    ❌ Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .avatar-upload-hover:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 20px rgba(0,0,0,0.25) !important;
        }
        .avatar-upload-hover:hover .avatar-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}
