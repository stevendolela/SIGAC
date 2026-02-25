import { useEffect, useMemo, useState } from 'react'
import { salleApi } from '../api/salleApi'
import type { SalleListDto, SalleDetailDto } from '../types/salle'
import { useToast } from '../components/common/ToastProvider'
import { 
  Building2, Plus, X, Edit2, RefreshCw, Trash2, 
  Play, Pause, Users, Lock, CheckCircle, XCircle, AlertCircle, Settings
} from 'lucide-react'

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
      setIsAdmin(user?.role === 'Admin')
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
      {/* Header moderne */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 800, 
          color: '#1e293b', 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Building2 size={32} style={{ color: '#8b5cf6' }} />
          Gestion des Salles
        </h1>
        <p style={{ color: '#64748b', marginTop: '8px', fontSize: '15px' }}>
          Gérez vos salles de réunion et d'audience
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        {/* Total Salles */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderLeft: '4px solid #8b5cf6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>
                {salles.length}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                Total Salles
              </div>
            </div>
          </div>
        </div>

        {/* Actives */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderLeft: '4px solid #10b981'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>
                {salles.filter(s => s.estActive).length}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                Actives
              </div>
            </div>
          </div>
        </div>

        {/* Inactives */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderLeft: `4px solid ${salles.filter(s => !s.estActive).length > 0 ? '#f59e0b' : '#10b981'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: salles.filter(s => !s.estActive).length > 0 
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <XCircle size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>
                {salles.filter(s => !s.estActive).length}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                Inactives
              </div>
            </div>
          </div>
        </div>

        {/* Capacité Totale */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>
                {salles.filter(s => s.estActive).reduce((sum, s) => sum + (s.capacite || 0), 0)}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                Capacité Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isAdmin && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            color: '#92400e',
            border: '1px solid #fbbf24',
            borderRadius: 12,
            padding: '16px 20px',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 20
          }}
        >
          <Lock size={20} style={{ flexShrink: 0 }} />
          Accès lecture seule — droits administrateur requis pour modifier les salles
        </div>
      )}

      {error && (
        <div style={{ 
          marginBottom: 20,
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          borderRadius: 12,
          border: '1px solid #f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={20} style={{ color: '#dc2626', flexShrink: 0 }} />
          <span style={{ flex: 1, color: '#991b1b' }}>{error}</span>
          <button 
            className="btn" 
            onClick={loadSalles}
            style={{ 
              padding: '6px 14px', 
              fontSize: 13,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} /> Réessayer
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontSize: 14, color: '#334155', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} style={{ cursor: 'pointer' }} />
            Afficher uniquement les actives
          </label>
          <button 
            className="btn" 
            onClick={loadSalles}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Actualiser
          </button>
        </div>
        {isAdmin ? (
          <button 
            className="btn" 
            onClick={openCreate}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={16} /> Nouvelle salle
          </button>
        ) : (
          <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={14} /> Droits administrateur requis pour créer une salle
          </div>
        )}
      </div>

      {loading ? (
        <div style={{
          padding: '24px',
          background: '#f8fafc',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: '#64748b'
        }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
          Chargement des salles…
        </div>
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
                        <button 
                          className="btn" 
                          onClick={() => openEdit(s.id)}
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            fontSize: 13
                          }}
                        >
                          <Edit2 size={14} /> Modifier
                        </button>
                        <button 
                          className="btn" 
                          onClick={() => toggleActive(s)}
                          style={{
                            background: s.estActive 
                              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            fontSize: 13
                          }}
                        >
                          {s.estActive ? <><Pause size={14} /> Désactiver</> : <><Play size={14} /> Activer</>}
                        </button>
                        <button 
                          className="btn" 
                          onClick={() => deleteSalle(s.id)}
                          style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            fontSize: 13
                          }}
                        >
                          <Trash2 size={14} /> Supprimer
                        </button>
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
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Building2 size={40} style={{ color: '#94a3b8' }} />
              </div>
              <p style={{ margin: 0, color: '#64748b', fontSize: 16 }}>
                Aucune salle trouvée
              </p>
              {isAdmin && (
                <button 
                  className="btn" 
                  onClick={openCreate}
                  style={{ 
                    marginTop: 16,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Plus size={16} /> Créer une salle
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal moderne */}
      {formOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setFormOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{
              maxWidth: '560px', 
              width: '100%',
              padding: 0, 
              overflow: 'hidden', 
              borderRadius: '16px', 
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              background: '#fff'
            }}
          >
            {/* Header gradient */}
            <div style={{ 
              background: formMode === 'create' 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              padding: '28px 32px',
              color: 'white',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                {formMode === 'create' ? <Plus size={28} /> : <Edit2 size={28} />}
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                  {formMode === 'create' ? 'Nouvelle Salle' : 'Modifier la Salle'}
                </h2>
              </div>
              <p style={{ margin: '8px 0 0 40px', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                {formMode === 'create' ? 'Créez une nouvelle salle de réunion' : 'Mettez à jour les informations'}
              </p>
              <button 
                onClick={() => setFormOpen(false)} 
                style={{ 
                  position: 'absolute',
                  top: '20px', 
                  right: '24px', 
                  background: 'rgba(255,255,255,0.2)', 
                  border: 'none', 
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={submitForm} style={{ padding: '32px' }}>
              {/* Section Informations */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Settings size={20} style={{ color: '#8b5cf6' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Informations</h3>
              </div>

              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                    Nom <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                    required
                    maxLength={120}
                    placeholder="Ex: Salle de conférence A"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '2px solid #e2e8f0',
                      fontSize: '15px',
                      fontWeight: 500,
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={16} style={{ color: '#64748b' }} />
                      Capacité
                    </div>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.capacite}
                    onChange={(e) => setForm((p) => ({ ...p, capacite: e.target.value === '' ? '' : Number(e.target.value) }))}
                    placeholder="Nombre de places"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '2px solid #e2e8f0',
                      fontSize: '15px',
                      fontWeight: 500,
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Description de la salle, équipements disponibles..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '2px solid #e2e8f0',
                      fontSize: '15px',
                      fontWeight: 500,
                      resize: 'vertical',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>

                {formMode === 'edit' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                      Statut
                    </label>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      background: editingSalle?.estActive ? '#dcfce7' : '#fee2e2',
                      color: editingSalle?.estActive ? '#15803d' : '#991b1b',
                      fontSize: '14px',
                      fontWeight: 600
                    }}>
                      {editingSalle?.estActive ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      {editingSalle?.estActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '12px', 
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <button 
                  type="button" 
                  onClick={() => setFormOpen(false)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: '2px solid #e2e8f0',
                    background: 'white',
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <X size={16} /> Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={!canSubmit || submitting}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: formMode === 'create' 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
                    opacity: canSubmit && !submitting ? 1 : 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  {submitting ? (
                    <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement…</>
                  ) : formMode === 'create' ? (
                    <><Plus size={16} /> Créer</>
                  ) : (
                    <><Edit2 size={16} /> Enregistrer</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
