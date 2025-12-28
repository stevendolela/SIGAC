import { useState } from 'react'
import api from '../api/api-client'
import { useToast } from '../components/common/ToastProvider'
import { TypeAffaireSelect } from '../components/dossiers/TypeAffaireSelect'
import type { AxiosProgressEvent } from 'axios'
import type { DocumentDto } from '../types/document'

export default function CreateDossierPage({ onSuccess }: { onSuccess?: () => void }) {
  const { notify } = useToast()
  const [loading, setLoading] = useState(false)

  // States pour l'upload
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [lastUploaded, setLastUploaded] = useState<DocumentDto | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)

  // Champs du formulaire
  const [titre, setTitre] = useState('')
  const [typeAffaireId, setTypeAffaireId] = useState<string | null>(null)
  const [priorite, setPriorite] = useState('2') // PrioriteDossier (1:Basse,2:Normale,3:Haute,4:Urgente)
  const [demandeur, setDemandeur] = useState('')
  const [defendeur, setDefendeur] = useState('')
  const [resume, setResume] = useState('')
  const [dossierId, setDossierId] = useState<string | null>(null) // ID du dossier créé
  // Champs non supportés par le DTO backend retirés pour éviter 400: observations/dateDepot/dateAudience

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!titre.trim() || titre.trim().length < 10) {
      notify({ type: 'error', message: "⚠️ Le titre est obligatoire (min. 10 caractères)" })
      return
    }
    
    if (!typeAffaireId) {
      notify({ type: 'error', message: '⚠️ Le type d\'affaire est obligatoire' })
      return
    }

    if (!demandeur.trim() || demandeur.trim().length < 3) {
      notify({ type: 'error', message: '⚠️ Le demandeur est obligatoire (min. 3 caractères)' })
      return
    }

    setLoading(true)

    try {
      const payload = {
        // Le binder ASP.NET Core est case-insensitive; camelCase ok
        titre: titre.trim(),
        typeAffaireId: typeAffaireId, // string UUID - ASP.NET convertira en Guid
        priorite: Number(priorite), // 1-4
        demandeur: demandeur.trim(),
        defendeur: defendeur.trim() || null,
        resume: resume.trim() || null
      }

      console.log('📤 Envoi payload:', payload)
      const response = await api.post('/Dossiers', payload)
      
      notify({ type: 'success', message: `✅ Dossier créé avec succès: ${response.data.numeroDossier}` })
      
      // Sauvegarder l'ID du dossier pour l'upload
      setDossierId(response.data.id)
      
      // Réinitialiser le formulaire
  setTitre('')
  setTypeAffaireId(null)
  setPriorite('2')
      setDemandeur('')
      setDefendeur('')
      setResume('')
      

      if (onSuccess) onSuccess()
    } catch (error: any) {
      const status = error?.response?.status
      const serverMsg = error?.response?.data?.message
      const modelErrors: string[] | undefined = error?.response?.data?.errors
      
      // Log des erreurs pour debugging
      console.error(`❌ Erreur API (${status}):`, {
        status,
        serverMsg,
        modelErrors,
        fullResponse: error?.response?.data
      })
      
      notify({ 
        type: 'error', 
        message: serverMsg || (modelErrors?.length ? modelErrors.join('\n') : `Erreur ${status}: Impossible de créer le dossier`) 
      })
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
  setTitre('')
  setTypeAffaireId(null)
    setPriorite('2')
    setDemandeur('')
    setDefendeur('')
    setResume('')
    setDossierId(null)
    setFile(null)
    setUploadProgress(0)
    setLastUploaded(null)
  }

  // Fonctions d'upload
  const MAX_FILE_SIZE = 50 * 1024 * 1024
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg']

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      if (!allowedTypes.includes(droppedFile.type)) {
        notify({ type: 'error', message: 'Type de fichier non autorisé (PDF/JPG/PNG uniquement)' })
        return
      }
      if (droppedFile.size > MAX_FILE_SIZE) {
        notify({ type: 'error', message: 'Fichier trop volumineux (max 50MB)' })
        return
      }
      setFile(droppedFile)
      notify({ type: 'success', message: `Fichier "${droppedFile.name}" sélectionné` })
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!allowedTypes.includes(selectedFile.type)) {
        notify({ type: 'error', message: 'Type de fichier non autorisé (PDF/JPG/PNG uniquement)' })
        return
      }
      if (selectedFile.size > MAX_FILE_SIZE) {
        notify({ type: 'error', message: 'Fichier trop volumineux (max 50MB)' })
        return
      }
      setFile(selectedFile)
      notify({ type: 'success', message: `Fichier "${selectedFile.name}" sélectionné` })
    }
  }

  async function handleUpload() {
    if (!file) {
      notify({ type: 'error', message: 'Veuillez sélectionner un fichier' })
      return
    }

    if (!dossierId) {
      notify({ type: 'error', message: 'Créez d\'abord un dossier avant d\'uploader un document' })
      return
    }

    setUploadLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('typeDocument', 'Pièces justificatives')

    try {
      const response = await api.post(`/Documents/upload/${dossierId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          const percentCompleted = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
          setUploadProgress(percentCompleted)
        }
      })
      
      setLastUploaded(response.data)
      notify({ type: 'success', message: `✅ Document uploadé avec succès` })
      setFile(null)
      setUploadProgress(0)
    } catch (error: any) {
      notify({ type: 'error', message: error?.response?.data?.message || 'Erreur lors de l\'upload' })
    } finally {
      setUploadLoading(false)
    }
  }

  async function handleDeleteDocument() {
    if (!lastUploaded) return
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${lastUploaded.nomFichier}"?`)) {
      return
    }

    try {
      await api.delete(`/Documents/${lastUploaded.id}`)
      notify({ type: 'success', message: `✅ Document supprimé avec succès` })
      setLastUploaded(null)
    } catch (error: any) {
      notify({ type: 'error', message: error?.response?.data?.message || 'Erreur lors de la suppression' })
    }
  }

  return (
    <div className="panel">
      <div className="panel-title">📝 Créer un Nouveau Dossier</div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)' }}>
          
          {/* Informations Principales */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📋</span> Informations Principales
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label>Titre du Dossier *</label>
                <input
                  type="text"
                  placeholder="Ex: Projet Alpha - Déploiement infrastructure"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Catégorie *</label>
                <TypeAffaireSelect value={typeAffaireId} onChange={setTypeAffaireId} />
              </div>

              <div className="form-group">
                <label>Priorité</label>
                <select value={priorite} onChange={(e) => setPriorite(e.target.value)}>
                  <option value="1">⚪ Basse</option>
                  <option value="2">⚪ Normale</option>
                  <option value="3">� Haute</option>
                  <option value="4">🔴 Urgente</option>
                </select>
              </div>
              
            </div>
          </div>

          {/* Parties */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>👥</span> Parties
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label>Demandeur *</label>
                <input
                  type="text"
                  placeholder="Nom du demandeur"
                  value={demandeur}
                  onChange={(e) => setDemandeur(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Défendeur</label>
                <input
                  type="text"
                  placeholder="Nom du défendeur"
                  value={defendeur}
                  onChange={(e) => setDefendeur(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Détails */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📄</span> Détails du Dossier
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Résumé</label>
              <textarea
                placeholder="Résumé bref du dossier..."
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                rows={4}
                style={{ width: '100%', fontFamily: 'inherit' }}
              />
            </div>

            {/* Observations supprimé: non supporté par CreateDossierDto */}
          </div>

          {/* Aide */}
          <div style={{ 
            padding: 16, 
            background: 'rgba(59, 130, 246, 0.1)', 
            borderLeft: '4px solid #3b82f6',
            borderRadius: 8,
            marginBottom: 24
          }}>
            <div style={{ fontSize: 13, color: '#1e40af', fontWeight: 500, marginBottom: 4 }}>
              💡 Information
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              Les champs marqués d'un astérisque (*) sont obligatoires. Le numéro de dossier sera généré automatiquement lors de la création.
            </div>
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn" 
              onClick={handleReset}
              disabled={loading}
              style={{ 
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', 
                color: 'white', 
                border: 'none' 
              }}
            >
              🔄 Réinitialiser
            </button>
            <button 
              type="submit" 
              className="btn" 
              disabled={loading}
              style={{ minWidth: 160 }}
            >
              {loading ? '⏳ Création en cours...' : '✅ Créer le Dossier'}
            </button>
          </div>
        </div>

        {/* Section Upload de documents */}
        {titre && (
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📤</span> Upload de Documents
            </div>

            {/* Drag & drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              style={{
                border: `2px dashed ${isDragOver ? '#3b82f6' : '#cbd5e1'}`,
                borderRadius: 12,
                padding: 24,
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragOver ? 'rgba(59, 130, 246, 0.05)' : 'rgba(203, 213, 225, 0.05)',
                transition: 'all 0.3s',
                marginBottom: 16
              }}
            >
              <input
                type="file"
                id="file-input"
                onChange={handleFileSelect}
                accept=".pdf,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
                disabled={uploadLoading}
              />
              <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                <div style={{ fontSize: 14, color: '#475569', marginBottom: 4 }}>
                  {file ? `✅ ${file.name}` : 'Glissez-déposez un fichier ou cliquez pour sélectionner'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  Formats: PDF, PNG, JPG (Max 50MB)
                </div>
              </label>
            </div>

            {/* Upload progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, marginBottom: 4, color: '#475569' }}>
                  Progression: {uploadProgress}%
                </div>
                <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            {/* Dernier fichier uploadé */}
            {lastUploaded && (
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#16a34a', marginBottom: 4 }}>
                      ✅ Dernier upload:
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#15803d' }}>
                      {lastUploaded.nomFichier}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                      {lastUploaded.tailleFichier ? `${(lastUploaded.tailleFichier / 1024).toFixed(1)} KB` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteDocument}
                    style={{
                      padding: '8px 12px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 12,
                      whiteSpace: 'nowrap'
                    }}
                    title="Supprimer ce document"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            )}

            {/* Bouton Upload */}
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploadLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: file ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: file ? 'pointer' : 'not-allowed',
                opacity: uploadLoading ? 0.7 : 1
              }}
            >
              {uploadLoading ? '⏳ Upload en cours...' : '📤 Uploader le Document'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
