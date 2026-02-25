import { useEffect, useMemo, useState } from 'react'
import { FolderOpen, Eye, Trash2, FileText, Calendar, User, RefreshCw, Search, X, ChevronLeft, ChevronRight, AlertCircle, Clock, CheckCircle2, Archive, Sparkles, Loader2 } from 'lucide-react'
import api from '../../api/api-client'
import { useToast } from '../common/ToastProvider'
import { useWorkspaceStore } from '../../store/workspaceStore'
import type { DossierListDto } from '../../types/dossier'
import type { PaginatedResult, PaginationMetadata } from '../../types/pagination'

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
  onSelect?: (dossier: DossierListDto) => void
}

export default function DossierList({ onSelect }: Props) {
  const { notify } = useToast()
  const { currentWorkspace } = useWorkspaceStore()
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const isAdmin = user?.role === 'Admin'
  const [items, setItems] = useState<DossierListDto[]>([])
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pendingSearch, setPendingSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [priorite, setPriorite] = useState<string>('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Fonction pour supprimer un dossier
  const handleDeleteDossier = async (dossierId: string, numeroDossier: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le dossier ${numeroDossier}? Cette action est irréversible.`)) {
      return
    }

    setDeleting(dossierId)
    try {
      await api.delete(`/Dossiers/${dossierId}`)
      notify({ type: 'success', message: `✅ Dossier ${numeroDossier} supprimé avec succès` })
      setItems(items.filter(d => d.id !== dossierId))
    } catch (error: any) {
      notify({ type: 'error', message: error?.response?.data?.message || 'Erreur lors de la suppression' })
    } finally {
      setDeleting(null)
    }
  }

  // Helper pour formater le type d'affaire avec des espaces
  const formatTypeAffaire = (type?: string | null): string => {
    if (!type) return '-'
    // Ajoute un espace avant chaque majuscule (sauf la première)
    return type.replace(/([A-Z])/g, ' $1').trim()
  }

  const fetchDossiers = useMemo(() => async (p: number, q: string, st: string, pr: string) => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ page: String(p), pageSize: String(pageSize) })
      if (q?.trim()) qs.set('search', q.trim())
      if (st) qs.set('status', st)
      if (pr) qs.set('priorite', pr)
      // Filtrer par workspace sélectionné (tous les utilisateurs)
      if (currentWorkspace?.id) {
        qs.set('workspaceId', currentWorkspace.id)
      }
      const resp = await api.get<PaginatedResult<DossierListDto>>(`/Dossiers?${qs.toString()}`)
      setItems(resp.data.data)
      setPagination(resp.data.pagination)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [pageSize, currentWorkspace?.id, isAdmin])

  useEffect(() => {
    fetchDossiers(page, search, status, priorite)
  }, [page, search, status, priorite, fetchDossiers])

  // Debounce de 400ms pour la recherche
  useEffect(() => {
    const h = setTimeout(() => setSearch(pendingSearch), 400)
    return () => clearTimeout(h)
  }, [pendingSearch])

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDossiers(page, search, status, priorite)
    setRefreshing(false)
  }

  // Helper pour formater la date
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* En-tête moderne avec gradient */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <FolderOpen size={24} color="white" />
          </div>
          <div>
            <h1 style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              color: '#1e293b',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              Dossiers
              <Sparkles size={20} color="#f59e0b" />
            </h1>
            <p style={{ 
              color: '#64748b', 
              fontSize: 14,
              margin: 0 
            }}>
              {pagination ? `${pagination.totalItems} dossier${pagination.totalItems > 1 ? 's' : ''} au total` : 'Chargement...'}
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: refreshing || loading ? 'not-allowed' : 'pointer',
            opacity: refreshing || loading ? 0.7 : 1,
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </div>

      {/* Filtres modernes */}
      <div style={{ 
        background: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              placeholder="Rechercher un dossier..."
              value={pendingSearch}
              onChange={(e) => { setPendingSearch(e.target.value); setPage(1) }}
              style={{ 
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            style={{ 
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer',
              background: 'white',
              minWidth: 150
            }}
          >
            <option value="">Tous statuts</option>
            <option value="Nouveau">Nouveau</option>
            <option value="EnCours">En cours</option>
            <option value="EnValidation">En validation</option>
            <option value="Valide">Validé</option>
            <option value="Termine">Terminé</option>
          </select>
          <select
            value={priorite}
            onChange={(e) => { setPriorite(e.target.value); setPage(1) }}
            style={{ 
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer',
              background: 'white',
              minWidth: 150
            }}
          >
            <option value="">Toutes priorités</option>
            <option value="Basse">Basse</option>
            <option value="Normale">Normale</option>
            <option value="Haute">Haute</option>
            <option value="Urgente">Urgente</option>
          </select>
          {(status || priorite || search) && (
            <button 
              onClick={() => { setPendingSearch(''); setSearch(''); setStatus(''); setPriorite(''); setPage(1) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 20px',
                borderRadius: 12,
                border: 'none',
                background: '#ef4444',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
            >
              <X size={16} />
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: 60, 
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e2e8f0'
        }}>
          <Loader2 size={48} color="#3b82f6" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <p style={{ color: '#64748b', fontSize: 16 }}>Chargement des dossiers...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div style={{ 
          background: '#fef2f2',
          border: '2px solid #fecaca',
          borderRadius: 12,
          padding: 20,
          color: '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <AlertCircle size={24} />
          <span>{error}</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div style={{ 
          textAlign: 'center',
          padding: 60,
          background: 'white',
          borderRadius: 16,
          border: '2px dashed #e2e8f0'
        }}>
          <FolderOpen size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
          <p style={{ color: '#64748b', fontSize: 16, fontWeight: 500 }}>Aucun dossier trouvé</p>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Modifiez vos filtres ou créez un nouveau dossier</p>
        </div>
      )}

      {/* Table des dossiers */}
      {!loading && !error && items.length > 0 && (
        <div style={{ 
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', padding: '8px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Référence</th>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Titre</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Statut</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priorité</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(d => (
                <tr
                  key={d.id}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <td 
                    onClick={() => onSelect && onSelect(d)}
                    style={{ 
                      padding: '16px', 
                      borderRadius: '12px 0 0 12px',
                      fontWeight: 700,
                      color: '#4f46e5',
                      fontSize: '13px',
                      fontFamily: 'monospace'
                    }}
                  >
                    {d.numeroDossier}
                  </td>
                  <td 
                    onClick={() => onSelect && onSelect(d)}
                    style={{ 
                      padding: '16px',
                      fontWeight: 500,
                      color: '#1e293b',
                      maxWidth: '300px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={d.titre}
                  >
                    {d.titre}
                  </td>
                  <td 
                    onClick={() => onSelect && onSelect(d)}
                    style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}
                  >
                    {formatTypeAffaire(d.type || d.typeAffaire)}
                  </td>
                  <td 
                    onClick={() => onSelect && onSelect(d)}
                    style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    {formatDate(d.dateDepot || d.dateDebut)}
                  </td>
                  <td 
                    onClick={() => onSelect && onSelect(d)}
                    style={{ padding: '16px', textAlign: 'center' }}
                  >
                    <span
                      style={{
                        backgroundColor: STATUS_COLORS[getStatus(d.status)],
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-block',
                        minWidth: '85px'
                      }}
                    >
                      {STATUS_LABELS[getStatus(d.status)]}
                    </span>
                  </td>
                  <td 
                    onClick={() => onSelect && onSelect(d)}
                    style={{ padding: '16px', textAlign: 'center' }}
                  >
                    <span
                      style={{
                        color: PRIORITE_COLORS[getPriorite(d.priorite)],
                        borderColor: PRIORITE_COLORS[getPriorite(d.priorite)],
                        border: '2px solid',
                        padding: '5px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: PRIORITE_COLORS[getPriorite(d.priorite)], 
                        display: 'inline-block' 
                      }}></span>
                      {PRIORITE_LABELS[getPriorite(d.priorite)]}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      {onSelect && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelect(d) }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <Eye size={14} />
                          Voir
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteDossier(d.id, d.numeroDossier) }}
                          disabled={deleting === d.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: 'none',
                            background: deleting === d.id ? '#9ca3af' : '#ef4444',
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: deleting === d.id ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { if (deleting !== d.id) e.currentTarget.style.background = '#dc2626' }}
                          onMouseLeave={(e) => { if (deleting !== d.id) e.currentTarget.style.background = '#ef4444' }}
                        >
                          {deleting === d.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          marginTop: 24,
          padding: 16,
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e2e8f0'
        }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: page <= 1 ? '#f1f5f9' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: page <= 1 ? '#94a3b8' : 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <ChevronLeft size={16} />
            Précédent
          </button>
          <span style={{ 
            padding: '10px 20px',
            fontWeight: 600,
            color: '#1e293b',
            fontSize: 14,
            background: '#f8fafc',
            borderRadius: 8
          }}>
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: pagination.page >= pagination.totalPages ? '#f1f5f9' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: pagination.page >= pagination.totalPages ? '#94a3b8' : 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Suivant
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* CSS Animation for spin */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
