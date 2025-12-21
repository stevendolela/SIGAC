import { useEffect, useMemo, useState } from 'react'
import { StatusBadge } from './StatusBadge'
import api from '../../api/api-client'
import { useToast } from '../common/ToastProvider'
import { useWorkspaceStore } from '../../store/workspaceStore'
import type { DossierListDto } from '../../types/dossier'
import type { PaginatedResult, PaginationMetadata } from '../../types/pagination'

interface Props {
  onSelect?: (dossier: DossierListDto) => void
}

export default function DossierList({ onSelect }: Props) {
  const { notify } = useToast()
  const { currentWorkspace } = useWorkspaceStore()
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const isAdmin = user?.role === 'Administrateur'  // Backend envoie "Administrateur" pas "Admin"
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
      // 🆕 Les admins voient TOUS les dossiers si aucun workspace n'est sélectionné
      // Pour les autres rôles, on filtre toujours par workspace
      if (currentWorkspace?.id && !isAdmin) {
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

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* En-tête avec statistiques */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: '#111827',
            margin: 0,
            marginBottom: 4
          }}>📁 Dossiers</h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: 14,
            margin: 0 
          }}>
            {pagination ? `${pagination.totalItems} dossier${pagination.totalItems > 1 ? 's' : ''} au total` : 'Chargement...'}
          </p>
        </div>
      </div>

      {/* Filtres modernes */}
      <div style={{ 
        background: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="🔍 Rechercher un dossier..."
            value={pendingSearch}
            onChange={(e) => { setPendingSearch(e.target.value); setPage(1) }}
            style={{ 
              flex: '1 1 250px',
              minWidth: 200,
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid #e5e7eb',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            style={{ 
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid #e5e7eb',
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer',
              background: 'white'
            }}
          >
            <option value="">📋 Tous statuts</option>
            <option value="Nouveau">🆕 Nouveau</option>
            <option value="EnInstruction">📝 En instruction</option>
            <option value="EnDelibere">💭 En délibéré</option>
            <option value="Juge">✅ Jugé</option>
            <option value="Classe">📦 Classé</option>
          </select>
          <select
            value={priorite}
            onChange={(e) => { setPriorite(e.target.value); setPage(1) }}
            style={{ 
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid #e5e7eb',
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer',
              background: 'white'
            }}
          >
            <option value="">🎯 Toutes priorités</option>
            <option value="Basse">⚪ Basse</option>
            <option value="Normale">⚪ Normale</option>
            <option value="Haute">🟡 Haute</option>
            <option value="Urgente">🔴 Urgente</option>
          </select>
          {(status || priorite || search) && (
            <button 
              onClick={() => { setPendingSearch(''); setSearch(''); setStatus(''); setPriorite(''); setPage(1) }}
              style={{
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
              ✕ Effacer
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p>Chargement des dossiers...</p>
        </div>
      )}
      
      {error && (
        <div style={{ 
          background: '#fef2f2',
          border: '2px solid #fecaca',
          borderRadius: 12,
          padding: 16,
          color: '#991b1b',
          textAlign: 'center'
        }}>
          ❌ {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ 
          textAlign: 'center',
          padding: 60,
          background: 'white',
          borderRadius: 16,
          border: '2px dashed #e5e7eb'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
          <p style={{ color: '#6b7280', fontSize: 16 }}>Aucun dossier trouvé</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(d => (
            <div
              key={d.id}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 20,
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              onClick={() => onSelect && onSelect(d)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                {/* Gauche: Info principale */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ 
                      fontWeight: 700,
                      fontSize: 16,
                      color: '#1e40af',
                      fontFamily: 'monospace'
                    }}>
                      {d.numeroDossier}
                    </span>
                    <StatusBadge kind="priorite" priorite={d.priorite as any} />
                  </div>
                  <h3 style={{ 
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#111827',
                    margin: '0 0 8px 0',
                    lineHeight: 1.4
                  }}>
                    {d.titre}
                  </h3>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#6b7280' }}>
                    <span>📋 {formatTypeAffaire(d.type || d.typeAffaire)}</span>
                    <span>📅 {(d.dateDepot || d.dateDebut) 
                      ? new Date(d.dateDepot || d.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '-'
                    }</span>
                  </div>
                </div>

                {/* Droite: Statut et actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <StatusBadge kind="status" status={d.status as any} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    {onSelect && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelect(d) }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: '#3b82f6',
                          color: 'white',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                      >
                        👁️ Voir
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteDossier(d.id, d.numeroDossier) }}
                        disabled={deleting === d.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: 'none',
                          background: deleting === d.id ? '#9ca3af' : '#ef4444',
                          color: 'white',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: deleting === d.id ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => !deleting && (e.currentTarget.style.background = '#dc2626')}
                        onMouseLeave={(e) => !deleting && (e.currentTarget.style.background = '#ef4444')}
                      >
                        {deleting === d.id ? '⏳' : '🗑️'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          marginTop: 32,
          padding: 20,
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e5e7eb'
        }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: page <= 1 ? '#f3f4f6' : '#3b82f6',
              color: page <= 1 ? '#9ca3af' : 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ← Précédent
          </button>
          <span style={{ 
            padding: '10px 16px',
            fontWeight: 600,
            color: '#111827',
            fontSize: 14
          }}>
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: pagination.page >= pagination.totalPages ? '#f3f4f6' : '#3b82f6',
              color: pagination.page >= pagination.totalPages ? '#9ca3af' : 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}
