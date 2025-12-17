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
      // 🆕 FILTRAGE PAR WORKSPACE
      if (currentWorkspace?.id) qs.set('workspaceId', currentWorkspace.id)
      const resp = await api.get<PaginatedResult<DossierListDto>>(`/Dossiers?${qs.toString()}`)
      setItems(resp.data.data)
      setPagination(resp.data.pagination)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [pageSize, currentWorkspace?.id])

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
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Rechercher par titre, numéro..."
          value={pendingSearch}
          onChange={(e) => { setPendingSearch(e.target.value); setPage(1) }}
          style={{ flex: '1 1 300px', minWidth: 250 }}
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          style={{ minWidth: 140 }}
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
          style={{ minWidth: 130 }}
        >
          <option value="">🎯 Toutes priorités</option>
          {/* Valeurs exactes du enum backend PrioriteDossier */}
          <option value="Basse">⚪ Basse</option>
          <option value="Normale">⚪ Normale</option>
          <option value="Haute">🟡 Haute</option>
          <option value="Urgente">🔴 Urgente</option>
        </select>
        {(status || priorite || search) && (
          <button className="btn" onClick={() => { setPendingSearch(''); setSearch(''); setStatus(''); setPriorite(''); setPage(1) }}>Effacer</button>
        )}
      </div>

      {loading && <div className="info">Chargement…</div>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <div className="table-wrapper" style={{ fontSize: '13px' }}>
          <table className="table" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ fontSize: '13px' }}>Numéro</th>
                <th style={{ fontSize: '13px' }}>Titre</th>
                <th style={{ fontSize: '13px' }}>Type</th>
                <th style={{ fontSize: '13px' }}>Statut</th>
                <th style={{ fontSize: '13px' }}>Priorité</th>
                <th style={{ fontSize: '13px' }}>Date début</th>
                <th style={{ fontSize: '13px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map(d => (
                <tr key={d.id}>
                  <td>{d.numeroDossier}</td>
                  <td>{d.titre}</td>
                  <td>{formatTypeAffaire(d.type || d.typeAffaire)}</td>
                  <td><StatusBadge kind="status" status={d.status as any} /></td>
                  <td><StatusBadge kind="priorite" priorite={d.priorite as any} /></td>
                  <td>
                    {(d.dateDepot || d.dateDebut) 
                      ? new Date(d.dateDepot || d.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '-'
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
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
