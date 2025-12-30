import { useEffect, useMemo, useState } from 'react'
import { FormationApi } from '../api/formationApi'
import type { CreateFormationDto, FormationDto } from '../types/formation'
import { useToast } from '../components/common/ToastProvider'
import { userApi } from '../api/userApi'
import type { UserDto } from '../types/user'

export default function FormationsPage() {
  const [items, setItems] = useState<FormationDto[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreateFormationDto>({ titre: '', description: '', organisateur: '', dateDebut: new Date().toISOString(), dateFin: new Date().toISOString(), estEnLigne: false, lieu: '' })
  const { notify } = useToast()
  const [users, setUsers] = useState<UserDto[]>([])
  const [addFor, setAddFor] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const userStr = localStorage.getItem('user')
  const user = useMemo(() => userStr ? JSON.parse(userStr) : null, [userStr])
  const isAdmin = user?.role === 'Admin' || user?.role === 'Manager'

  async function load() {
    setLoading(true)
    try {
      const data = await FormationApi.getAll()
      setItems(data)
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur chargement formations' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Charger la liste des collaborateurs
    userApi.listJuges()
      .then(res => setUsers(res))
      .catch(() => {})
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      const created = await FormationApi.create(form)
      notify({ type: 'success', message: 'Formation créée' })
      setItems([created, ...items])
      setForm({ titre: '', description: '', organisateur: '', dateDebut: new Date().toISOString(), dateFin: new Date().toISOString(), estEnLigne: false, lieu: '' })
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur création' })
    }
  }

  async function handleAddParticipant(formationId: string) {
    if (!selectedUserId) {
      notify({ type: 'info', message: 'Sélectionnez un utilisateur' })
      return
    }
    try {
      await FormationApi.addParticipant(formationId, selectedUserId)
      notify({ type: 'success', message: 'Participant ajouté' })
      setAddFor(null)
      setSelectedUserId('')
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur ajout participant' })
    }
  }

  return (
    <div className="panel">
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>🎓 Formations</span>
        {!isAdmin && <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>Lecture seule</span>}
      </div>
      {isAdmin && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 12 }}>
            <input placeholder="Titre" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required />
            <input placeholder="Organisateur" value={form.organisateur} onChange={e => setForm({ ...form, organisateur: e.target.value })} />
            <input placeholder="Lieu" value={form.lieu} onChange={e => setForm({ ...form, lieu: e.target.value })} />
            <label>Début <input type="datetime-local" value={form.dateDebut.substring(0,16)} onChange={e => setForm({ ...form, dateDebut: new Date(e.target.value).toISOString() })} /></label>
            <label>Fin <input type="datetime-local" value={form.dateFin.substring(0,16)} onChange={e => setForm({ ...form, dateFin: new Date(e.target.value).toISOString() })} /></label>
            <label><input type="checkbox" checked={form.estEnLigne} onChange={e => setForm({ ...form, estEnLigne: e.target.checked })} /> En ligne</label>
          </div>
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div style={{ marginTop: 8 }}>
            <button className="btn">➕ Créer</button>
          </div>
        </form>
      )}

      {loading && <div>Chargement…</div>}
      {!loading && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Organisateur</th>
                <th>Dates</th>
                <th>Lieu</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {items.map(f => (
                <>
                  <tr key={f.id}>
                    <td>{f.titre}</td>
                    <td>{f.organisateur || '-'}</td>
                    <td>{new Date(f.dateDebut).toLocaleString('fr-FR')} → {new Date(f.dateFin).toLocaleString('fr-FR')}</td>
                    <td>{f.lieu || '-'}</td>
                    <td>{f.estEnLigne ? 'En ligne' : 'Présentiel'}</td>
                  </tr>
                  {isAdmin && (
                    <tr key={f.id + '-actions'}>
                      <td colSpan={5}>
                        {addFor === f.id ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                              <option value="">— Choisir un utilisateur —</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{u.username}</option>
                              ))}
                            </select>
                            <button className="btn" onClick={() => handleAddParticipant(f.id)}>➕ Ajouter</button>
                            <button className="btn" onClick={() => { setAddFor(null); setSelectedUserId('') }} style={{ background: '#e5e7eb', color: '#111827' }}>Annuler</button>
                          </div>
                        ) : (
                          <button className="btn" onClick={() => setAddFor(f.id)}>👥 Ajouter un participant</button>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
