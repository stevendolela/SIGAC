import { useEffect, useState } from 'react'
import { FolderOpen, X, FileText, Calendar, Settings, History, Upload, Eye, Download, Trash2, User, Users, CheckCircle2, Clock, AlertTriangle, Archive, Sparkles, Zap, RefreshCw, Loader2, ExternalLink, Plus } from 'lucide-react'
import { dossierApi } from '../api/dossierApi'
import { documentApi, type DocumentVisualisationLogDto } from '../api/documentApi'
import { userApi } from '../api/userApi'
import type { DossierDetailDto } from '../types/dossierDetail'
import type { DocumentDto } from '../types/document'
import type { UserDto } from '../types/user'
import { useToast } from '../components/common/ToastProvider'
import AudienceList from '../components/audiences/AudienceList'
import AudienceForm from '../components/audiences/AudienceForm'
import Modal from '../components/common/Modal'

// Mapping nombre → string pour les enums (backend envoie des nombres)
const STATUS_ENUM_MAP: Record<number | string, string> = {
  0: 'Nouveau', 1: 'EnCours', 2: 'EnValidation', 3: 'Valide', 4: 'Termine',
  'Nouveau': 'Nouveau', 'EnCours': 'EnCours', 'EnValidation': 'EnValidation', 'Valide': 'Valide', 'Termine': 'Termine'
}

const PRIORITE_ENUM_MAP: Record<number | string, string> = {
  0: 'Basse', 1: 'Normale', 2: 'Haute', 3: 'Urgente',
  'Basse': 'Basse', 'Normale': 'Normale', 'Haute': 'Haute', 'Urgente': 'Urgente'
}

// Helpers pour normaliser les valeurs
const getStatus = (val: any): string => STATUS_ENUM_MAP[val] || 'Nouveau'
const getPriorite = (val: any): string => PRIORITE_ENUM_MAP[val] || 'Normale'

// Labels et couleurs du statut
const STATUS_LABELS: Record<string, string> = {
  Nouveau: 'Nouveau',
  EnCours: 'En cours',
  EnValidation: 'En validation',
  Valide: 'Validé',
  Termine: 'Terminé'
}

const STATUS_COLORS: Record<string, string> = {
  Nouveau: '#3b82f6',
  EnCours: '#f59e0b',
  EnValidation: '#8b5cf6',
  Valide: '#10b981',
  Termine: '#6b7280'
}

// Labels et couleurs de la priorité
const PRIORITE_LABELS: Record<string, string> = {
  Basse: 'Basse',
  Normale: 'Normale',
  Haute: 'Haute',
  Urgente: 'Urgente'
}

const PRIORITE_COLORS: Record<string, string> = {
  Basse: '#94a3b8',
  Normale: '#10b981',
  Haute: '#f59e0b',
  Urgente: '#ef4444'
}

interface Props {
  dossierId: string
  onClose: () => void
}

