import { useEffect, useMemo, useState } from 'react'
import api from '../../api/api-client'
import type { DossierListDto } from '../../types/dossier'
import type { PaginatedResult, PaginationMetadata } from '../../types/pagination'

interface Props {
  onSelect?: (dossier: DossierListDto) => void
}

export default function DossierList({ onSelect }: Props) {
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

  const fetchDossiers = useMemo(() => async (p: number, q: string, st: string, pr: string) => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ page: String(p), pageSize: String(pageSize) })
      if (q?.trim()) qs.set('search', q.trim())
      if (st) qs.set('status', st)
      if (pr) qs.set('priorite', pr)
      const resp = await api.get<PaginatedResult<DossierListDto>>(`/Dossiers?${qs.toString()}`)
      setItems(resp.data.data)
      setPagination(resp.data.pagination)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [pageSize])

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
          <option value="Normale">⚪ Normale</option>
          <option value="Haute">🟡 Haute</option>
          <option value="Critique">🔴 Critique</option>
        </select>
        {(status || priorite || search) && (
          <button className="btn" onClick={() => { setPendingSearch(''); setSearch(''); setStatus(''); setPriorite(''); setPage(1) }}>Effacer</button>
        )}
      </div>

      {loading && <div className="info">Chargement…</div>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Titre</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th>Date début</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(d => (
                <tr key={d.id}>
                  <td>{d.numeroDossier}</td>
                  <td>{d.titre}</td>
                  <td>{d.typeAffaire || '-'}</td>
                  <td>
                    <span className={`badge status-${d.status?.toLowerCase() || 'nouveau'}`}>
                      {d.status === 'Nouveau' && '🆕'}
                      {d.status === 'EnInstruction' && '📝'}
                      {d.status === 'EnDelibere' && '💭'}
                      {d.status === 'Juge' && '✅'}
                      {d.status === 'Classe' && '📦'}
                      {' '}{d.status || '-'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge priorite-${d.priorite?.toLowerCase() || 'normale'}`}>
                      {d.priorite === 'Critique' && '🔴'}
                      {d.priorite === 'Haute' && '🟡'}
                      {d.priorite === 'Normale' && '⚪'}
                      {' '}{d.priorite || '-'}
                    </span>
                  </td>
                  <td>{d.dateDebut ? new Date(d.dateDebut).toLocaleDateString() : '-'}</td>
                  <td>
                    {onSelect && (
                      <button className="btn" onClick={() => onSelect(d)}>Sélectionner</button>
                    )}
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
