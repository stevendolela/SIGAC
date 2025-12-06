import { useEffect, useMemo, useState } from 'react'
import { documentApi } from '../api/documentApi'
import type { DocumentDto } from '../types/document'
import type { DossierListDto } from '../types/dossier'
import { useToast } from '../components/common/ToastProvider'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentDto[]>([])
  const [dossiers, setDossiers] = useState<DossierListDto[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedDossierId, setSelectedDossierId] = useState<string>('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentDto | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const { notify } = useToast()

  // Vérification du rôle
  const userStr = localStorage.getItem('user')
  const currentUser = userStr ? JSON.parse(userStr) : null

  // Charger les documents
  const fetchDocuments = useMemo(() => async (q?: string) => {
    setLoading(true)
    setError(null)
    try {
      // Pour maintenant, charger depuis un dossier si sélectionné
      if (selectedDossierId) {
        const docs = await documentApi.listByDossier(selectedDossierId)
        setDocuments(docs)
      } else {
        setDocuments([])
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erreur de chargement'
      setError(msg)
      notify({ type: 'error', message: msg })
    } finally {
      setLoading(false)
    }
  }, [selectedDossierId, notify])

  // Charger les dossiers (pour sélection dans assign modal)
  useEffect(() => {
    const fetchDossiers = async () => {
      try {
        // Charger les dossiers via l'API dossierApi
        const { dossierApi } = await import('../api/dossierApi')
        const result = await dossierApi.list({ page: 1, pageSize: 100 })
        setDossiers(result.data || [])
      } catch (e: any) {
        console.error('Erreur chargement dossiers', e)
      }
    }
    fetchDossiers()
  }, [])

  useEffect(() => {
    if (selectedDossierId) {
      fetchDocuments()
    }
  }, [selectedDossierId, fetchDocuments])

  // Filtrer les documents selon la recherche
  const filteredDocuments = documents.filter(doc =>
    doc.nomFichier.toLowerCase().includes(search.toLowerCase()) ||
    doc.typeDocument?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    if (!selectedDossierId) {
      notify({ type: 'error', message: 'Veuillez sélectionner un dossier' })
      return
    }

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        await documentApi.upload(selectedDossierId, file, 'Document')
        notify({ type: 'success', message: `✅ Document uploadé: ${file.name}` })
      }
      await fetchDocuments()
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur upload' })
    } finally {
      setUploading(false)
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileUpload(e.dataTransfer.files)
  }

  async function handleDeleteDocument(docId: string) {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return

    try {
      await documentApi.remove(docId)
      notify({ type: 'success', message: '✅ Document supprimé' })
      await fetchDocuments()
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur suppression' })
    }
  }

  async function handleAssignDocument(newDossierId: string) {
    if (!selectedDocument || !newDossierId) return

    try {
      await documentApi.assignToDossier(selectedDocument.id, newDossierId)
      notify({ type: 'success', message: '✅ Document assigné au dossier' })
      setShowAssignModal(false)
      setSelectedDocument(null)
      await fetchDocuments()
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur assignation' })
    }
  }

  return (
    <div className="panel">
      <div className="panel-title">📄 Gestion des Documents</div>

      {/* Sélection du dossier */}
      <div style={{ marginBottom: 24, padding: 16, background: '#f0f9ff', borderRadius: 8 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
          📁 Dossier (pour voir/ajouter les documents):
        </label>
        <select
          value={selectedDossierId}
          onChange={(e) => setSelectedDossierId(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }}
        >
          <option value="">-- Sélectionner un dossier --</option>
          {dossiers.map(d => (
            <option key={d.id} value={d.id}>
              {d.numeroDossier} - {d.titre}
            </option>
          ))}
        </select>
      </div>

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <input
          placeholder="🔍 Rechercher un document..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          className="btn"
          onClick={() => setShowUploadModal(true)}
          disabled={!selectedDossierId}
          style={{
            background: selectedDossierId ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#ccc',
            color: 'white',
            border: 'none'
          }}
        >
          📤 Scanner/Uploader
        </button>
      </div>

      {/* Modal Upload/Scanner */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: 20 }}>📤 Scanner ou Uploader des Documents</h3>

            {/* Zone drag-drop */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: dragActive ? '3px dashed #10b981' : '2px dashed #cbd5e1',
                borderRadius: 8,
                padding: 32,
                textAlign: 'center',
                cursor: 'pointer',
                background: dragActive ? '#ecfdf5' : '#f9fafb',
                marginBottom: 16,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
              <p style={{ marginBottom: 8, fontWeight: 600 }}>
                Glissez vos documents ici ou cliquez pour sélectionner
              </p>
              <p style={{ color: '#6b7280', fontSize: 12 }}>
                Formats: PDF, Images (JPEG, PNG, TIFF), Word, Excel
              </p>
              <input
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                style={{ display: 'none' }}
                id="file-input"
                disabled={uploading}
              />
              <label htmlFor="file-input" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
                <button
                  type="button"
                  className="btn"
                  disabled={uploading}
                  style={{
                    marginTop: 12,
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    color: 'white',
                    border: 'none'
                  }}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  {uploading ? '⏳ Upload en cours...' : '📁 Choisir des fichiers'}
                </button>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                className="btn"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Assigner un document */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="card" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>
              📎 Assigner "{selectedDocument?.nomFichier}" à un dossier
            </h3>

            <select
              onChange={(e) => handleAssignDocument(e.target.value)}
              style={{ width: '100%', padding: 8, marginBottom: 16, borderRadius: 4, border: '1px solid #cbd5e1' }}
              defaultValue=""
            >
              <option value="">-- Sélectionner un dossier --</option>
              {dossiers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.numeroDossier} - {d.titre}
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => { setShowAssignModal(false); setSelectedDocument(null) }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des documents */}
      {loading && <div className="info">⏳ Chargement des documents...</div>}
      {error && <div className="error">{error}</div>}

      {!selectedDossierId && !loading && (
        <div className="info" style={{ textAlign: 'center', padding: 40 }}>
          📁 Sélectionnez un dossier pour voir et gérer ses documents
        </div>
      )}

      {selectedDossierId && !loading && filteredDocuments.length === 0 && (
        <div className="info" style={{ textAlign: 'center', padding: 40 }}>
          📄 Aucun document dans ce dossier - Uploadez-en un!
        </div>
      )}

      {filteredDocuments.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nom du fichier</th>
                <th>Type</th>
                <th>Taille</th>
                <th>Date upload</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>📄</span>
                      <span style={{ fontWeight: 600 }}>{doc.nomFichier}</span>
                    </div>
                  </td>
                  <td>{doc.typeDocument}</td>
                  <td>{(doc.tailleFichier / 1024 / 1024).toFixed(2)} MB</td>
                  <td>{new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button
                      title="Télécharger"
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        width: 32,
                        height: 32,
                        borderRadius: 4,
                        fontSize: 16,
                        cursor: 'pointer'
                      }}
                      onClick={async () => {
                        const blob = await documentApi.download(doc.id)
                        const url = URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = doc.nomFichier
                        link.click()
                      }}
                    >
                      ⬇️
                    </button>
                    <button
                      title="Assigner à un dossier"
                      style={{
                        background: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        width: 32,
                        height: 32,
                        borderRadius: 4,
                        fontSize: 16,
                        cursor: 'pointer'
                      }}
                      onClick={() => { setSelectedDocument(doc); setShowAssignModal(true) }}
                    >
                      📎
                    </button>
                    <button
                      title="Supprimer"
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        width: 32,
                        height: 32,
                        borderRadius: 4,
                        fontSize: 16,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