export default function DossierDetailModal({ dossierId, onClose }: Props) {
  const [detail, setDetail] = useState<DossierDetailDto | null>(null)
  const [docs, setDocs] = useState<DocumentDto[]>([])
  const [visualisations, setVisualisations] = useState<DocumentVisualisationLogDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rapporteurId, setRapporteurId] = useState('')
  const [juges, setJuges] = useState<UserDto[]>([])
  const [nouveauStatut, setNouveauStatut] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [showVisHistory, setShowVisHistory] = useState(false)
  const [showAudienceModal, setShowAudienceModal] = useState(false)
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | undefined>()
  const [audienceRefreshKey, setAudienceRefreshKey] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [typeDocument, setTypeDocument] = useState('Document')
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'documents' | 'audiences' | 'actions' | 'historique'>('documents')

  const { notify } = useToast()

  // Helper pour formater le type d'affaire avec des espaces
  function formatTypeAffaire(type?: string | null): string {
    if (!type) return 'Non spécifié'
    // Ajoute un espace avant chaque majuscule (sauf la première)
    return type.replace(/([A-Z])/g, ' $1').trim()
  }

  // Helper pour formater la date
  function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [d, l, j] = await Promise.all([
          dossierApi.getById(dossierId),
          documentApi.listByDossier(dossierId),
          userApi.listJuges()
        ])
        if (!mounted) return
        setDetail(d)
        setDocs(l)
        setJuges(j)
      } catch (e: any) {
        if (mounted) setError(e?.response?.data?.message || e?.message || 'Erreur de chargement')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [dossierId])

  async function download(doc: DocumentDto) {
    try {
      const blob = await documentApi.download(doc.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.nomFichier
      a.click()
      URL.revokeObjectURL(url)
      notify({ type: 'success', message: '📥 Document téléchargé' })
    } catch (e) {
      setError('Téléchargement impossible')
      notify({ type: 'error', message: 'Téléchargement impossible' })
    }
  }

  async function viewDocument(doc: DocumentDto) {
    try {
      const blob = await documentApi.view(doc.id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      notify({ type: 'success', message: 'Document ouvert' })
      if (showVisHistory) {
        setTimeout(() => loadVisualisations(), 500)
      }
    } catch (e) {
      notify({ type: 'error', message: 'Impossible d\'ouvrir le document' })
    }
  }

  async function remove(doc: DocumentDto) {
    if (!confirm(`Supprimer "${doc.nomFichier}" ?`)) return
    try {
      await documentApi.remove(doc.id)
      setDocs(prev => prev.filter(d => d.id !== doc.id))
      notify({ type: 'success', message: 'Document supprimé' })
    } catch (e) {
      setError('Suppression impossible')
      notify({ type: 'error', message: 'Suppression impossible' })
    }
  }

  async function loadVisualisations() {
    try {
      const vis = await documentApi.getVisualisations(dossierId)
      setVisualisations(vis)
    } catch (e) {
      console.error('Erreur chargement historique visualisations:', e)
    }
  }

  function toggleVisHistory() {
    if (!showVisHistory) {
      loadVisualisations()
    }
    setShowVisHistory(!showVisHistory)
  }

  async function attribuerRapporteur() {
    try {
      await dossierApi.attribuerRapporteur(dossierId, rapporteurId)
      notify({ type: 'success', message: 'Responsable affecté avec succès' })
      const updated = await dossierApi.getById(dossierId)
      setDetail(updated)
      setRapporteurId('')
    } catch (e) {
      setError('Erreur lors de l\'attribution du responsable')
      notify({ type: 'error', message: 'Erreur lors de l\'attribution du responsable' })
    }
  }

  async function changerStatut() {
    if (!nouveauStatut) return
    try {
      await dossierApi.changerStatut(dossierId, parseInt(nouveauStatut), commentaire || undefined)
      notify({ type: 'success', message: 'Statut modifié' })
      const updated = await dossierApi.getById(dossierId)
      setDetail(updated)
      setNouveauStatut('')
      setCommentaire('')
    } catch (e) {
      setError('Erreur changement statut')
      notify({ type: 'error', message: 'Erreur changement statut' })
    }
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    try {
      await documentApi.upload(dossierId, selectedFile, typeDocument)
      notify({ type: 'success', message: 'Document uploadé avec succès !' })
      const updatedDocs = await documentApi.listByDossier(dossierId)
      setDocs(updatedDocs)
      setSelectedFile(null)
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Erreur lors de l\'upload'
      notify({ type: 'error', message: `❌ ${errorMsg}` })
      setError(errorMsg)
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
    }
  }

  function handleAudienceSuccess() {
    setShowAudienceModal(false)
    setSelectedAudienceId(undefined)
    setAudienceRefreshKey(prev => prev + 1)
  }

  function handleAudienceSelect(audienceId: string) {
    setSelectedAudienceId(audienceId)
    setShowAudienceModal(true)
  }

  function handleNewAudience() {
    setSelectedAudienceId(undefined)
    setShowAudienceModal(true)
  }

  return (
    <Modal isOpen onClose={onClose} size="xl" title="">
      <div style={{ maxHeight: '85vh', overflowY: 'auto', margin: -24 }}>
        {loading && (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Loader2 size={48} color="#6366f1" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <p style={{ color: '#64748b' }}>Chargement du dossier...</p>
          </div>
        )}
        
        {error && (
          <div style={{ 
            padding: 20, 
            margin: 24,
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: 12,
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <AlertTriangle size={24} />
            <span>{error}</span>
          </div>
        )}
        
        {detail && (
          <div>
            {/* En-tête moderne avec gradient et motif */}
            <div style={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
              padding: '28px 32px',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Motif décoratif */}
              <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: -30, left: '30%', width: 100, height: 100, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
              
              <button 
                onClick={onClose} 
                style={{ 
                  position: 'absolute', top: 20, right: 20, 
                  background: 'rgba(255,255,255,0.15)', 
                  border: 'none', borderRadius: '10px', 
                  padding: '8px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >
                <X size={18} color="white" />
              </button>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FolderOpen size={16} style={{ opacity: 0.9 }} />
                  <span style={{ fontSize: 13, opacity: 0.9, letterSpacing: '0.5px', fontWeight: 500 }}>Dossier</span>
                </div>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
                  {detail.numeroDossier}
                </h2>
                <div style={{ fontSize: 16, marginTop: 8, opacity: 0.95, maxWidth: '85%' }}>
                  {detail.titre}
                </div>
                
                <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                  <span style={{ 
                    backgroundColor: STATUS_COLORS[getStatus(detail.status)], 
                    backdropFilter: 'blur(10px)',
                    color: 'white', 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    <CheckCircle2 size={14} />
                    {STATUS_LABELS[getStatus(detail.status)]}
                  </span>
                  <span style={{ 
                    backgroundColor: PRIORITE_COLORS[getPriorite(detail.priorite)], 
                    color: 'white', 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    <Zap size={14} />
                    {PRIORITE_LABELS[getPriorite(detail.priorite)]}
                  </span>
                  <span style={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    color: 'white', 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <Calendar size={14} />
                    {formatDate(detail.dateDepot || detail.dateDebut || detail.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation par onglets moderne */}
            <div style={{ 
              display: 'flex', 
              borderBottom: '1px solid #e2e8f0', 
              background: 'white', 
              padding: '0 32px',
              gap: 4
            }}>
              {[
                { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
                { id: 'audiences', label: 'Réunions', icon: <Calendar size={16} /> },
                { id: 'actions', label: 'Actions', icon: <Settings size={16} /> },
                { id: 'historique', label: 'Historique', icon: <History size={16} /> }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  style={{
                    padding: '16px 20px', 
                    border: 'none', 
                    background: activeTab === tab.id ? 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' : 'transparent',
                    color: activeTab === tab.id ? '#6366f1' : '#64748b',
                    fontWeight: activeTab === tab.id ? 600 : 500,
                    borderBottom: activeTab === tab.id ? '3px solid #6366f1' : '3px solid transparent',
                    cursor: 'pointer', 
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: '8px 8px 0 0',
                    fontSize: '14px'
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Grille d'informations principales */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
              padding: '24px 32px',
              background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
            }}>
              {/* Parties */}
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#475569', 
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Users size={16} color="#6366f1" />
                  <span>Parties</span>
                </div>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#64748b', fontSize: 13 }}>Demandeur:</span>
                  <span style={{ color: '#1e293b', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{detail.demandeur}</span>
                </div>
                {detail.defendeur && (
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ color: '#64748b', fontSize: 13 }}>Tiers concerné:</span>
                    <span style={{ color: '#1e293b', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{detail.defendeur}</span>
                  </div>
                )}
              </div>

              {/* Responsable assigné */}
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#475569', 
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <User size={16} color="#6366f1" />
                  <span>Responsable assigné</span>
                </div>
                {detail.rapporteur ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#6366f1'
                    }}>
                      {(detail.rapporteur.nomComplet || detail.rapporteur.username).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                        {detail.rapporteur.nomComplet || detail.rapporteur.username}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {detail.rapporteur.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    color: '#94a3b8', 
                    fontStyle: 'italic',
                    padding: '16px 0',
                    textAlign: 'center'
                  }}>
                    Aucun responsable assigné
                  </div>
                )}
              </div>

              {/* Informations générales */}
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#475569', 
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <FileText size={16} color="#6366f1" />
                  <span>Informations</span>
                </div>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#64748b', fontSize: 13 }}>Catégorie:</span>
                  <span style={{ color: '#1e293b', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{formatTypeAffaire(detail.type || detail.typeAffaire)}</span>
                </div>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#64748b', fontSize: 13 }}>Date de dépôt:</span>
                  <span style={{ color: '#1e293b', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{formatDate(detail.dateDepot || detail.dateDebut || detail.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Description si présente */}
            {detail.description && (
              <div style={{ padding: '0 32px 24px', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                <div style={{ 
                  background: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={16} color="#6366f1" />
                    <span>Description</span>
                  </div>
                  <div style={{ color: '#334155', lineHeight: 1.6, fontSize: 14 }}>
                    {detail.description}
                  </div>
                </div>
              </div>
            )}

            {/* Contenu des tabs */}
            <div style={{ padding: '24px 32px', minHeight: 300, background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
              {/* Tab Documents */}
              {activeTab === 'documents' && (
                <div>
                  {/* Formulaire d'upload moderne */}
                  <div style={{ 
                    marginBottom: 24, 
                    padding: 20, 
                    background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)', 
                    borderRadius: 12, 
                    border: '2px dashed #c7d2fe',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Upload size={18} />
                      <span>Uploader un nouveau document</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        id="file-input"
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx,.xls,.xlsx,.zip"
                        style={{ 
                          padding: 10, 
                          border: '2px solid #c7d2fe', 
                          borderRadius: 8,
                          flex: 1,
                          minWidth: 200,
                          background: 'white',
                          cursor: 'pointer'
                        }}
                      />
                      <select
                        value={typeDocument}
                        onChange={(e) => setTypeDocument(e.target.value)}
                        style={{ 
                          padding: 10, 
                          border: '2px solid #c7d2fe', 
                          borderRadius: 8,
                          background: 'white',
                          fontWeight: 500
                        }}
                      >
                        <option value="Document">● Document</option>
                        <option value="Requête">● Requête</option>
                        <option value="Pièce justificative">● Pièce justificative</option>
                        <option value="Rapport">● Rapport</option>
                        <option value="Décision">● Décision</option>
                        <option value="Autre">● Autre</option>
                      </select>
                      <button 
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 24px',
                          background: !selectedFile || uploading ? '#cbd5e1' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
                          fontSize: 14,
                          transition: 'all 0.2s',
                          boxShadow: !selectedFile || uploading ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.3)'
                        }}
                      >
                        {uploading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Upload en cours...</> : <><Upload size={16} /> Uploader</>}
                      </button>
                    </div>
                    {selectedFile && (
                      <div style={{ 
                        marginTop: 12, 
                        fontSize: 13, 
                        color: '#475569',
                        padding: 12,
                        background: 'white',
                        borderRadius: 6,
                        border: '1px solid #e0e7ff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <FileText size={16} style={{ color: '#6366f1' }} />
                        <b>{selectedFile.name}</b> • {(selectedFile.size / 1024).toFixed(1)} Ko
                      </div>
                    )}
                  </div>

                  {/* Liste des documents */}
                  {/* Info date de création */}
                  <div style={{
                    marginBottom: 16,
                    padding: '12px 16px',
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    color: '#0c4a6e'
                  }}>
                    <Calendar size={18} style={{ color: '#0284c7' }} />
                    <span style={{ fontWeight: 500 }}>Date de création du dossier:</span>
                    <span style={{ fontWeight: 600 }}>
                      {detail?.dateDepot 
                        ? new Date(detail.dateDepot).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : detail?.dateDebut
                        ? new Date(detail.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : detail?.createdAt
                        ? new Date(detail.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Non spécifiée'
                      }
                    </span>
                  </div>

                  {docs.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: 40, 
                      color: '#94a3b8',
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px dashed #cbd5e1'
                    }}>
                      <FolderOpen size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                      <p>Aucun document dans ce dossier</p>
                    </div>
                  ) : (
                    <div style={{ 
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      overflow: 'hidden'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>Nom</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>Type</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>Taille</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>Date</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {docs.map((doc, idx) => (
                            <tr key={doc.id} style={{ 
                              borderBottom: idx < docs.length - 1 ? '1px solid #f1f5f9' : 'none',
                              transition: 'background 0.15s'
                            }}>
                              <td style={{ padding: '14px 16px', fontSize: 14, color: '#1e293b' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <FileText size={16} style={{ color: '#6366f1' }} />
                                  <span style={{ fontWeight: 500 }}>{doc.nomFichier}</span>
                                </div>
                              </td>
                              <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  background: '#f1f5f9',
                                  borderRadius: 4,
                                  fontSize: 12,
                                  fontWeight: 500
                                }}>
                                  {doc.typeDocument}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>
                                {(doc.tailleFichier / 1024).toFixed(1)} Ko
                              </td>
                              <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>
                                {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                  <button 
                                    onClick={() => viewDocument(doc)}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#dbeafe',
                                      color: '#1e40af',
                                      border: 'none',
                                      borderRadius: 6,
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                  >
                                    <Eye size={14} /> Voir
                                  </button>
                                  <button 
                                    onClick={() => download(doc)}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#dcfce7',
                                      color: '#166534',
                                      border: 'none',
                                      borderRadius: 6,
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                  >
                                    <Download size={14} /> Télécharger
                                  </button>
                                  <button 
                                    onClick={() => remove(doc)}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#fee2e2',
                                      color: '#991b1b',
                                      border: 'none',
                                      borderRadius: 6,
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Historique des visualisations */}
                  {showVisHistory && (
                    <div style={{ marginTop: 24 }}>
                      <div style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: 20
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <History size={16} style={{ color: '#6366f1' }} /> Historique des visualisations
                        </div>
                        {visualisations.length === 0 ? (
                          <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>
                            Aucune visualisation enregistrée
                          </div>
                        ) : (
                          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                            <table style={{ width: '100%', fontSize: 13 }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Utilisateur</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Document</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                                </tr>
                              </thead>
                              <tbody>
                                {visualisations.map(v => (
                                  <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px' }}>{new Date(v.dateVisualisation).toLocaleString('fr-FR')}</td>
                                    <td style={{ padding: '8px' }}>{v.userNomComplet}</td>
                                    <td style={{ padding: '8px' }}>{v.documentNom}</td>
                                    <td style={{ padding: '8px' }}>
                                      <span style={{
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        fontSize: 11,
                                        background: v.typeVisualisation === 'view' ? '#dbeafe' : '#fef3c7',
                                        color: v.typeVisualisation === 'view' ? '#1e40af' : '#92400e'
                                      }}>
                                        {v.typeVisualisation === 'view' ? 'Vue' : 'DL'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <button
                      onClick={toggleVisHistory}
                      style={{
                        padding: '8px 16px',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#64748b',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      {showVisHistory ? <><Eye size={14} /> Masquer historique</> : <><History size={14} /> Voir historique visualisations</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab Audiences */}
              {activeTab === 'audiences' && (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handleNewAudience}
                      style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                      }}
                    >
                      <Plus size={16} /> Planifier une réunion
                    </button>
                  </div>
                  <AudienceList
                    key={audienceRefreshKey}
                    dossierId={dossierId}
                    onSelectAudience={handleAudienceSelect}
                  />
                </div>
              )}

              {/* Tab Actions */}
              {activeTab === 'actions' && (
                <div style={{ display: 'grid', gap: 20 }}>
                  {/* Affecter un responsable */}
                  <div style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 24
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <User size={18} style={{ color: '#6366f1' }} />
                      <span>Affecter un responsable</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        value={rapporteurId}
                        onChange={(e) => setRapporteurId(e.target.value)}
                        style={{ 
                          flex: 1,
                          minWidth: 280,
                          padding: 10, 
                          border: '2px solid #e2e8f0', 
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 500
                        }}
                      >
                        <option value="">-- Sélectionner un responsable --</option>
                        {juges.map((juge) => (
                          <option key={juge.id} value={juge.id}>
                            {juge.nomComplet || juge.username} • {juge.matricule || juge.email}
                          </option>
                        ))}
                      </select>
                      <button 
                        onClick={attribuerRapporteur}
                        disabled={!rapporteurId}
                        style={{
                          padding: '10px 24px',
                          background: !rapporteurId ? '#cbd5e1' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: !rapporteurId ? 'not-allowed' : 'pointer',
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <CheckCircle2 size={16} /> Affecter
                      </button>
                    </div>
                  </div>

                  {/* Changer le statut */}
                  <div style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 24
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <RefreshCw size={18} style={{ color: '#8b5cf6' }} />
                      <span>Changer le statut du dossier</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        value={nouveauStatut}
                        onChange={(e) => setNouveauStatut(e.target.value)}
                        style={{ 
                          padding: 10, 
                          border: '2px solid #e2e8f0', 
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 500
                        }}
                      >
                        <option value="">-- Nouveau statut --</option>
                        <option value="1">● Nouveau</option>
                        <option value="2">● En Cours</option>
                        <option value="3">● En Validation</option>
                        <option value="4">● Validé</option>
                        <option value="5">● Terminé</option>
                      </select>
                      <input
                        placeholder="Commentaire (optionnel)"
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                        style={{ 
                          flex: 1,
                          minWidth: 250,
                          padding: 10, 
                          border: '2px solid #e2e8f0', 
                          borderRadius: 8,
                          fontSize: 14
                        }}
                      />
                      <button 
                        onClick={changerStatut}
                        disabled={!nouveauStatut}
                        style={{
                          padding: '10px 24px',
                          background: !nouveauStatut ? '#cbd5e1' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: !nouveauStatut ? 'not-allowed' : 'pointer',
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <RefreshCw size={16} /> Modifier
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Historique */}
              {activeTab === 'historique' && (
                <div>
                  {detail.historiques && detail.historiques.length > 0 ? (
                    <div style={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      overflow: 'hidden'
                    }}>
                      {detail.historiques.map((h, idx) => (
                        <div 
                          key={h.id}
                          style={{
                            padding: 16,
                            borderBottom: idx < detail.historiques!.length - 1 ? '1px solid #f1f5f9' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>
                              {h.action}
                            </span>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>
                              {new Date(h.dateAction).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          {h.details && (
                            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                              {h.details}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: 40, 
                      color: '#94a3b8',
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px dashed #cbd5e1'
                    }}>
                      <History size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                      <p>Aucun historique disponible</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Formulaire Audience */}
      <Modal
        isOpen={showAudienceModal}
        onClose={() => {
          setShowAudienceModal(false)
          setSelectedAudienceId(undefined)
        }}
        title={selectedAudienceId ? 'Modifier la réunion' : 'Planifier une réunion'}
        size="lg"
      >
        <AudienceForm
          audienceId={selectedAudienceId}
          dossierId={dossierId}
          onSuccess={handleAudienceSuccess}
          onCancel={() => {
            setShowAudienceModal(false)
            setSelectedAudienceId(undefined)
          }}
        />
      </Modal>
    </Modal>
  )
}
