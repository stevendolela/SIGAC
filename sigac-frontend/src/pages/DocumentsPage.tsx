import { useEffect, useMemo, useState, useRef } from 'react'
import { documentApi } from '../api/documentApi'
import type { DocumentDto } from '../types/document'
import type { DossierListDto } from '../types/dossier'
import { useToast } from '../components/common/ToastProvider'
import DossierDetailModal from './DossierDetailModal'
import '../styles/documents-page.css'

// Icônes SVG modernes
const Icons = {
  folder: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  upload: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  camera: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  file: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  pdf: <svg width="48" height="48" viewBox="0 0 24 24" fill="#dc2626"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><text x="7" y="18" fontSize="6" fill="white" fontWeight="bold">PDF</text></svg>,
  image: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  docs: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
}

// Helper pour obtenir le type de fichier
function getFileType(mimeType: string): 'pdf' | 'image' | 'word' | 'excel' | 'other' {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType?.startsWith('image/')) return 'image'
  if (mimeType?.includes('word') || mimeType?.includes('document')) return 'word'
  if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return 'excel'
  return 'other'
}

// Helper pour formater la taille
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

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
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [showNetworkScannerSearch, setShowNetworkScannerSearch] = useState(false)
  const [networkScanners, setNetworkScanners] = useState<any[]>([])
  const [scanningNetwork, setScanningNetwork] = useState(false)
  const [selectedNetworkScanner, setSelectedNetworkScanner] = useState<any>(null)
  const [scannerModalTab, setScannerModalTab] = useState<'local' | 'network'>('local')
  const [selectedDossierDetailId, setSelectedDossierDetailId] = useState<string | null>(null)
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
      if (selectedDossierId) {
        // Charger les documents d'un dossier spécifique
        const docs = await documentApi.listByDossier(selectedDossierId)
        setDocuments(docs)
      } else {
        // Charger TOUS les documents (avec ou sans dossier)
        try {
          const allDocs = await documentApi.listAll()
          setDocuments(allDocs)
        } catch (err) {
          // Si listAll n'existe pas, essayer de charger depuis tous les dossiers
          const allDocsFromDossiers: DocumentDto[] = []
          for (const dossier of dossiers) {
            try {
              const docs = await documentApi.listByDossier(dossier.id)
              allDocsFromDossiers.push(...docs)
            } catch (e) {
              console.error(`Erreur chargement docs du dossier ${dossier.id}`, e)
            }
          }
          setDocuments(allDocsFromDossiers)
        }
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erreur de chargement'
      setError(msg)
      notify({ type: 'error', message: msg })
    } finally {
      setLoading(false)
    }
  }, [selectedDossierId, dossiers, notify])

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

  // Énumérer les appareils vidéo disponibles
  async function enumerateVideoDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setAvailableDevices(videoDevices)
      
      if (videoDevices.length > 0) {
        // Sélectionner le premier appareil par défaut
        setSelectedDeviceId(videoDevices[0].deviceId)
      }
    } catch (e: any) {
      console.error('Erreur énumération appareils', e)
    }
  }

  useEffect(() => {
    // Charger les documents dès qu'on a les dossiers ou qu'on change de sélection
    if (dossiers.length > 0 || selectedDossierId) {
      fetchDocuments()
    }
  }, [selectedDossierId, dossiers, fetchDocuments])

  // Filtrer les documents selon la recherche
  const filteredDocuments = documents.filter(doc =>
    doc.nomFichier.toLowerCase().includes(search.toLowerCase()) ||
    doc.typeDocument?.toLowerCase().includes(search.toLowerCase())
  )

  async function handlePreviewDocument(doc: DocumentDto) {
    try {
      const blob = await documentApi.download(doc.id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      notify({ type: 'success', message: '👁️ Document ouvert' })
    } catch (e) {
      notify({ type: 'error', message: 'Impossible d\'ouvrir le document' })
    }
  }

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
      
      // Énumérer les appareils au démarrage
      await enumerateVideoDevices()
      
      // Utiliser l'appareil sélectionné ou le premier disponible
      const deviceId = selectedDeviceId || availableDevices[0]?.deviceId
      
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      const deviceName = availableDevices.find(d => d.deviceId === deviceId)?.label || 'Caméra'
      notify({ type: 'success', message: `✅ ${deviceName} activé(e)` })
    } catch (error: any) {
      console.error('Erreur caméra/scanner:', error)
      if (error.name === 'NotFoundError' || error.name === 'NotAllowedError') {
        notify({ type: 'error', message: '❌ Appareil non trouvé ou permission refusée' })
      } else {
        notify({ type: 'error', message: '❌ Impossible d\'accéder à la caméra/scanner' })
      }
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

  async function searchNetworkScanners() {
    setScanningNetwork(true)
    try {
      const result = await documentApi.searchNetworkScanners()
      setNetworkScanners(result.scanners || [])
      if (result.scanners && result.scanners.length > 0) {
        notify({ type: 'success', message: `✅ ${result.scannersFound} scanner(s) trouvé(s)` })
      } else {
        notify({ type: 'info', message: '⚠️ Aucun scanner trouvé sur le réseau' })
      }
    } catch (e: any) {
      notify({ type: 'error', message: 'Erreur lors de la recherche réseau' })
      console.error('Erreur recherche réseau:', e)
    } finally {
      setScanningNetwork(false)
    }
  }

  async function testScannerConnection(scanner: any) {
    try {
      notify({ type: 'info', message: '🔄 Test de connexion en cours...' })
      const result = await documentApi.testScannerConnection(scanner.ip, scanner.port)
      if (result.success) {
        notify({ type: 'success', message: `✅ ${scanner.name || scanner.ip} accessible` })
        setSelectedNetworkScanner(scanner)
      } else {
        notify({ type: 'error', message: `❌ ${scanner.name || scanner.ip} non accessible` })
      }
    } catch (e: any) {
      notify({ type: 'error', message: 'Erreur test connexion' })
    }
  }

  // Statistiques
  const pdfCount = filteredDocuments.filter(d => d.mimeType === 'application/pdf').length
  const imageCount = filteredDocuments.filter(d => d.mimeType?.startsWith('image/')).length
  const totalSize = filteredDocuments.reduce((acc, d) => acc + (d.tailleFichier || 0), 0)

  return (
    <div className="documents-page">
      {/* Header */}
      <div className="documents-header">
        <div className="documents-title">
          <div className="documents-title-icon">📄</div>
          <h1>Gestion des Documents</h1>
        </div>
        <p className="documents-subtitle">Gérez, organisez et consultez tous vos documents en un seul endroit</p>
      </div>

      {/* Stats Cards */}
      <div className="documents-stats">
        <div className="stat-card">
          <div className="stat-icon blue">📁</div>
          <div className="stat-info">
            <h4>{filteredDocuments.length}</h4>
            <p>Documents</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📷</div>
          <div className="stat-info">
            <h4>{imageCount}</h4>
            <p>Images</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📕</div>
          <div className="stat-info">
            <h4>{pdfCount}</h4>
            <p>PDF</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">💾</div>
          <div className="stat-info">
            <h4>{formatSize(totalSize)}</h4>
            <p>Stockage total</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="documents-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher un document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <select
          className="filter-select"
          value={selectedDossierId}
          onChange={(e) => setSelectedDossierId(e.target.value)}
        >
          <option value="">Tous les dossiers</option>
          {dossiers.map(d => (
            <option key={d.id} value={d.id}>
              {d.numeroDossier} - {d.titre}
            </option>
          ))}
        </select>

        <button
          className="action-btn success"
          onClick={() => setShowUploadModal(true)}
          disabled={!selectedDossierId}
        >
          {Icons.upload}
          <span>Importer</span>
        </button>

        <button
          className="action-btn purple"
          onClick={() => { setShowScannerModal(true); setShowUploadModal(false) }}
          disabled={!selectedDossierId}
        >
          {Icons.camera}
          <span>Scanner</span>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p style={{ marginTop: 16, color: '#64748b' }}>Chargement des documents...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDocuments.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>Aucun document trouvé</h3>
          <p>
            {selectedDossierId 
              ? "Ce dossier ne contient pas encore de documents. Importez-en un pour commencer."
              : "Sélectionnez un dossier et importez vos premiers documents."}
          </p>
        </div>
      )}

      {/* Documents Grid */}
      {!loading && filteredDocuments.length > 0 && (
        <div className="documents-grid">
          {filteredDocuments.map(doc => {
            const fileType = getFileType(doc.mimeType)
            return (
              <div key={doc.id} className="document-card">
                <div className={`document-preview ${fileType}`}>
                  <div className="document-icon">
                    {fileType === 'pdf' && '📕'}
                    {fileType === 'image' && '🖼️'}
                    {fileType === 'word' && '📘'}
                    {fileType === 'excel' && '📗'}
                    {fileType === 'other' && '📄'}
                  </div>
                  <span className={`document-type-badge ${fileType}`}>
                    {fileType.toUpperCase()}
                  </span>
                </div>
                <div className="document-info">
                  <div className="document-name" title={doc.nomFichier}>
                    {doc.nomFichier}
                  </div>
                  <div className="document-meta">
                    <span>{formatSize(doc.tailleFichier)}</span>
                    <span>{new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="document-actions">
                    <button 
                      className="doc-action-btn view"
                      onClick={() => handlePreviewDocument(doc)}
                      title="Ouvrir"
                    >
                      {Icons.eye}
                      <span>Ouvrir</span>
                    </button>
                    <button 
                      className="doc-action-btn download"
                      onClick={async () => {
                        try {
                          const blob = await documentApi.download(doc.id)
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = doc.nomFichier
                          a.click()
                          URL.revokeObjectURL(url)
                          notify({ type: 'success', message: 'Téléchargé' })
                        } catch { notify({ type: 'error', message: 'Erreur' }) }
                      }}
                      title="Télécharger"
                    >
                      {Icons.download}
                    </button>
                    <button 
                      className="doc-action-btn delete"
                      onClick={async () => {
                        if (!confirm(`Supprimer "${doc.nomFichier}" ?`)) return
                        try {
                          await documentApi.remove(doc.id)
                          setDocuments(prev => prev.filter(d => d.id !== doc.id))
                          notify({ type: 'success', message: 'Supprimé' })
                        } catch { notify({ type: 'error', message: 'Erreur' }) }
                      }}
                      title="Supprimer"
                    >
                      {Icons.trash}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Upload */}
      {showUploadModal && (
        <div className="modal-overlay-modern" onClick={() => setShowUploadModal(false)}>
          <div className="modal-modern" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span style={{ fontSize: 24 }}>📤</span>
                Importer des documents
              </h2>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                {Icons.close}
              </button>
            </div>
            <div className="modal-body">
              <div
                className={`upload-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <div className="upload-zone-icon">📁</div>
                <h4>Glissez vos fichiers ici</h4>
                <p>ou cliquez pour sélectionner</p>
                <p style={{ marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
                  PDF, Images, Word, Excel
                </p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  style={{ display: 'none' }}
                  id="file-input"
                  disabled={uploading}
                />
              </div>
              {uploading && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <div className="loading-spinner" style={{ margin: '0 auto' }} />
                  <p style={{ marginTop: 12, color: '#64748b' }}>Import en cours...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Scanner - Ergonomique avec Onglets */}
      {showScannerModal && (
        <div className="modal-overlay" onClick={() => { setShowScannerModal(false); stopScanner() }}>
          <div className="card" style={{ maxWidth: 700, maxHeight: '90vh', overflow: 'auto', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            
            {/* En-tête avec titre */}
            <div style={{ padding: '20px 20px 0 20px', borderBottom: '2px solid #e5e7eb' }}>
              <h2 style={{ marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, fontSize: 24 }}>
                📸 Scanner un Document
              </h2>

              {/* Onglets */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
                <button
                  onClick={() => { setScannerModalTab('local'); stopScanner(); setCameraPreview(null) }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: 'none',
                    borderBottom: scannerModalTab === 'local' ? '4px solid #8b5cf6' : '2px solid #e5e7eb',
                    background: scannerModalTab === 'local' ? '#f9fafb' : '#ffffff',
                    color: scannerModalTab === 'local' ? '#8b5cf6' : '#6b7280',
                    fontWeight: scannerModalTab === 'local' ? 700 : 500,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderRadius: '8px 8px 0 0'
                  }}
                >
                  🎥 Appareil Local
                </button>
                <button
                  onClick={() => { setScannerModalTab('network'); stopScanner(); setCameraPreview(null) }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: 'none',
                    borderBottom: scannerModalTab === 'network' ? '4px solid #f59e0b' : '2px solid #e5e7eb',
                    background: scannerModalTab === 'network' ? '#f9fafb' : '#ffffff',
                    color: scannerModalTab === 'network' ? '#f59e0b' : '#6b7280',
                    fontWeight: scannerModalTab === 'network' ? 700 : 500,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderRadius: '8px 8px 0 0'
                  }}
                >
                  🌐 Réseau
                </button>
              </div>
            </div>

            {/* Contenu des onglets */}
            <div style={{ padding: 20 }}>

              {/* ONGLET 1: Appareil Local */}
              {scannerModalTab === 'local' && (
                <div>
                  {!scannerActive && !cameraPreview && (
                    <div>
                      {/* Sélection d'appareil */}
                      <div style={{ marginBottom: 20, background: '#f0f9ff', padding: 16, borderRadius: 8, border: '1px solid #bfdbfe' }}>
                        <label style={{ display: 'block', marginBottom: 10, fontWeight: 700, fontSize: 15, color: '#1e40af' }}>
                          🎥 Sélectionner un appareil :
                        </label>
                        <select
                          value={selectedDeviceId}
                          onChange={(e) => setSelectedDeviceId(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 6,
                            border: '2px solid #3b82f6',
                            fontSize: 14,
                            fontWeight: 500,
                            background: '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">-- Auto-détection --</option>
                          {availableDevices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                              {device.label || `Caméra ${device.deviceId.substring(0, 8)}`}
                            </option>
                          ))}
                        </select>
                        <div style={{ fontSize: 12, color: '#1e40af', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>💡</span>
                          <span>Connectez un scanner USB avant de démarrer pour le détecter</span>
                        </div>
                      </div>

                      {/* Zone d'instructions */}
                      <div style={{ textAlign: 'center', padding: 32, background: '#f9fafb', borderRadius: 8, marginBottom: 20, border: '2px dashed #cbd5e1' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>📷</div>
                        <p style={{ marginBottom: 12, color: '#1f2937', fontWeight: 600, fontSize: 16 }}>
                          Prêt à scanner
                        </p>
                        <p style={{ color: '#6b7280', fontSize: 13, lineHeight: '1.6' }}>
                          Cliquez sur "Démarrer Scanner" pour activer<br/>votre caméra ou scanner USB
                        </p>
                      </div>

                      {/* Boutons d'action */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <button
                          className="btn"
                          onClick={startScanner}
                          style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '14px 20px',
                            fontSize: 16,
                            fontWeight: 700,
                            borderRadius: 6,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                          }}
                        >
                          📸 Démarrer Scanner
                        </button>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            className="btn"
                            onClick={enumerateVideoDevices}
                            style={{
                              flex: 1,
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              padding: '10px 16px',
                              fontSize: 13,
                              fontWeight: 600,
                              borderRadius: 6,
                              cursor: 'pointer'
                            }}
                            title="Rafraîchir la liste des appareils"
                          >
                            🔄 Rafraîchir
                          </button>
                          <button
                            className="btn"
                            onClick={() => { setShowScannerModal(false); stopScanner() }}
                            style={{
                              flex: 1,
                              background: '#6b7280',
                              color: 'white',
                              border: 'none',
                              padding: '10px 16px',
                              fontSize: 13,
                              fontWeight: 600,
                              borderRadius: 6,
                              cursor: 'pointer'
                            }}
                          >
                            ❌ Fermer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Capture en cours */}
                  {scannerActive && !cameraPreview && (
                    <div>
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
                          marginBottom: 16,
                          border: '3px solid #8b5cf6'
                        }}
                      />
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          className="btn"
                          onClick={captureSnapshot}
                          style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '12px 20px',
                            fontSize: 14,
                            fontWeight: 700,
                            borderRadius: 6,
                            cursor: 'pointer'
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
                            padding: '12px 20px',
                            fontSize: 14,
                            fontWeight: 700,
                            borderRadius: 6,
                            cursor: 'pointer'
                          }}
                        >
                          ❌ Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Aperçu capture */}
                  {cameraPreview && (
                    <div>
                      <div style={{ background: '#eff6ff', padding: 12, borderRadius: 8, marginBottom: 12, border: '2px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>✅</span>
                        <span style={{ color: '#1e40af', fontWeight: 600 }}>Document capturé</span>
                      </div>
                      <img
                        src={cameraPreview}
                        alt="Scanned Document"
                        style={{
                          width: '100%',
                          height: 'auto',
                          maxHeight: 350,
                          borderRadius: 8,
                          marginBottom: 16,
                          border: '3px solid #10b981'
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <button
                          className="btn"
                          onClick={uploadScannedDocument}
                          disabled={uploading}
                          style={{
                            width: '100%',
                            background: uploading ? '#d1d5db' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '12px 20px',
                            fontSize: 14,
                            fontWeight: 700,
                            borderRadius: 6,
                            cursor: uploading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {uploading ? '⏳ Chargement...' : '📤 Uploader le Document'}
                        </button>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            className="btn"
                            onClick={() => { setCameraPreview(null); startScanner() }}
                            disabled={uploading}
                            style={{
                              flex: 1,
                              background: uploading ? '#d1d5db' : '#3b82f6',
                              color: 'white',
                              border: 'none',
                              padding: '10px 16px',
                              fontSize: 13,
                              fontWeight: 600,
                              borderRadius: 6,
                              cursor: uploading ? 'not-allowed' : 'pointer'
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
                              padding: '10px 16px',
                              fontSize: 13,
                              fontWeight: 600,
                              borderRadius: 6,
                              cursor: uploading ? 'not-allowed' : 'pointer'
                            }}
                          >
                            ❌ Fermer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ONGLET 2: Réseau */}
              {scannerModalTab === 'network' && (
                <div>
                  {networkScanners.length === 0 && !scanningNetwork && (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ fontSize: 56, marginBottom: 16 }}>🌐</div>
                      <p style={{ marginBottom: 8, fontWeight: 700, fontSize: 16, color: '#1f2937' }}>Chercher les Scanners Réseau</p>
                      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24, lineHeight: '1.6' }}>
                        Scannez votre réseau local pour découvrir<br/>les scanners disponibles
                      </p>
                      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>
                        ⏱️ La recherche peut prendre 10-15 secondes...
                      </p>
                      <button
                        className="btn"
                        onClick={searchNetworkScanners}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '14px 20px',
                          fontSize: 16,
                          fontWeight: 700,
                          borderRadius: 6,
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                          transition: 'all 0.2s'
                        }}
                      >
                        🔍 Chercher des Scanners
                      </button>
                    </div>
                  )}

                  {scanningNetwork && (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite' }}>🔄</div>
                      <p style={{ marginBottom: 8, fontWeight: 700, fontSize: 16, color: '#1f2937' }}>Recherche en cours...</p>
                      <p style={{ fontSize: 12, color: '#6b7280' }}>
                        Scanning votre réseau local pour détecter les scanners
                      </p>
                    </div>
                  )}

                  {!scanningNetwork && networkScanners.length > 0 && (
                    <div>
                      <div style={{ 
                        background: '#ecfdf5', 
                        padding: 12, 
                        borderRadius: 6, 
                        marginBottom: 16,
                        border: '2px solid #d1fae5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                      }}>
                        <span style={{ fontSize: 20 }}>✅</span>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#065f46' }}>
                          {networkScanners.length} scanner(s) trouvé(s)
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 350, overflow: 'auto' }}>
                        {networkScanners.map((scanner, idx) => (
                          <div
                            key={idx}
                            style={{
                              border: selectedNetworkScanner?.ip === scanner.ip ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                              borderRadius: 8,
                              padding: 12,
                              background: selectedNetworkScanner?.ip === scanner.ip ? '#eff6ff' : '#fff',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: selectedNetworkScanner?.ip === scanner.ip ? '0 2px 8px rgba(59, 130, 246, 0.2)' : 'none'
                            }}
                            onClick={() => setSelectedNetworkScanner(scanner)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>
                                  🖨️ {scanner.name || `Scanner (${scanner.ip})`}
                                </div>
                                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, fontFamily: 'monospace' }}>
                                  {scanner.ip}:{scanner.port}
                                </div>
                              </div>
                              <div style={{
                                background: scanner.status === 'online' ? '#dcfce7' : '#fee2e2',
                                color: scanner.status === 'online' ? '#166534' : '#991b1b',
                                padding: '4px 10px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700
                              }}>
                                {scanner.status === 'online' ? '🟢 Online' : '� Offline'}
                              </div>
                            </div>
                            <button
                              className="btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                testScannerConnection(scanner)
                              }}
                              style={{
                                width: '100%',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                padding: '8px 12px',
                                fontSize: 12,
                                fontWeight: 600,
                                borderRadius: 4,
                                cursor: 'pointer'
                              }}
                            >
                              � Tester la Connexion
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        className="btn"
                        onClick={searchNetworkScanners}
                        style={{
                          width: '100%',
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          padding: '10px 16px',
                          fontSize: 13,
                          fontWeight: 600,
                          borderRadius: 6,
                          cursor: 'pointer',
                          marginBottom: 10
                        }}
                      >
                        🔄 Chercher à nouveau
                      </button>
                    </div>
                  )}

                  <button
                    className="btn"
                    onClick={() => setShowScannerModal(false)}
                    style={{
                      width: '100%',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: 6,
                      cursor: 'pointer'
                    }}
                  >
                    ❌ Fermer
                  </button>
                </div>
              )}
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
                <th>Dossier</th>
                <th>Type</th>
                <th>Taille</th>
                <th>Date upload</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map(doc => {
                const dossier = dossiers.find(d => d.id === doc.dossierId);
                return (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>📄</span>
                        <span style={{ fontWeight: 600 }}>{doc.nomFichier}</span>
                      </div>
                    </td>
                    <td>
                      {dossier ? (
                        <div 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 6,
                            cursor: 'pointer'
                          }}
                          onClick={() => setSelectedDossierDetailId(dossier.id)}
                          title="Cliquer pour ouvrir le dossier"
                        >
                          <span style={{ 
                            fontSize: 10, 
                            fontWeight: 700, 
                            color: '#6b7280',
                            background: '#f3f4f6',
                            padding: '2px 6px',
                            borderRadius: 3,
                            transition: 'all 0.2s'
                          }}>
                            {dossier.numeroDossier}
                          </span>
                          <span style={{ 
                            fontSize: 13, 
                            color: '#1e40af',
                            textDecoration: 'underline',
                            transition: 'all 0.2s'
                          }}>
                            {dossier.titre.length > 30 ? dossier.titre.substring(0, 30) + '...' : dossier.titre}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                          Non assigné
                        </span>
                      )}
                    </td>
                    <td>{doc.typeDocument}</td>
                    <td>{(doc.tailleFichier / 1024 / 1024).toFixed(2)} MB</td>
                    <td>{new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                    <button
                      title="Voir le document"
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        width: 32,
                        height: 32,
                        borderRadius: 4,
                        fontSize: 16,
                        cursor: 'pointer'
                      }}
                      onClick={() => handlePreviewDocument(doc)}
                    >
                      👁️
                    </button>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Détail Dossier */}
      {selectedDossierDetailId && (
        <DossierDetailModal 
          dossierId={selectedDossierDetailId} 
          onClose={() => setSelectedDossierDetailId(null)} 
        />
      )}
    </div>
  )
}
