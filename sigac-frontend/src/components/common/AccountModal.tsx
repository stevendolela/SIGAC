import React, { useRef, useState } from 'react'
import { ChangePasswordModal } from './ChangePasswordModal'
import { formatRoleShort } from '../../utils/roleUtils'

interface AccountModalProps {
  onClose: () => void
}

export default function AccountModal({ onClose }: AccountModalProps) {
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const [avatarUrl, setAvatarUrl] = useState<string | null>(localStorage.getItem('userAvatar'))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [nomComplet, setNomComplet] = useState(user?.nomComplet || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '')
  const [showChangePassword, setShowChangePassword] = useState(false)

  function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 2 MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image')
      return
    }

    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('file', file)

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
          window.dispatchEvent(new Event('storage'))
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
    window.dispatchEvent(new Event('storage'))
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
        email,
        phoneNumber
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.nomComplet) {
          if (user) {
            user.nomComplet = data.nomComplet
            user.email = data.email
            localStorage.setItem('user', JSON.stringify(user))
          }
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Mon compte</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          {!user && <div>Utilisateur non connecté.</div>}
          {user && (
            <>
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
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Téléphone</div>
                      <div style={{ fontSize: 16 }}>{user.phoneNumber || '—'}</div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Nom d'utilisateur</div>
                      <div style={{ fontSize: 16 }}>{user.username}</div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Rôle</div>
                      <span className="badge" style={{ background: '#ddd6fe', color: '#5b21b6', fontSize: 12, padding: '4px 10px' }}>{formatRoleShort(user.role)}</span>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Matricule</div>
                      <div style={{ fontSize: 16 }}>{user.matricule || '—'}</div>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Dernière connexion</div>
                      <div style={{ fontSize: 16 }}>{user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : '—'}</div>
                    </div>
                    <button className="btn" onClick={() => setIsEditing(true)} style={{ background: '#3b82f6', color: 'white', width: '100%' }}>
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
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block' }}>Téléphone</label>
                      <input 
                        type="tel" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+243999999999"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn" onClick={handleSaveProfile} style={{ background: '#10b981', color: 'white', flex: 1 }}>
                        💾 Enregistrer
                      </button>
                      <button className="btn" onClick={() => setIsEditing(false)} style={{ background: '#64748b', color: 'white', flex: 1 }}>
                        ❌ Annuler
                      </button>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <button className="btn" onClick={() => setShowChangePassword(true)} style={{ background: '#1f2937', color: 'white', width: '100%' }}>
                        🔐 Changer mon mot de passe
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        {showChangePassword && (
          <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
        )}
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .account-modal {
          width: 600px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
        }
        .modal-close {
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .modal-close:hover {
          background: #f3f4f6;
          color: #111827;
        }
        .modal-body {
          padding: 24px;
        }
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
