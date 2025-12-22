import React, { useState, useEffect } from 'react'
import { useToast } from '../components/common/ToastProvider'

export default function LogoManagementPage() {
  const { notify } = useToast()
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  // Charger le logo depuis l'API au montage
  useEffect(() => {
    loadLogo()
  }, [])

  const loadLogo = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://sigac-api.onrender.com/api'}/system/logo`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPreview(data.logoBase64)
      }
    } catch (error: any) {
      console.error('Erreur chargement logo:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation
    if (file.size > 1024 * 1024) {
      notify({ type: 'error', message: '❌ Le fichier est trop volumineux (max 1MB)' })
      return
    }

    if (!file.type.startsWith('image/')) {
      notify({ type: 'error', message: '❌ Veuillez sélectionner une image' })
      return
    }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        
        // Envoyer à l'API
        const token = localStorage.getItem('token')
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://sigac-api.onrender.com/api'}/system/logo`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ logoBase64: base64 })
        })

        if (response.ok) {
          const data = await response.json()
          setPreview(data.logoBase64)
          notify({ type: 'success', message: '✅ Logo mis à jour avec succès dans la base de données' })
          
          // Déclencher un événement pour mettre à jour tous les composants Logo
          window.dispatchEvent(new Event('logoUpdated'))
        } else {
          const error = await response.json()
          notify({ type: 'error', message: `❌ Erreur: ${error.message || 'Échec de la mise à jour'}` })
        }
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      notify({ type: 'error', message: `❌ Erreur: ${error?.message}` })
    } finally {
      setUploading(false)
    }
  }

  const handleReset = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser le logo par défaut?')) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://sigac-api.onrender.com/api'}/system/logo`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          setPreview(null)
          notify({ type: 'success', message: '✅ Logo réinitialisé' })
          
          // Déclencher un événement pour mettre à jour tous les composants Logo
          window.dispatchEvent(new Event('logoUpdated'))
        } else {
          notify({ type: 'error', message: '❌ Erreur lors de la réinitialisation' })
        }
      } catch (error: any) {
        notify({ type: 'error', message: `❌ Erreur: ${error?.message}` })
      }
    }
  }

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-title">🎨 Gestion du Logo</div>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <p>⏳ Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="panel-title">🎨 Gestion du Logo</div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ padding: 20, background: '#f5f5f5', borderRadius: 8, marginBottom: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 10 }}>Aperçu actuel:</h3>
            {preview ? (
              <img
                src={preview}
                alt="Logo preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  objectFit: 'contain',
                  border: '2px solid #ddd',
                  padding: 10,
                  borderRadius: 4,
                }}
              />
            ) : (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  background: 'white',
                  borderRadius: 4,
                  color: '#999',
                }}
              >
                📭 Aucun logo personnalisé (utilisation du logo par défaut)
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="logoUpload" className="btn" style={{ cursor: 'pointer', display: 'inline-block' }}>
              {uploading ? '⏳ Téléchargement...' : '📤 Télécharger un logo'}
            </label>
            <input
              id="logoUpload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </div>

          {preview && (
            <button
              className="btn"
              onClick={handleReset}
              style={{
                background: '#dc2626',
                color: 'white',
              }}
            >
              🔄 Réinitialiser au logo par défaut
            </button>
          )}
        </div>

        <div style={{ padding: 15, background: '#e3f2fd', borderRadius: 8, fontSize: 13 }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 600 }}>ℹ️ Informations:</p>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
            <li>Format accepté: PNG, JPG, SVG, etc.</li>
            <li>Taille maximale: 1 MB</li>
            <li>Le logo est stocké dans la base de données PostgreSQL</li>
            <li>Changement de logo s'applique immédiatement à tous les écrans</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
