import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { 
  Folder, FolderOpen, FileText, File as FileIcon, ChevronRight, ChevronDown, 
  Download, Eye, Trash2, ArrowUp, ArrowDown, Upload, Camera, Search,
  Grid, List, RefreshCw, Plus, FolderPlus, MoreVertical, X
} from 'lucide-react'
import { documentApi } from '../api/documentApi'
import type { DocumentDto } from '../types/document'
import type { DossierListDto } from '../types/dossier'
import { useToast } from '../components/common/ToastProvider'
import { useWorkspaceStore } from '../store/workspaceStore'
import { getApiBaseUrl } from '../api/api-client'
import DossierDetailModal from './DossierDetailModal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import './DocumentsPageUnified.css'

interface DocumentItem {
  id: string
  nomFichier: string
  mimeType: string
  tailleFichier: number
  uploadedAt: string
  ordre: number
  typeDocument: string
}

interface DossierItem {
  id: string
  numeroDossier: string
  titre: string
  status: string
  documents: DocumentItem[]
  isExpanded: boolean
}

type SortField = 'nom' | 'date' | 'taille' | 'ordre'
type SortDirection = 'asc' | 'desc'
type ViewMode = 'tree' | 'grid' | 'list'

// Helper pour formater la taille
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(2)} Mo`
}

// Helper pour formater la date
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export default function DocumentsPageUnified() {
  const [dossiers, setDossiers] = useState<DossierItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('ordre')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  
  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedDossierId, setSelectedDossierId] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  // Scanner state
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [scannerActive, setScannerActive] = useState(false)
  const [cameraPreview, setCameraPreview] = useState<string | null>(null)
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [scannerModalTab, setScannerModalTab] = useState<'camera' | 'agent'>('agent')
  const [agentStatus, setAgentStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [agentScanners, setAgentScanners] = useState<{id: string, name: string}[]>([])
  const [selectedAgentScanner, setSelectedAgentScanner] = useState<string>('')
  const [agentScanning, setAgentScanning] = useState(false)
  
  // Detail modal
  const [selectedDossierDetailId, setSelectedDossierDetailId] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { currentWorkspace, showAllWorkspaces } = useWorkspaceStore()
  const selectedWorkspaceId = currentWorkspace?.id || null
  const { notify } = useToast()
  
  const AGENT_URL = 'http://localhost:5588'

  // Charger les dossiers et leurs documents
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Non authentifié')
        return
      }

      const apiUrl = getApiBaseUrl()
      
      // Charger les dossiers
      let url = `${apiUrl}/dossiers?page=1&pageSize=500`
      if (selectedWorkspaceId && !showAllWorkspaces) {
        url += `&workspaceId=${selectedWorkspaceId}`
      }
      
      const dossiersResponse = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!dossiersResponse.ok) {
        throw new Error('Erreur lors du chargement des dossiers')
      }
      
      const dossiersData = await dossiersResponse.json()
      const dossiersList = dossiersData.data || dossiersData || []
      
      // Charger les documents de chaque dossier
      const dossiersWithDocs: DossierItem[] = await Promise.all(
        dossiersList.map(async (dossier: any) => {
          try {
            const docsResponse = await fetch(`${apiUrl}/documents/dossier/${dossier.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            const documents = docsResponse.ok ? await docsResponse.json() : []
            return {
              id: dossier.id,
              numeroDossier: dossier.numeroDossier,
              titre: dossier.titre,
              status: dossier.status || 'Nouveau',
              documents: documents.map((doc: any) => ({
                id: doc.id,
                nomFichier: doc.nomFichier,
                mimeType: doc.mimeType,
                tailleFichier: doc.tailleFichier,
                uploadedAt: doc.uploadedAt,
                ordre: doc.ordre || 0,
                typeDocument: doc.typeDocument
              })),
              isExpanded: false
            }
          } catch {
            return {
              id: dossier.id,
              numeroDossier: dossier.numeroDossier,
              titre: dossier.titre,
              status: dossier.status || 'Nouveau',
              documents: [],
              isExpanded: false
            }
          }
        })
      )
      
      setDossiers(dossiersWithDocs)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement')
      notify({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }, [selectedWorkspaceId, showAllWorkspaces, notify])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Toggle expansion d'un dossier
  const toggleExpand = (dossierId: string) => {
    setDossiers(prev => prev.map(d => 
      d.id === dossierId ? { ...d, isExpanded: !d.isExpanded } : d
    ))
  }

  // Expand/collapse all
  const expandAll = () => setDossiers(prev => prev.map(d => ({ ...d, isExpanded: true })))
  const collapseAll = () => setDossiers(prev => prev.map(d => ({ ...d, isExpanded: false })))

  // Trier les documents
  const sortDocuments = (docs: DocumentItem[]): DocumentItem[] => {
    return [...docs].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'nom':
          comparison = a.nomFichier.localeCompare(b.nomFichier)
          break
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
          break
        case 'taille':
          comparison = a.tailleFichier - b.tailleFichier
          break
        case 'ordre':
          comparison = a.ordre - b.ordre
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }

  // Filtrer les dossiers et documents
  const filteredDossiers = useMemo(() => {
    if (!search) return dossiers
    
    const searchLower = search.toLowerCase()
    return dossiers.map(d => ({
      ...d,
      documents: d.documents.filter(doc => 
        doc.nomFichier.toLowerCase().includes(searchLower) ||
        doc.typeDocument?.toLowerCase().includes(searchLower)
      ),
      isExpanded: d.documents.some(doc => 
        doc.nomFichier.toLowerCase().includes(searchLower)
      ) || d.titre.toLowerCase().includes(searchLower) || d.numeroDossier.toLowerCase().includes(searchLower)
    })).filter(d => 
      d.documents.length > 0 || 
      d.titre.toLowerCase().includes(searchLower) || 
      d.numeroDossier.toLowerCase().includes(searchLower)
    )
  }, [dossiers, search])

  // Stats
  const totalDocuments = dossiers.reduce((acc, d) => acc + d.documents.length, 0)
  const totalDossiers = dossiers.length

  // Changer l'ordre d'un document
  const updateDocumentOrdre = async (docId: string, newOrdre: number) => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiBaseUrl()
      
      await fetch(`${apiUrl}/documents/${docId}/ordre`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ordre: newOrdre })
      })
      
      setDossiers(prev => prev.map(d => ({
        ...d,
        documents: d.documents.map(doc => 
          doc.id === docId ? { ...doc, ordre: newOrdre } : doc
        )
      })))
    } catch (err: any) {
      notify({ type: 'error', message: 'Erreur lors de la mise à jour' })
    }
  }

  // Déplacer un document vers le haut/bas
  const moveDocument = async (dossierId: string, docId: string, direction: 'up' | 'down') => {
    const dossier = dossiers.find(d => d.id === dossierId)
    if (!dossier) return
    
    const sortedDocs = sortDocuments(dossier.documents)
    const index = sortedDocs.findIndex(d => d.id === docId)
    
    if (direction === 'up' && index > 0) {
      const prevDoc = sortedDocs[index - 1]
      const currentDoc = sortedDocs[index]
      await updateDocumentOrdre(currentDoc.id, prevDoc.ordre)
      await updateDocumentOrdre(prevDoc.id, currentDoc.ordre)
    } else if (direction === 'down' && index < sortedDocs.length - 1) {
      const nextDoc = sortedDocs[index + 1]
      const currentDoc = sortedDocs[index]
      await updateDocumentOrdre(currentDoc.id, nextDoc.ordre)
      await updateDocumentOrdre(nextDoc.id, currentDoc.ordre)
    }
    
    notify({ type: 'success', message: 'Ordre mis à jour' })
  }

  // Télécharger un document
  const downloadDocument = async (docId: string, filename: string) => {
    try {
      const blob = await documentApi.download(docId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      notify({ type: 'success', message: 'Téléchargement en cours...' })
    } catch (err: any) {
      notify({ type: 'error', message: 'Erreur lors du téléchargement' })
    }
  }

  // Prévisualiser un document
  const previewDocument = async (docId: string) => {
    try {
      const blob = await documentApi.download(docId)
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err: any) {
      notify({ type: 'error', message: 'Erreur lors de la prévisualisation' })
    }
  }

  // Supprimer un document
  const deleteDocument = async (docId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return
    
    try {
      await documentApi.remove(docId)
      notify({ type: 'success', message: 'Document supprimé' })
      await loadData()
    } catch (err: any) {
      notify({ type: 'error', message: 'Erreur lors de la suppression' })
    }
  }

  // Upload de fichiers
  const handleFileUpload = async (files: FileList | null, dossierId?: string) => {
    if (!files || files.length === 0) return
    const targetDossierId = dossierId || selectedDossierId
    if (!targetDossierId) {
      notify({ type: 'error', message: 'Veuillez sélectionner un dossier' })
      return
    }

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        await documentApi.upload(targetDossierId, file, 'Document')
        notify({ type: 'success', message: `Document uploadé: ${file.name}` })
      }
      await loadData()
      setShowUploadModal(false)
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur upload' })
    } finally {
      setUploading(false)
    }
  }

  // Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent, dossierId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileUpload(e.dataTransfer.files, dossierId)
  }

  // Scanner - Agent local
  const checkAgentStatus = async () => {
    setAgentStatus('checking')
    try {
      const response = await fetch(`${AGENT_URL}/status`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000) 
      })
      if (response.ok) {
        setAgentStatus('online')
        const scannersResponse = await fetch(`${AGENT_URL}/scanners`)
        if (scannersResponse.ok) {
          const data = await scannersResponse.json()
          setAgentScanners(data.scanners || [])
          if (data.scanners?.length > 0) {
            setSelectedAgentScanner(data.scanners[0].id)
          }
        }
      } else {
        setAgentStatus('offline')
      }
    } catch {
      setAgentStatus('offline')
    }
  }

  const scanWithAgent = async () => {
    if (!selectedDossierId) {
      notify({ type: 'error', message: 'Sélectionnez d\'abord un dossier' })
      return
    }
    
    setAgentScanning(true)
    try {
      const url = selectedAgentScanner 
        ? `${AGENT_URL}/scan?scannerId=${encodeURIComponent(selectedAgentScanner)}`
        : `${AGENT_URL}/scan`
      
      const response = await fetch(url, { method: 'GET' })
      const data = await response.json()
      
      if (data.success && data.image) {
        notify({ type: 'info', message: 'Document scanné, upload en cours...' })
        
        const byteCharacters = atob(data.image)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/png' })
        const file = new File([blob], `scan_${Date.now()}.png`, { type: 'image/png' })
        
        await documentApi.upload(selectedDossierId, file, 'Document scanné')
        
        notify({ type: 'success', message: 'Document scanné et importé!' })
        await loadData()
        setShowScannerModal(false)
      } else {
        notify({ type: 'error', message: data.error || 'Erreur lors du scan' })
      }
    } catch (e: any) {
      notify({ type: 'error', message: 'Erreur de connexion à l\'agent' })
    } finally {
      setAgentScanning(false)
    }
  }

  // Scanner - Caméra
  const startCamera = async () => {
    try {
      setScannerActive(true)
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setAvailableDevices(videoDevices)
      
      const deviceId = selectedDeviceId || videoDevices[0]?.deviceId
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error: any) {
      setScannerActive(false)
      notify({ type: 'error', message: `Erreur caméra: ${error.message}` })
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setScannerActive(false)
    setCameraPreview(null)
  }

  const captureSnapshot = () => {
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

  const uploadScannedDocument = async () => {
    if (!cameraPreview || !selectedDossierId) {
      notify({ type: 'error', message: 'Veuillez capturer une image' })
      return
    }

    try {
      setUploading(true)
      const base64Data = cameraPreview.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })
      const file = new File([blob], `scan_${Date.now()}.png`, { type: 'image/png' })
      
      await documentApi.upload(selectedDossierId, file, 'Scan')
      notify({ type: 'success', message: 'Document scanné et uploadé' })
      
      stopCamera()
      setShowScannerModal(false)
      setCameraPreview(null)
      await loadData()
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur upload du scan' })
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (showScannerModal) {
      checkAgentStatus()
    }
  }, [showScannerModal])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Obtenir l'icône selon le type MIME
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return <div className="doc-file-icon pdf"><FileText size={20} /></div>
    }
    if (mimeType?.startsWith('image/')) {
      return <div className="doc-file-icon image"><FileIcon size={20} /></div>
    }
    if (mimeType?.includes('word') || mimeType?.includes('document')) {
      return <div className="doc-file-icon word"><FileText size={20} /></div>
    }
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) {
      return <div className="doc-file-icon excel"><FileText size={20} /></div>
    }
    return <div className="doc-file-icon other"><FileIcon size={20} /></div>
  }

  // Obtenir la couleur du statut
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'Nouveau': '#3b82f6',
      'EnInstruction': '#f59e0b',
      'EnDelibere': '#8b5cf6',
      'Juge': '#10b981',
      'Archive': '#6b7280',
      'Termine': '#22c55e'
    }
    return colors[status] || '#64748b'
  }

  return (
    <div className="documents-unified">
      {/* Header */}
      <div className="docs-header">
        <div className="docs-header-left">
          <h1>Documents</h1>
          <div className="docs-stats">
            <span>{totalDossiers} dossiers</span>
            <span className="dot">•</span>
            <span>{totalDocuments} documents</span>
          </div>
        </div>
        <div className="docs-header-right">
          <div className="docs-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select
            className="docs-sort-select"
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
          >
            <option value="ordre">Tri: Ordre</option>
            <option value="nom">Tri: Nom</option>
            <option value="date">Tri: Date</option>
            <option value="taille">Tri: Taille</option>
          </select>
          
          <div className="docs-view-toggle">
            <button 
              className={viewMode === 'tree' ? 'active' : ''} 
              onClick={() => setViewMode('tree')}
              title="Vue arborescence"
            >
              <FolderOpen size={18} />
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''} 
              onClick={() => setViewMode('list')}
              title="Vue liste"
            >
              <List size={18} />
            </button>
            <button 
              className={viewMode === 'grid' ? 'active' : ''} 
              onClick={() => setViewMode('grid')}
              title="Vue grille"
            >
              <Grid size={18} />
            </button>
          </div>
          
          <button className="docs-btn secondary" onClick={() => loadData()}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="docs-toolbar">
        <div className="docs-toolbar-left">
          {viewMode === 'tree' && (
            <>
              <button className="docs-btn-sm" onClick={expandAll}>Tout déplier</button>
              <button className="docs-btn-sm" onClick={collapseAll}>Tout replier</button>
            </>
          )}
        </div>
        <div className="docs-toolbar-right">
          <select
            className="docs-dossier-select"
            value={selectedDossierId}
            onChange={(e) => setSelectedDossierId(e.target.value)}
          >
            <option value="">Sélectionner un dossier...</option>
            {dossiers.map(d => (
              <option key={d.id} value={d.id}>{d.numeroDossier} - {d.titre}</option>
            ))}
          </select>
          
          <button 
            className="docs-btn secondary"
            onClick={() => setShowScannerModal(true)}
            disabled={!selectedDossierId}
          >
            <Camera size={16} />
            Scanner
          </button>
          
          <button 
            className="docs-btn primary"
            onClick={() => setShowUploadModal(true)}
            disabled={!selectedDossierId}
          >
            <Upload size={16} />
            Importer
          </button>
        </div>
      </div>

      {/* Content */}
      <div 
        className={`docs-content ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={(e) => handleDrop(e)}
      >
        {loading && (
          <div className="docs-loading">
            <LoadingSpinner message="Chargement..." />
          </div>
        )}

        {!loading && filteredDossiers.length === 0 && (
          <div className="docs-empty">
            <Folder size={64} />
            <h3>Aucun document</h3>
            <p>Sélectionnez un dossier et importez des documents</p>
          </div>
        )}

        {/* Vue Arborescence */}
        {!loading && viewMode === 'tree' && filteredDossiers.length > 0 && (
          <div className="docs-tree">
            {filteredDossiers.map(dossier => (
              <div key={dossier.id} className="tree-dossier">
                <div 
                  className="tree-dossier-header"
                  onClick={() => toggleExpand(dossier.id)}
                >
                  <span className="tree-expand">
                    {dossier.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                  <span className="tree-folder-icon">
                    {dossier.isExpanded ? <FolderOpen size={20} /> : <Folder size={20} />}
                  </span>
                  <div className="tree-dossier-info">
                    <span className="tree-dossier-numero">{dossier.numeroDossier}</span>
                    <span className="tree-dossier-titre">{dossier.titre}</span>
                  </div>
                  <span 
                    className="tree-dossier-status"
                    style={{ backgroundColor: getStatusColor(dossier.status) }}
                  >
                    {dossier.status}
                  </span>
                  <span className="tree-dossier-count">
                    {dossier.documents.length} doc{dossier.documents.length !== 1 ? 's' : ''}
                  </span>
                  <button 
                    className="tree-upload-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedDossierId(dossier.id)
                      setShowUploadModal(true)
                    }}
                    title="Ajouter un document"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                
                {dossier.isExpanded && (
                  <div className="tree-documents">
                    {dossier.documents.length === 0 ? (
                      <div className="tree-no-docs">Aucun document</div>
                    ) : (
                      sortDocuments(dossier.documents).map((doc, index) => (
                        <div key={doc.id} className="tree-document">
                          <span className="tree-doc-ordre">{doc.ordre}</span>
                          {getFileIcon(doc.mimeType)}
                          <div className="tree-doc-info">
                            <span className="tree-doc-name">{doc.nomFichier}</span>
                            <span className="tree-doc-meta">
                              {formatSize(doc.tailleFichier)} • {formatDate(doc.uploadedAt)}
                            </span>
                          </div>
                          <div className="tree-doc-actions">
                            <button 
                              onClick={() => moveDocument(dossier.id, doc.id, 'up')}
                              disabled={index === 0}
                              title="Monter"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button 
                              onClick={() => moveDocument(dossier.id, doc.id, 'down')}
                              disabled={index === dossier.documents.length - 1}
                              title="Descendre"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button onClick={() => previewDocument(doc.id)} title="Voir">
                              <Eye size={14} />
                            </button>
                            <button onClick={() => downloadDocument(doc.id, doc.nomFichier)} title="Télécharger">
                              <Download size={14} />
                            </button>
                            <button onClick={() => deleteDocument(doc.id)} className="delete" title="Supprimer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Vue Liste plate */}
        {!loading && viewMode === 'list' && filteredDossiers.length > 0 && (
          <div className="docs-list">
            <div className="docs-list-header">
              <span className="col-name">Nom</span>
              <span className="col-dossier">Dossier</span>
              <span className="col-size">Taille</span>
              <span className="col-date">Date</span>
              <span className="col-actions">Actions</span>
            </div>
            {filteredDossiers.flatMap(dossier => 
              sortDocuments(dossier.documents).map(doc => (
                <div key={doc.id} className="docs-list-item">
                  <span className="col-name">
                    {getFileIcon(doc.mimeType)}
                    {doc.nomFichier}
                  </span>
                  <span className="col-dossier">{dossier.numeroDossier}</span>
                  <span className="col-size">{formatSize(doc.tailleFichier)}</span>
                  <span className="col-date">{formatDate(doc.uploadedAt)}</span>
                  <span className="col-actions">
                    <button onClick={() => previewDocument(doc.id)}><Eye size={14} /></button>
                    <button onClick={() => downloadDocument(doc.id, doc.nomFichier)}><Download size={14} /></button>
                    <button onClick={() => deleteDocument(doc.id)} className="delete"><Trash2 size={14} /></button>
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Vue Grille */}
        {!loading && viewMode === 'grid' && filteredDossiers.length > 0 && (
          <div className="docs-grid">
            {filteredDossiers.flatMap(dossier => 
              sortDocuments(dossier.documents).map(doc => (
                <div key={doc.id} className="docs-grid-card" onClick={() => previewDocument(doc.id)}>
                  <div className="grid-card-icon">{getFileIcon(doc.mimeType)}</div>
                  <div className="grid-card-name">{doc.nomFichier}</div>
                  <div className="grid-card-meta">{formatSize(doc.tailleFichier)}</div>
                  <div className="grid-card-dossier">{dossier.numeroDossier}</div>
                  <div className="grid-card-actions">
                    <button onClick={(e) => { e.stopPropagation(); downloadDocument(doc.id, doc.nomFichier) }}>
                      <Download size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id) }} className="delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Drop zone overlay */}
        {dragActive && (
          <div className="docs-drop-overlay">
            <Upload size={48} />
            <p>Déposez vos fichiers ici</p>
          </div>
        )}
      </div>

      {/* Modal Upload */}
      {showUploadModal && (
        <div className="docs-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="docs-modal" onClick={e => e.stopPropagation()}>
            <div className="docs-modal-header">
              <h2>Importer des documents</h2>
              <button onClick={() => setShowUploadModal(false)}><X size={20} /></button>
            </div>
            <div className="docs-modal-body">
              <div 
                className={`docs-upload-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => { handleDrop(e); setShowUploadModal(false) }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={48} />
                <p>Glissez-déposez vos fichiers ici</p>
                <span>ou cliquez pour sélectionner</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  style={{ display: 'none' }}
                />
              </div>
              {uploading && <div className="docs-uploading">Upload en cours...</div>}
            </div>
          </div>
        </div>
      )}

      {/* Modal Scanner */}
      {showScannerModal && (
        <div className="docs-modal-overlay" onClick={() => { stopCamera(); setShowScannerModal(false) }}>
          <div className="docs-modal scanner-modal" onClick={e => e.stopPropagation()}>
            <div className="docs-modal-header">
              <h2>Scanner un document</h2>
              <button onClick={() => { stopCamera(); setShowScannerModal(false) }}><X size={20} /></button>
            </div>
            <div className="docs-modal-tabs">
              <button 
                className={scannerModalTab === 'agent' ? 'active' : ''}
                onClick={() => setScannerModalTab('agent')}
              >
                Agent Local
              </button>
              <button 
                className={scannerModalTab === 'camera' ? 'active' : ''}
                onClick={() => setScannerModalTab('camera')}
              >
                Caméra
              </button>
            </div>
            <div className="docs-modal-body">
              {scannerModalTab === 'agent' && (
                <div className="scanner-agent">
                  <div className={`agent-status ${agentStatus}`}>
                    {agentStatus === 'checking' && 'Vérification...'}
                    {agentStatus === 'online' && '✓ Agent connecté'}
                    {agentStatus === 'offline' && '✗ Agent non détecté'}
                  </div>
                  
                  {agentStatus === 'online' && agentScanners.length > 0 && (
                    <select
                      value={selectedAgentScanner}
                      onChange={(e) => setSelectedAgentScanner(e.target.value)}
                    >
                      {agentScanners.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                  
                  {agentStatus === 'online' && (
                    <button 
                      className="docs-btn primary"
                      onClick={scanWithAgent}
                      disabled={agentScanning}
                    >
                      {agentScanning ? 'Scan en cours...' : 'Scanner'}
                    </button>
                  )}
                  
                  {agentStatus === 'offline' && (
                    <div className="agent-help">
                      <p>L'agent de numérisation n'est pas détecté.</p>
                      <p>Téléchargez et installez l'agent sur votre poste.</p>
                    </div>
                  )}
                </div>
              )}
              
              {scannerModalTab === 'camera' && (
                <div className="scanner-camera">
                  {!scannerActive && !cameraPreview && (
                    <button className="docs-btn primary" onClick={startCamera}>
                      Activer la caméra
                    </button>
                  )}
                  
                  {scannerActive && (
                    <>
                      <video ref={videoRef} autoPlay playsInline />
                      <div className="camera-controls">
                        <button className="docs-btn primary" onClick={captureSnapshot}>
                          Capturer
                        </button>
                        <button className="docs-btn secondary" onClick={stopCamera}>
                          Annuler
                        </button>
                      </div>
                    </>
                  )}
                  
                  {cameraPreview && (
                    <>
                      <img src={cameraPreview} alt="Aperçu" />
                      <div className="camera-controls">
                        <button className="docs-btn primary" onClick={uploadScannedDocument} disabled={uploading}>
                          {uploading ? 'Upload...' : 'Enregistrer'}
                        </button>
                        <button className="docs-btn secondary" onClick={() => { setCameraPreview(null); startCamera() }}>
                          Reprendre
                        </button>
                      </div>
                    </>
                  )}
                  
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
              )}
            </div>
          </div>
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
