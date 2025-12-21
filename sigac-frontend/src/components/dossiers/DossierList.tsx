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
    <div className="panel">
      <div className="panel-title">📁 Liste des Dossiers</div>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Recherche déplacée dans la barre fixe globale */}
        <input
          placeholder="🔍 Recherche rapide..."
          value={pendingSearch}
          onChange={(e) => { setPendingSearch(e.target.value); setPage(1) }}
          style={{ flex: '1 1 250px', minWidth: 200, padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          style={{ minWidth: 140, padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
        >
          <option value="">📋 Tous statuts</option>
          {/* Valeurs exactes du enum backend StatusDossier */}
          <option value="Nouveau">🆕 Nouveau</option>
          <option value="EnInstruction">📝 En instruction</option>
          <option value="EnDelibere">💭 En délibéré</option>
          <option value="Juge">✅ Jugé</option>
          <option value="Classe">📦 Classé</option>
        </select>
        <select
          value={priorite}
          onChange={(e) => { setPriorite(e.target.value); setPage(1) }}
          style={{ minWidth: 130, padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
        >
          <option value="">🎯 Toutes priorités</option>
          {/* Valeurs exactes du enum backend PrioriteDossier */}
          <option value="Basse">⚪ Basse</option>
          <option value="Normale">⚪ Normale</option>
          <option value="Haute">🟡 Haute</option>
          <option value="Urgente">🔴 Urgente</option>
        </select>
        {(status || priorite || search) && (
          <button className="btn" onClick={() => { setPendingSearch(''); setSearch(''); setStatus(''); setPriorite(''); setPage(1) }} style={{ padding: '10px 16px' }}>🗑️ Effacer filtres</button>
        )}
      </div>

      {loading && <div className="info">Chargement…</div>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '120px', whiteSpace: 'nowrap' }}>Numéro</th>
                <th style={{ minWidth: '200px' }}>Titre</th>
                <th style={{ width: '180px' }}>Type</th>
                <th style={{ width: '130px', textAlign: 'center' as const }}>Statut</th>
                <th style={{ width: '120px', textAlign: 'center' as const }}>Priorité</th>
                <th style={{ width: '160px' }}>Date dépôt</th>
                <th style={{ width: '120px', textAlign: 'center' as const }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(d => (
                <tr key={d.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{d.numeroDossier}</td>
                  <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.titre}>{d.titre}</td>
                  <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={formatTypeAffaire(d.type || d.typeAffaire)}>{formatTypeAffaire(d.type || d.typeAffaire)}</td>
                  <td style={{ textAlign: 'center' }}><StatusBadge kind="status" status={d.status as any} /></td>
                  <td style={{ textAlign: 'center' }}><StatusBadge kind="priorite" priorite={d.priorite as any} /></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {(d.dateDepot || d.dateDebut) 
                      ? new Date(d.dateDepot || d.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '-'
                    }
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                      {onSelect && (
                        <button className="btn" onClick={() => onSelect(d)} style={{ fontSize: '12px', padding: '4px 8px' }}>👁️ Voir</button>
                      )}
                      {isAdmin && (
                        <button 
                          className="btn" 
                          onClick={() => handleDeleteDossier(d.id, d.numeroDossier)}
                          disabled={deleting === d.id}
                          style={{ 
                            background: deleting === d.id ? '#999' : '#dc2626',
                            color: 'white',
                            fontSize: '12px',
                            padding: '4px 8px'
                          }}
                        >
                          {deleting === d.id ? '⏳' : '🗑️'}
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
      {pagination && (
        <div className="pagination">
          <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</button>
          <span>Page {pagination.page} / {pagination.totalPages}</span>
          <button className="btn" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Suivant</button>
        </div>
      )}
    </div>
  )
}
