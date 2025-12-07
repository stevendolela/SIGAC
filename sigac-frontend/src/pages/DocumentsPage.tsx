import { useEffect, useMemo, useState, useRef } from 'react'
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
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [scannerActive, setScannerActive] = useState(false)
  const [cameraPreview, setCameraPreview] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
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

  async function startScanner() {
    try {
      setScannerActive(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      notify({ type: 'success', message: '✅ Caméra/Scanner activé' })
    } catch (error) {
      notify({ type: 'error', message: '❌ Impossible d\'accéder à la caméra/scanner' })
      setScannerActive(false)
    }
  }

  async function stopScanner() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setScannerActive(false)
    setCameraPreview(null)
  }

  function captureSnapshot() {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        const imageData = canvasRef.current.toDataURL('image/png')
        setCameraPreview(imageData)
      }
    }
  }

  async function uploadScannedDocument() {
    if (!cameraPreview || !selectedDossierId) {
      notify({ type: 'error', message: 'Veuillez capturer une image' })
      return
    }

    try {
      setUploading(true)
      // Convertir dataURL en Blob
      const response = await fetch(cameraPreview)
      const blob = await response.blob()
      const file = new File([blob], `scan_${Date.now()}.png`, { type: 'image/png' })
      
      // Upload du fichier
      await documentApi.upload(selectedDossierId, file, 'Scan')
      notify({ type: 'success', message: '✅ Document scanné et uploadé' })
      
      // Fermer le scanner et réinitialiser
      await stopScanner()
      setShowScannerModal(false)
      setCameraPreview(null)
      await fetchDocuments()
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur upload du scan' })
    } finally {
      setUploading(false)
    }
  }

  // Cleanup du stream vidéo quand le composant est démonté
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

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
        <button
          className="btn"
          onClick={() => { setShowScannerModal(true); setShowUploadModal(false) }}
          disabled={!selectedDossierId}
          style={{
            background: selectedDossierId ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : '#ccc',
            color: 'white',
            border: 'none'
          }}
          title="Scanner un document avec votre caméra/scanner"
        >
          📸 Scanner
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

      {/* Modal Scanner */}
      {showScannerModal && (
        <div className="modal-overlay" onClick={() => { setShowScannerModal(false); stopScanner() }}>
          <div className="card" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: 20 }}>📸 Scanner un Document</h3>

            {!scannerActive && !cameraPreview && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ fontSize: 48, marginBottom: 16 }}>📷</p>
                <p style={{ marginBottom: 16, color: '#6b7280' }}>
                  Cliquez sur "Démarrer Scanner" pour activer votre caméra ou scanner
                </p>
                <button
                  className="btn"
                  onClick={startScanner}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    fontSize: 16
                  }}
                >
                  📸 Démarrer Scanner
                </button>
              </div>
            )}

            {scannerActive && !cameraPreview && (
              <div style={{ position: 'relative' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 400,
                    borderRadius: 8,
                    background: '#000',
                    marginBottom: 16
                  }}
                />
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                  <button
                    className="btn"
                    onClick={captureSnapshot}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      fontSize: 16
                    }}
                  >
                    ✅ Capturer
                  </button>
                  <button
                    className="btn"
                    onClick={() => { stopScanner(); setCameraPreview(null) }}
                    style={{
                      flex: 1,
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      fontSize: 16
                    }}
                  >
                    ❌ Annuler
                  </button>
                </div>
              </div>
            )}

            {cameraPreview && (
              <div style={{ position: 'relative' }}>
                <img
                  src={cameraPreview}
                  alt="Scanned Document"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 400,
                    borderRadius: 8,
                    marginBottom: 16,
                    border: '2px solid #10b981'
                  }}
                />
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                  📄 Document capturé - cliquez sur "Upload" pour le charger ou "Nouvelle Capture" pour rescanner
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                  <button
                    className="btn"
                    onClick={uploadScannedDocument}
                    disabled={uploading}
                    style={{
                      flex: 1,
                      background: uploading ? '#ccc' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      fontSize: 16
                    }}
                  >
                    {uploading ? '⏳ Chargement...' : '📤 Upload'}
                  </button>
                  <button
                    className="btn"
                    onClick={() => { setCameraPreview(null); startScanner() }}
                    disabled={uploading}
                    style={{
                      flex: 1,
                      background: uploading ? '#ccc' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      fontSize: 16
                    }}
                  >
                    📸 Nouvelle Capture
                  </button>
                  <button
                    className="btn"
                    onClick={() => { setShowScannerModal(false); stopScanner() }}
                    disabled={uploading}
                    style={{
                      flex: 1,
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      fontSize: 16
                    }}
                  >
                    ❌ Fermer
                  </button>
                </div>
              </div>
            )}
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
