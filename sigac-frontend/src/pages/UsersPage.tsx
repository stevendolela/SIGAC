import { useEffect, useMemo, useState } from 'react'
import { userApi } from '../api/userApi'
import type { UserDto } from '../types/user'
import type { PaginationMetadata } from '../types/pagination'
import { useToast } from '../components/common/ToastProvider'

export default function UsersPage() {
  const [items, setItems] = useState<UserDto[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pendingSearch, setPendingSearch] = useState('')
  const { notify } = useToast()

  const fetchUsers = useMemo(() => async (p: number, q?: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await userApi.list(p, pageSize, q)
      setItems(res.data)
      setPagination(res.pagination)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  useEffect(() => {
    fetchUsers(page, search)
  }, [page, search, fetchUsers])

  useEffect(() => {
    const h = setTimeout(() => setSearch(pendingSearch), 400)
    return () => clearTimeout(h)
  }, [pendingSearch])

  async function toggleActive(u: UserDto) {
    try {
      if (u.isActive) {
        const updated = await userApi.deactivate(u.id)
        setItems(prev => prev.map(x => x.id === updated.id ? updated : x))
        notify({ type: 'success', message: `✅ Utilisateur désactivé: ${updated.username}` })
      } else {
        const updated = await userApi.activate(u.id)
        setItems(prev => prev.map(x => x.id === updated.id ? updated : x))
        notify({ type: 'success', message: `✅ Utilisateur activé: ${updated.username}` })
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur lors de la mise à jour de l\'utilisateur')
      notify({ type: 'error', message: e?.response?.data?.message || e?.message || "Erreur lors de la mise à jour de l'utilisateur" })
    }
  }

  const roleColors: Record<string, { bg: string; text: string; icon: string }> = {
    'Admin': { bg: '#fee2e2', text: '#991b1b', icon: '👑' },
    'President': { bg: '#ddd6fe', text: '#5b21b6', icon: '⚖️' },
    'JugeConstitutionnel': { bg: '#dbeafe', text: '#1e40af', icon: '👨‍⚖️' },
    'Greffier': { bg: '#d1fae5', text: '#065f46', icon: '📋' },
    'GreffierAdjoint': { bg: '#e0e7ff', text: '#3730a3', icon: '📝' }
  }

  return (
    <div className="panel">
      <div className="panel-title">👥 Gestion des Utilisateurs</div>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          placeholder="🔍 Rechercher par nom d'utilisateur ou email..."
          value={pendingSearch}
          onChange={(e) => { setPendingSearch(e.target.value); setPage(1) }}
          style={{ flex: 1 }}
        />
        {pendingSearch && (
          <button className="btn" onClick={() => { setPendingSearch(''); setPage(1) }} style={{ minWidth: 100 }}>
            Effacer
          </button>
        )}
      </div>

      {loading && <div className="info">⏳ Chargement des utilisateurs...</div>}
      {error && <div className="error">{error}</div>}
      
      {!loading && !error && (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom d'utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(u => {
                  const roleInfo = roleColors[u.role] || { bg: '#f3f4f6', text: '#374151', icon: '👤' }
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 20 }}>{roleInfo.icon}</span>
                          <span style={{ fontWeight: 600 }}>{u.username}</span>
                        </div>
                      </td>
                      <td style={{ color: '#64748b' }}>{u.email}</td>
                      <td>
                        <span 
                          className="badge" 
                          style={{ 
                            background: roleInfo.bg, 
                            color: roleInfo.text,
                            padding: '6px 12px',
                            fontWeight: 600
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="badge" 
                          style={{ 
                            background: u.isActive ? '#dcfce7' : '#fee2e2',
                            color: u.isActive ? '#15803d' : '#991b1b',
                            padding: '6px 12px',
                            fontWeight: 600
                          }}
                        >
                          {u.isActive ? '✅ Actif' : '⛔ Inactif'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn" 
                          onClick={() => toggleActive(u)}
                          style={{
                            background: u.isActive ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none'
                          }}
                        >
                          {u.isActive ? '⛔ Désactiver' : '✅ Activer'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <div className="info" style={{ textAlign: 'center', padding: 40 }}>
              🔍 Aucun utilisateur trouvé
            </div>
          )}
        </>
      )}
      
      {pagination && (
        <div className="pagination">
          <button className="btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
            ← Précédent
          </button>
          <span style={{ fontWeight: 600 }}>
            Page {pagination.page} / {pagination.totalPages} 
            <span style={{ color: '#94a3b8', marginLeft: 8 }}>
              ({pagination.totalItems} utilisateurs)
            </span>
          </span>
          <button className="btn" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}
