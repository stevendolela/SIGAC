import { useEffect, useMemo, useRef, useState } from 'react'
import { JugeApi } from '../api/jugeApi'
import { userApi } from '../api/userApi'
import type { JugeProfileDto } from '../types/juge'
import type { UserDto } from '../types/user'
import { useToast } from '../components/common/ToastProvider'
import { SkeletonTableRows } from '../components/common/LoadingSkeleton'

export default function JugeProfilesPage() {
  const [items, setItems] = useState<JugeProfileDto[]>([])
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const { notify } = useToast()
  const focusRef = useRef<HTMLDivElement | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [profiles, juges] = await Promise.all([
        JugeApi.getAll(),
        userApi.listJuges()
      ])
      setItems(profiles)
      const map: Record<string, string> = {}
      juges.forEach((u: UserDto) => {
        map[u.id] = u.nomComplet || u.username
      })
      setUsers(map)
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur chargement profils' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { focusRef.current?.focus() }, [loading])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const sorted = [...items].sort((a, b) => {
      const an = (users[a.userId] || '').toLowerCase()
      const bn = (users[b.userId] || '').toLowerCase()
      return an.localeCompare(bn)
    })
    if (!term) return sorted
    return sorted.filter(p => (users[p.userId] || '').toLowerCase().includes(term) || (p.specialisations || '').toLowerCase().includes(term))
  }, [items, search, users])

  return (
    <div className="panel" ref={focusRef} tabIndex={-1} aria-labelledby="juges-heading">
      <div className="panel-title" id="juges-heading">👩‍⚖️ Profils des Juges</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <input
          className="focus-outline"
          placeholder="🔍 Rechercher juge ou spécialisation..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Rechercher juge"
          style={{ maxWidth: 340 }}
        />
        <button
          className="btn"
          disabled={loading}
          onClick={() => load()}
          style={{ minWidth: 140 }}
          aria-label="Recharger la liste des juges"
        >🔄 Rafraîchir</button>
        {search && (
          <button className="btn btn-secondary" onClick={() => setSearch('')} aria-label="Effacer recherche">❌ Effacer</button>
        )}
      </div>
      <div className="table-wrapper" role="region" aria-live="polite" aria-busy={loading}>
        <table className="table" aria-describedby="juges-caption">
          <caption id="juges-caption" style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, color: '#64748b' }}>
            Liste des juges constitutionnels avec tri alphabétique et recherche locale.
          </caption>
          <thead>
            <tr>
              <th>Juge</th>
              <th>Grade</th>
              <th>Spécialisations</th>
              <th>Téléphone</th>
              <th>Date Nomination</th>
            </tr>
          </thead>
          {loading && <SkeletonTableRows rows={5} cols={5} />}
          {!loading && (
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>{users[p.userId] || p.userId}</td>
                  <td>{p.grade}</td>
                  <td>{p.specialisations || '-'}</td>
                  <td>{p.telephone || '-'}</td>
                  <td>{p.dateNomination ? new Date(p.dateNomination).toLocaleDateString('fr-FR') : '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>Aucun juge ne correspond à la recherche.</td></tr>
              )}
            </tbody>
          )}
        </table>
      </div>
    </div>
  )
}
