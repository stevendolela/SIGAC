import React, { useState, useEffect, useMemo } from 'react'
import { 
  Folder, FolderOpen, FileText, File, ChevronRight, ChevronDown, 
  Download, Eye, Trash2, ArrowUp, ArrowDown, GripVertical,
  Search, Filter, SortAsc, SortDesc, Grid, List, RefreshCw
} from 'lucide-react'
import { getApiBaseUrl } from '../api/api-client'
import { useWorkspaceStore } from '../store/workspaceStore'
import { useToast } from '../components/common/ToastProvider'
import './FileExplorerPage.css'

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
type ViewMode = 'list' | 'grid'

export default function FileExplorerPage() {
  const [dossiers, setDossiers] = useState<DossierItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('ordre')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [draggedDoc, setDraggedDoc] = useState<{docId: string, dossierId: string} | null>(null)
  
  const { currentWorkspace, showAllWorkspaces } = useWorkspaceStore()
  const selectedWorkspaceId = currentWorkspace?.id || null
  const { notify } = useToast()

  // Charger les dossiers et leurs documents
  const loadData = async () => {
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
  }

  useEffect(() => {
    loadData()
  }, [selectedWorkspaceId, showAllWorkspaces])

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
      
      // Mettre à jour localement
      setDossiers(prev => prev.map(d => ({
        ...d,
        documents: d.documents.map(doc => 
          doc.id === docId ? { ...doc, ordre: newOrdre } : doc
        )
      })))
      
      notify({ type: 'success', message: 'Ordre mis à jour' })
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
    
    await loadData()
  }

  // Télécharger un document
  const downloadDocument = async (docId: string, filename: string) => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiBaseUrl()
      
      const response = await fetch(`${apiUrl}/documents/${docId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Erreur téléchargement')
      
      const blob = await response.blob()
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
      const token = localStorage.getItem('token')
      const apiUrl = getApiBaseUrl()
      
      const response = await fetch(`${apiUrl}/documents/${docId}/view`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Erreur prévisualisation')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err: any) {
      notify({ type: 'error', message: 'Erreur lors de la prévisualisation' })
    }
  }

  // Formater la taille
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / 1024 / 1024).toFixed(2)} Mo`
  }

  // Formater la date
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Obtenir l'icône selon le type MIME
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return <div className="file-icon pdf"><FileText /></div>
    }
    if (mimeType?.startsWith('image/')) {
      return <div className="file-icon image"><File /></div>
    }
    if (mimeType?.includes('word') || mimeType?.includes('document')) {
      return <div className="file-icon word"><FileText /></div>
    }
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) {
      return <div className="file-icon excel"><FileText /></div>
    }
    return <div className="file-icon other"><File /></div>
  }

  // Obtenir la couleur du statut
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'Nouveau': '#3b82f6',
      'EnInstruction': '#f59e0b',
      'EnDelibere': '#8b5cf6',
      'Juge': '#10b981',
      'Archive': '#6b7280'
    }
    return colors[status] || '#6b7280'
  }

  // Filtrer les dossiers
  const filteredDossiers = useMemo(() => {
    if (!search) return dossiers
    const s = search.toLowerCase()
    return dossiers.filter(d => 
      d.titre.toLowerCase().includes(s) ||
      d.numeroDossier.toLowerCase().includes(s) ||
      d.documents.some(doc => doc.nomFichier.toLowerCase().includes(s))
    )
  }, [dossiers, search])

  // Compteurs
  const totalDossiers = filteredDossiers.length
  const totalDocuments = filteredDossiers.reduce((sum, d) => sum + d.documents.length, 0)

  if (loading) {
    return (
      <div className="file-explorer-loading">
        <RefreshCw className="spin" />
        <span>Chargement de l'explorateur...</span>
      </div>
    )
  }

  return (
    <div className="file-explorer-page">
      {/* Header */}
      <div className="file-explorer-header">
        <div className="header-left">
          <h1>Explorateur de Documents</h1>
          <span className="stats">
            {totalDossiers} dossier{totalDossiers > 1 ? 's' : ''} • {totalDocuments} document{totalDocuments > 1 ? 's' : ''}
          </span>
        </div>
        <div className="header-actions">
          <button onClick={expandAll} className="btn-icon" title="Tout déplier">
            <ChevronDown />
          </button>
          <button onClick={collapseAll} className="btn-icon" title="Tout replier">
            <ChevronRight />
          </button>
          <button onClick={loadData} className="btn-icon" title="Actualiser">
            <RefreshCw />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="file-explorer-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher dossiers ou fichiers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="sort-controls">
          <select 
            value={sortField} 
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="sort-select"
          >
            <option value="ordre">Tri: Ordre personnalisé</option>
            <option value="nom">Tri: Nom</option>
            <option value="date">Tri: Date</option>
            <option value="taille">Tri: Taille</option>
          </select>
          <button 
            className="btn-icon"
            onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
            title={sortDirection === 'asc' ? 'Croissant' : 'Décroissant'}
          >
            {sortDirection === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
          </button>
        </div>

        <div className="view-controls">
          <button 
            className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Vue liste"
          >
            <List size={18} />
          </button>
          <button 
            className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Vue grille"
          >
            <Grid size={18} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="file-explorer-error">
          {error}
        </div>
      )}

      {/* Content */}
      <div className={`file-explorer-content ${viewMode}`}>
        {filteredDossiers.length === 0 ? (
          <div className="empty-state">
            <Folder size={64} />
            <p>Aucun dossier trouvé</p>
          </div>
        ) : (
          filteredDossiers.map(dossier => (
            <div key={dossier.id} className="dossier-item">
              {/* Dossier Header */}
              <div 
                className="dossier-header"
                onClick={() => toggleExpand(dossier.id)}
              >
                <div className="dossier-expand">
                  {dossier.isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                <div className="dossier-icon">
                  {dossier.isExpanded ? <FolderOpen size={24} /> : <Folder size={24} />}
                </div>
                <div className="dossier-info">
                  <span className="dossier-numero">{dossier.numeroDossier}</span>
                  <span className="dossier-titre">{dossier.titre}</span>
                </div>
                <div className="dossier-meta">
                  <span 
                    className="dossier-status"
                    style={{ backgroundColor: getStatusColor(dossier.status) }}
                  >
                    {dossier.status}
                  </span>
                  <span className="dossier-count">
                    {dossier.documents.length} fichier{dossier.documents.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Documents */}
              {dossier.isExpanded && (
                <div className={`dossier-documents ${viewMode}`}>
                  {dossier.documents.length === 0 ? (
                    <div className="no-documents">
                      <FileText size={32} />
                      <span>Aucun document dans ce dossier</span>
                    </div>
                  ) : (
                    sortDocuments(dossier.documents).map((doc, index) => (
                      <div key={doc.id} className="document-item">
                        {viewMode === 'list' ? (
                          <>
                            <div className="doc-drag">
                              <GripVertical size={16} />
                            </div>
                            <div className="doc-ordre">
                              <span className="ordre-badge">{doc.ordre}</span>
                            </div>
                            {getFileIcon(doc.mimeType)}
                            <div className="doc-info">
                              <span className="doc-name">{doc.nomFichier}</span>
                              <span className="doc-meta">
                                {formatSize(doc.tailleFichier)} • {formatDate(doc.uploadedAt)}
                              </span>
                            </div>
                            <div className="doc-actions">
                              <button 
                                className="btn-action"
                                onClick={(e) => { e.stopPropagation(); moveDocument(dossier.id, doc.id, 'up') }}
                                disabled={index === 0}
                                title="Monter"
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button 
                                className="btn-action"
                                onClick={(e) => { e.stopPropagation(); moveDocument(dossier.id, doc.id, 'down') }}
                                disabled={index === sortDocuments(dossier.documents).length - 1}
                                title="Descendre"
                              >
                                <ArrowDown size={16} />
                              </button>
                              <button 
                                className="btn-action view"
                                onClick={(e) => { e.stopPropagation(); previewDocument(doc.id) }}
                                title="Prévisualiser"
                              >
                                <Eye size={16} />
                              </button>
                              <button 
                                className="btn-action download"
                                onClick={(e) => { e.stopPropagation(); downloadDocument(doc.id, doc.nomFichier) }}
                                title="Télécharger"
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="doc-grid-card">
                            {getFileIcon(doc.mimeType)}
                            <span className="doc-name">{doc.nomFichier}</span>
                            <span className="doc-size">{formatSize(doc.tailleFichier)}</span>
                            <div className="doc-grid-actions">
                              <button onClick={() => previewDocument(doc.id)}><Eye size={14} /></button>
                              <button onClick={() => downloadDocument(doc.id, doc.nomFichier)}><Download size={14} /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
