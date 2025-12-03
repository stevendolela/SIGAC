import { useEffect, useMemo, useState } from 'react'
import { salleApi } from '../api/salleApi'
import type { SalleListDto, SalleDetailDto } from '../types/salle'
import Modal from '../components/common/Modal'
import { useToast } from '../components/common/ToastProvider'

type FormMode = 'create' | 'edit'

interface SalleFormState {
  nom: string
  description: string
  capacite: number | ''
  estActive?: boolean
}

export default function SallesPage() {
  const [salles, setSalles] = useState<SalleListDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeOnly, setActiveOnly] = useState(true)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editingSalle, setEditingSalle] = useState<SalleDetailDto | null>(null)
  const [form, setForm] = useState<SalleFormState>({ nom: '', description: '', capacite: '' })
  const [submitting, setSubmitting] = useState(false)
  const { notify } = useToast()

  const canSubmit = useMemo(() => {
    const nameOk = form.nom.trim().length > 0
    const capOk = form.capacite === '' || (typeof form.capacite === 'number' && form.capacite >= 0)
    return nameOk && capOk
  }, [form])

  useEffect(() => {
    loadSalles()
  }, [activeOnly])

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      setIsAdmin(user?.role === 'Administrateur')
    } catch {
      setIsAdmin(false)
    }
  }, [])

  async function loadSalles() {
    try {
      setLoading(true)
      setError(null)
      const data = await salleApi.list(activeOnly)
      setSalles(data)
    } catch (e: any) {
      const status = e?.response?.status as number | undefined
      const baseUrl = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000/api'
      const friendly = status === 404
        ? `L'endpoint des salles n'est pas disponible (404) sur ${baseUrl}. Vérifiez que le backend est redémarré avec la dernière version et que l'URL API est correcte.`
        : (e?.message ?? 'Erreur de chargement')
      setError(friendly)
      notify({ type: 'error', message: `❌ ${status ? status + ' - ' : ''}${friendly}` })
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    if (!isAdmin) return
    setFormMode('create')
    setEditingSalle(null)
    setForm({ nom: '', description: '', capacite: '' })
    setFormOpen(true)
  }

  async function openEdit(id: string) {
    if (!isAdmin) return
    try {
      setLoading(true)
      const detail = await salleApi.get(id)
      setEditingSalle(detail)
      setForm({
        nom: detail.nom,
        description: detail.description ?? '',
        capacite: detail.capacite
      })
      setFormMode('edit')
      setFormOpen(true)
    } catch (e: any) {
      notify({ type: 'error', message: '❌ Impossible de charger la salle' })
    } finally {
      setLoading(false)
    }
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    try {
      setSubmitting(true)
      if (formMode === 'create') {
        await salleApi.create({
          nom: form.nom.trim(),
          description: form.description?.trim() || undefined,
          capacite: typeof form.capacite === 'number' ? form.capacite : 0
        })
        notify({ type: 'success', message: '✅ Salle créée' })
      } else if (formMode === 'edit' && editingSalle) {
        await salleApi.update(editingSalle.id, {
          nom: form.nom.trim(),
          description: form.description?.trim() || undefined,
          capacite: typeof form.capacite === 'number' ? form.capacite : 0
        })
        notify({ type: 'success', message: '✅ Salle mise à jour' })
      }
      setFormOpen(false)
      await loadSalles()
    } catch (e: any) {
      const msg = e?.response?.data || e?.message || 'Erreur lors de l\'enregistrement'
      notify({ type: 'error', message: `❌ ${msg}` })
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(s: SalleListDto) {
    if (!isAdmin) return
    try {
      await salleApi.update(s.id, { estActive: !s.estActive })
      notify({ type: 'success', message: `✅ ${!s.estActive ? 'Salle activée' : 'Salle désactivée'}` })
      await loadSalles()
    } catch (e: any) {
      notify({ type: 'error', message: '❌ Action impossible' })
    }
  }

  async function deleteSalle(id: string) {
    if (!isAdmin) return
    if (!confirm('Supprimer cette salle ? Cette action est irréversible.')) return
    try {
      await salleApi.remove(id)
      notify({ type: 'success', message: '🗑️ Salle supprimée' })
      await loadSalles()
    } catch (e: any) {
      notify({ type: 'error', message: '❌ Suppression impossible' })
    }
  }

  return (
    <div className="panel">
      <div className="panel-title">🏛️ Gestion des salles d'audience</div>

      {!isAdmin && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            borderRadius: 9999,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 12
          }}
        >
          🔒 Accès lecture seule — droits administrateur requis pour modifier les salles
        </div>
      )}

      {error && (
        <div className="error" style={{ marginBottom: 16 }}>
          ❌ {error}
          <button className="btn" style={{ marginLeft: 8 }} onClick={loadSalles}>🔄 Réessayer</button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontSize: 14, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
            Afficher uniquement les actives
          </label>
          <button className="btn" onClick={loadSalles}>🔄 Rafraîchir</button>
        </div>
        {isAdmin ? (
          <button className="btn" onClick={openCreate}>➕ Nouvelle salle</button>
        ) : (
          <div style={{ fontSize: 12, color: '#64748b' }}>Droits administrateur requis pour créer une salle</div>
        )}
      </div>

      {loading ? (
        <div className="info">⏳ Chargement des salles…</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Capacité</th>
                <th>Description</th>
                <th>Active</th>
                <th>Créée le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salles.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.nom}</td>
                  <td>{typeof s.capacite === 'number' ? s.capacite : '-'}</td>
                  <td style={{ maxWidth: 420 }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.description || '-'}
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: s.estActive ? '#dcfce7' : '#fee2e2', color: s.estActive ? '#15803d' : '#991b1b' }}>
                      {s.estActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(s.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>
                    {isAdmin ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn" onClick={() => openEdit(s.id)}>✏️ Modifier</button>
                        <button className="btn" onClick={() => toggleActive(s)}>
                          {s.estActive ? '⏸️ Désactiver' : '▶️ Activer'}
                        </button>
                        <button className="btn" onClick={() => deleteSalle(s.id)}>🗑️ Supprimer</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {salles.length === 0 && (
            <div className="info" style={{ textAlign: 'center', padding: 32 }}>
              Aucune salle trouvée
            </div>
          )}
        </div>
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={formMode === 'create' ? 'Nouvelle salle' : `Modifier la salle`} size="md">
        <form onSubmit={submitForm} className="space-y-4">
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              id="nom"
              type="text"
              value={form.nom}
              onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
              required
              maxLength={120}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="capacite" className="block text-sm font-medium text-gray-700">Capacité</label>
            <input
              id="capacite"
              type="number"
              min={0}
              value={form.capacite}
              onChange={(e) => setForm((p) => ({ ...p, capacite: e.target.value === '' ? '' : Number(e.target.value) }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          {formMode === 'edit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Statut</label>
              <div style={{ marginTop: 6 }}>
                <span className="badge" style={{ background: editingSalle?.estActive ? '#dcfce7' : '#fee2e2', color: editingSalle?.estActive ? '#15803d' : '#991b1b' }}>
                  {editingSalle?.estActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
            <button type="button" className="btn" onClick={() => setFormOpen(false)}>Annuler</button>
            <button type="submit" className="btn" disabled={!canSubmit || submitting}>
              {submitting ? 'Enregistrement…' : formMode === 'create' ? 'Créer' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
