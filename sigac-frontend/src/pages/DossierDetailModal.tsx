import { useEffect, useState } from 'react'
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
  const [viewerDoc, setViewerDoc] = useState<{ blob: Blob; name: string } | null>(null)
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

  // Helper functions pour les badges
  function getStatusBadge(status?: string | null) {
    const colors: Record<string, { bg: string; text: string; label: string }> = {
      'Nouveau': { bg: '#dbeafe', text: '#1e40af', label: '🆕 Nouveau' },
      'EnCours': { bg: '#fef3c7', text: '#92400e', label: '📝 En Cours' },
      'EnValidation': { bg: '#e0e7ff', text: '#3730a3', label: '💭 En Validation' },
      'Valide': { bg: '#d1fae5', text: '#065f46', label: '✅ Validé' },
      'Termine': { bg: '#f3f4f6', text: '#374151', label: '📦 Terminé' }
    }
    const config = colors[status || ''] || { bg: '#f3f4f6', text: '#6b7280', label: status || '-' }
    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 600,
        background: config.bg,
        color: config.text,
        display: 'inline-block'
      }}>
        {config.label}
      </span>
    )
  }

  function getPriorityBadge(priority?: string | null) {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      'Normale': { bg: '#e0e7ff', text: '#3730a3', icon: '📋' },
      'Haute': { bg: '#fef3c7', text: '#92400e', icon: '⚠️' },
      'Critique': { bg: '#fee2e2', text: '#991b1b', icon: '🔥' }
    }
    const config = colors[priority || ''] || { bg: '#f3f4f6', text: '#6b7280', icon: '📌' }
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        background: config.bg,
        color: config.text,
        display: 'inline-block'
      }}>
        {config.icon} {priority || '-'}
      </span>
    )
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
      setViewerDoc({ blob, name: doc.nomFichier })
      notify({ type: 'success', message: '👁️ Document ouvert' })
      if (showVisHistory) {
        setTimeout(() => loadVisualisations(), 500)
      }
    } catch (e) {
      setError('Visualisation impossible')
      notify({ type: 'error', message: 'Visualisation impossible' })
    }
  }

  async function remove(doc: DocumentDto) {
    if (!confirm(`Supprimer "${doc.nomFichier}" ?`)) return
    try {
      await documentApi.remove(doc.id)
      setDocs(prev => prev.filter(d => d.id !== doc.id))
      notify({ type: 'success', message: '🗑️ Document supprimé' })
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
      notify({ type: 'success', message: 'Juge affecté' })
      const updated = await dossierApi.getById(dossierId)
      setDetail(updated)
      setRapporteurId('')
    } catch (e) {
      setError('Erreur attribution juge')
      notify({ type: 'error', message: 'Erreur attribution juge' })
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
      notify({ type: 'success', message: '✅ Document uploadé avec succès !' })
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

  // Composants helper
  function InfoCard({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
    return (
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
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
          {icon && <span>{icon}</span>}
          <span>{title}</span>
        </div>
        {children}
      </div>
    )
  }

  function InfoRow({ label, value }: { label: string; value: string }) {
    return (
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ color: '#64748b', fontSize: 13 }}>{label}:</span>
        <span style={{ color: '#1e293b', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{value}</span>
      </div>
    )
  }

  function TabButton({ tab, label, icon }: { tab: typeof activeTab; label: string; icon: string }) {
    const isActive = activeTab === tab
    return (
      <button
        onClick={() => setActiveTab(tab)}
        style={{
          flex: 1,
          padding: '12px 16px',
          border: 'none',
          background: isActive ? 'white' : 'transparent',
          color: isActive ? '#5b21b6' : '#64748b',
          fontWeight: isActive ? 600 : 400,
          fontSize: 14,
          cursor: 'pointer',
          borderBottom: isActive ? '2px solid #5b21b6' : '2px solid transparent',
          transition: 'all 0.2s'
        }}
      >
        {icon} {label}
      </button>
    )
  }

  return (
    <Modal isOpen onClose={onClose} size="xl" title={`Dossier ${detail?.numeroDossier || ''}`}>
      <div style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        {loading && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ 
              margin: '0 auto 16px',
              width: 40,
              height: 40,
              border: '4px solid #f3f4f6',
              borderTopColor: '#5b21b6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ color: '#64748b' }}>Chargement du dossier...</p>
          </div>
        )}
        
        {error && (
          <div style={{ 
            padding: 16, 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: 8,
            color: '#991b1b',
            marginBottom: 16
          }}>
            <strong>❌ Erreur:</strong> {error}
          </div>
        )}
        
        {detail && (
          <div>
            {/* En-tête moderne avec gradient */}
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '28px 32px',
              borderRadius: '12px 12px 0 0',
              color: 'white',
              marginBottom: 0
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 6, letterSpacing: '0.5px' }}>
                    📋 Dossier N°
                  </div>
                  <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, lineHeight: 1.3 }}>
                    {detail.numeroDossier}
                  </h2>
                  <div style={{ fontSize: 18, marginTop: 8, opacity: 0.95 }}>
                    {detail.titre}
                  </div>
                  
                  {/* Informations clés */}
                  <div style={{ 
                    display: 'flex', 
                    gap: 20, 
                    marginTop: 16,
                    fontSize: 14,
                    opacity: 0.95
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⚖️</span>
                      <span><strong>Type:</strong> {formatTypeAffaire(detail.type || detail.typeAffaire)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📅</span>
                      <span><strong>Dépôt:</strong> {(detail.dateDepot || detail.dateDebut || detail.createdAt) ? new Date(detail.dateDepot || detail.dateDebut || detail.createdAt!).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      }) : 'Non renseignée'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {getStatusBadge(detail.status)}
                  <div style={{ marginTop: 10 }}>
                    {getPriorityBadge(detail.priorite)}
                  </div>
                </div>
              </div>
            </div>

            {/* Grille d'informations principales */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
              padding: '24px 32px',
              background: '#f8fafc'
            }}>
              {/* Parties */}
              <InfoCard title="Parties" icon="👥">
                <InfoRow label="Demandeur" value={detail.demandeur} />
                {detail.defendeur && <InfoRow label="Tiers concerné" value={detail.defendeur} />}
              </InfoCard>

              {/* Responsable assigné */}
              <InfoCard title="Responsable assigné" icon="👤">
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
                      color: '#5b21b6'
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
              </InfoCard>

              {/* Informations générales */}
              <InfoCard title="Informations" icon="📊">
                <InfoRow label="Catégorie" value={formatTypeAffaire(detail.type || detail.typeAffaire)} />
                <InfoRow 
                  label="Date de dépôt" 
                  value={(detail.dateDepot || detail.dateDebut || detail.createdAt) ? new Date(detail.dateDepot || detail.dateDebut || detail.createdAt!).toLocaleDateString('fr-FR') : '-'} 
                />
              </InfoCard>
            </div>

            {/* Description si présente */}
            {detail.description && (
              <div style={{ padding: '0 32px 24px', background: '#f8fafc' }}>
                <div style={{ 
                  background: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: 20
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📝</span>
                    <span>Description</span>
                  </div>
                  <div style={{ color: '#334155', lineHeight: 1.6, fontSize: 14 }}>
                    {detail.description}
                  </div>
                </div>
              </div>
            )}

            {/* Tabs de navigation */}
            <div style={{ 
              display: 'flex', 
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              padding: '0 32px'
            }}>
              <TabButton tab="documents" label="Documents" icon="📄" />
              <TabButton tab="audiences" label="Audiences" icon="📅" />
              <TabButton tab="actions" label="Actions" icon="⚙️" />
              <TabButton tab="historique" label="Historique" icon="📜" />
            </div>

            {/* Contenu des tabs */}
            <div style={{ padding: '24px 32px', minHeight: 300 }}>
              {/* Tab Documents */}
              {activeTab === 'documents' && (
                <div>
                  {/* Formulaire d'upload moderne */}
                  <div style={{ 
                    marginBottom: 24, 
                    padding: 20, 
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', 
                    borderRadius: 12, 
                    border: '2px dashed #c7d2fe' 
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#3730a3', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>📤</span>
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
                        <option value="Document">📄 Document</option>
                        <option value="Requête">📋 Requête</option>
                        <option value="Pièce justificative">📎 Pièce justificative</option>
                        <option value="Rapport">📊 Rapport</option>
                        <option value="Décision">✅ Décision</option>
                        <option value="Autre">📌 Autre</option>
                      </select>
                      <button 
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        style={{
                          padding: '10px 24px',
                          background: !selectedFile || uploading ? '#cbd5e1' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
                          fontSize: 14,
                          transition: 'all 0.2s',
                          boxShadow: !selectedFile || uploading ? 'none' : '0 2px 8px rgba(102, 126, 234, 0.3)'
                        }}
                      >
                        {uploading ? '⏳ Upload en cours...' : '📤 Uploader'}
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
                        border: '1px solid #e0e7ff'
                      }}>
                        📎 <b>{selectedFile.name}</b> • {(selectedFile.size / 1024).toFixed(1)} Ko
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
                    <span>📅</span>
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
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
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
                                  <span>📄</span>
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
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    👁️ Voir
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
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    📥 Télécharger
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
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    🗑️
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
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 16 }}>
                          📊 Historique des visualisations
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
                                        {v.typeVisualisation === 'view' ? '👁️ Vue' : '📥 DL'}
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
                      {showVisHistory ? '🔽 Masquer historique' : '📊 Voir historique visualisations'}
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
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 14,
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                      }}
                    >
                      📅 Planifier une audience
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
                  {/* Affecter un juge */}
                  <div style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 24
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>�</span>
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
                          background: !rapporteurId ? '#cbd5e1' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: !rapporteurId ? 'not-allowed' : 'pointer',
                          fontSize: 14
                        }}
                      >
                        ✅ Affecter
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
                      <span>🔄</span>
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
                        <option value="1">🆕 Nouveau</option>
                        <option value="2">📝 En Cours</option>
                        <option value="3">💭 En Validation</option>
                        <option value="4">✅ Validé</option>
                        <option value="5">📦 Terminé</option>
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
                          background: !nouveauStatut ? '#cbd5e1' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: !nouveauStatut ? 'not-allowed' : 'pointer',
                          fontSize: 14
                        }}
                      >
                        🔄 Modifier
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
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
                      <p>Aucun historique disponible</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Viewer pour documents */}
      {viewerDoc && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px'
          }}
          onClick={() => setViewerDoc(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
                📄 {viewerDoc.name}
              </h3>
              <button
                onClick={() => setViewerDoc(null)}
                style={{
                  background: '#fee2e2',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#991b1b',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontWeight: 600
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <iframe
                src={URL.createObjectURL(viewerDoc.blob)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                title={viewerDoc.name}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulaire Audience */}
      <Modal
        isOpen={showAudienceModal}
        onClose={() => {
          setShowAudienceModal(false)
          setSelectedAudienceId(undefined)
        }}
        title={selectedAudienceId ? 'Modifier l\'audience' : 'Planifier une audience'}
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
