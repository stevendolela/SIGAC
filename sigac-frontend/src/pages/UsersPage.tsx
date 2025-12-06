import { useEffect, useMemo, useState } from 'react'
import { userApi } from '../api/userApi'
import type { UserDto } from '../types/user'
import type { PaginationMetadata } from '../types/pagination'
import { useToast } from '../components/common/ToastProvider'
import { AdminResetPasswordModal } from '../components/common/AdminResetPasswordModal'

export default function UsersPage() {
  const [items, setItems] = useState<UserDto[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pendingSearch, setPendingSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingUser, setEditingUser] = useState<UserDto | null>(null)
  const [editForm, setEditForm] = useState<{ email?: string; nomComplet?: string; role?: string; matricule?: string }>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<UserDto | null>(null)
  const { notify } = useToast()

  // Vérification du rôle administrateur
  const userStr = localStorage.getItem('user')
  const currentUser = userStr ? JSON.parse(userStr) : null
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Administrateur'

  // État du formulaire de création
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: '6', // Consultant par défaut
    nomComplet: '',
    matricule: ''
  })

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

  async function handleDeleteUser(u: UserDto) {
    // Confirmation
    if (!window.confirm(`❌ Êtes-vous sûr de vouloir supprimer l'utilisateur "${u.username}"? Cette action enregistrera une trace d'audit.`)) {
      return
    }

    try {
      await userApi.delete(u.id)
      setItems(prev => prev.filter(x => x.id !== u.id))
      notify({ type: 'success', message: `✅ Utilisateur supprimé: ${u.username}` })
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erreur lors de la suppression de l\'utilisateur'
      setError(msg)
      notify({ type: 'error', message: msg })
    }
  }

  function openEdit(u: UserDto) {
    setEditingUser(u)
    setEditForm({
      email: u.email,
      nomComplet: u.nomComplet || '',
      role: u.role,
      matricule: u.matricule || ''
    })
  }

  function closeEdit() {
    setEditingUser(null)
    setEditForm({})
    setSavingEdit(false)
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return
    setSavingEdit(true)
    try {
      // Optimistic update
      const optimistic: UserDto = { 
        ...editingUser, 
        email: editForm.email || editingUser.email, 
        nomComplet: (editForm.nomComplet && editForm.nomComplet.trim()) || undefined, 
        role: (editForm.role as any) || editingUser.role, 
        matricule: (editForm.matricule && editForm.matricule.trim()) || undefined 
      }
      setItems(prev => prev.map(x => x.id === optimistic.id ? optimistic : x))
      await userApi.update(editingUser.id, {
        email: editForm.email,
        nomComplet: editForm.nomComplet,
        role: optimistic.role as any,
        matricule: editForm.matricule
      })
      notify({ type: 'success', message: '✅ Utilisateur mis à jour' })
      closeEdit()
    } catch (e: any) {
      notify({ type: 'error', message: e?.response?.data?.message || 'Erreur mise à jour utilisateur' })
    } finally { setSavingEdit(false) }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.username.trim() || formData.username.trim().length < 3) {
      notify({ type: 'error', message: "Le nom d'utilisateur doit contenir au moins 3 caractères" })
      return
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      notify({ type: 'error', message: "L'adresse email est invalide" })
      return
    }
    if (!formData.password.trim() || formData.password.trim().length < 8) {
      notify({ type: 'error', message: "Le mot de passe doit contenir au moins 8 caractères" })
      return
    }

    setCreating(true)
    setError(null)
    
    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        role: Number(formData.role),
        nomComplet: formData.nomComplet.trim() || null,
        matricule: formData.matricule.trim() || null
      }
      
      const newUser = await userApi.create(payload)
      
      // Rafraîchir la liste
      await fetchUsers(page, search)
      
      // Réinitialiser le formulaire
      setFormData({
        username: '',
        email: '',
        password: '',
        role: '6',
        nomComplet: '',
        matricule: ''
      })
      setShowCreateForm(false)
      
      notify({ type: 'success', message: `✅ Utilisateur créé avec succès: ${newUser.username}` })
    } catch (e: any) {
      const serverMsg = e?.response?.data?.message || e?.message || "Erreur lors de la création de l'utilisateur"
      const modelErrors: string[] | undefined = e?.response?.data?.errors
      
      if (modelErrors && Array.isArray(modelErrors) && modelErrors.length > 0) {
        notify({ type: 'error', message: modelErrors.join(', ') })
      } else {
        notify({ type: 'error', message: serverMsg })
      }
      setError(serverMsg)
    } finally {
      setCreating(false)
    }
  }

  function resetForm() {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: '6',
      nomComplet: '',
      matricule: ''
    })
    setShowCreateForm(false)
    setError(null)
  }

  const roleColors: Record<string, { bg: string; text: string; icon: string }> = {
    'Admin': { bg: '#fee2e2', text: '#991b1b', icon: '👑' },
    'Administrateur': { bg: '#fee2e2', text: '#991b1b', icon: '👑' },
    'President': { bg: '#ddd6fe', text: '#5b21b6', icon: '⚖️' },
    'JugeConstitutionnel': { bg: '#dbeafe', text: '#1e40af', icon: '👨‍⚖️' },
    'Greffier': { bg: '#d1fae5', text: '#065f46', icon: '📋' },
    'GreffierAdjoint': { bg: '#e0e7ff', text: '#3730a3', icon: '📝' },
    'Consultant': { bg: '#f3f4f6', text: '#374151', icon: '👤' }
  }

  // Restriction d'accès aux administrateurs uniquement
  if (!isAdmin) {
    return (
      <div className="panel">
        <div className="panel-title">� Accès Refusé</div>
        <div className="error" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>Accès Administrateur Requis</h2>
          <p style={{ color: '#64748b' }}>
            Vous devez être administrateur pour accéder à la gestion des utilisateurs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="panel-title">�👥 Gestion des Utilisateurs</div>
      
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
        <button 
          className="btn" 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            background: showCreateForm ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            minWidth: 180
          }}
        >
          {showCreateForm ? '❌ Annuler' : '➕ Nouvel Utilisateur'}
        </button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)', border: '2px solid #667eea' }}>
          <h3 style={{ marginTop: 0, marginBottom: 20, color: '#5b21b6' }}>➕ Créer un Nouvel Utilisateur</h3>
          <form onSubmit={handleCreateUser}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Section Informations de Connexion */}
              <div style={{ gridColumn: '1 / -1' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#667eea', fontSize: 14, fontWeight: 600 }}>
                  🔐 Informations de Connexion
                </h4>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Nom d'utilisateur <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Ex: juge.kabila"
                  required
                  minLength={3}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: juge.kabila@courconstitutionnelle.cd"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Mot de passe <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 caractères"
                  required
                  minLength={8}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Rôle <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  style={{ width: '100%' }}
                >
                  <option value="1">👑 Administrateur</option>
                  <option value="2">⚖️ Président</option>
                  <option value="3">👨‍⚖️ Juge Constitutionnel</option>
                  <option value="4">📋 Greffier</option>
                  <option value="5">📝 Greffier Adjoint</option>
                  <option value="6">👤 Consultant</option>
                </select>
              </div>

              {/* Section Informations Complémentaires */}
              <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#667eea', fontSize: 14, fontWeight: 600 }}>
                  📋 Informations Complémentaires (optionnel)
                </h4>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.nomComplet}
                  onChange={(e) => setFormData({ ...formData, nomComplet: e.target.value })}
                  placeholder="Ex: Joseph Kabila Kabange"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Matricule
                </label>
                <input
                  type="text"
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  placeholder="Ex: MAT-2025-001"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {error && (
              <div className="error" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn" 
                onClick={resetForm}
                disabled={creating}
                style={{ minWidth: 120 }}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="btn" 
                disabled={creating}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  minWidth: 120
                }}
              >
                {creating ? '⏳ Création...' : '✅ Créer l\'utilisateur'}
              </button>
            </div>
          </form>
        </div>
      )}

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
                      <td style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                        <button 
                          title={u.isActive ? 'Désactiver' : 'Activer'}
                          onClick={() => toggleActive(u)}
                          style={{
                            background: u.isActive ? '#ef4444' : '#10b981',
                            color: 'white',
                            border: 'none',
                            width: 32,
                            height: 32,
                            borderRadius: 4,
                            fontSize: 16,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {u.isActive ? '⛔' : '✅'}
                        </button>
                        <button
                          title="Éditer"
                          style={{ 
                            background: '#6366f1', 
                            color: 'white',
                            border: 'none',
                            width: 32,
                            height: 32,
                            borderRadius: 4,
                            fontSize: 16,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => openEdit(u)}
                        >✏️</button>
                        <button
                          title="Réinitialiser MDP"
                          style={{ 
                            background: '#f59e0b', 
                            color: 'white',
                            border: 'none',
                            width: 32,
                            height: 32,
                            borderRadius: 4,
                            fontSize: 16,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => setResetPasswordUser(u)}
                        >🔐</button>
                        <button
                          title="Page avancée"
                          style={{ 
                            background: '#0ea5e9', 
                            color: 'white',
                            border: 'none',
                            width: 32,
                            height: 32,
                            borderRadius: 4,
                            fontSize: 16,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => { window.location.href = `/admin/users/${u.id}` }}
                        >🔗</button>
                        <button
                          title="Supprimer"
                          style={{ 
                            background: '#7c3aed', 
                            color: 'white',
                            border: 'none',
                            width: 32,
                            height: 32,
                            borderRadius: 4,
                            fontSize: 16,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => handleDeleteUser(u)}
                        >🗑️</button>
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

      {editingUser && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Édition utilisateur">
          <div className="panel" style={{ maxWidth: 520 }}>
            <div className="panel-title">✏️ Modifier {editingUser.username}</div>
            <form onSubmit={submitEdit} style={{ display: 'grid', gap: 16 }}>
              <label>
                Email
                <input type="email" value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </label>
              <label>
                Nom complet
                <input value={editForm.nomComplet || ''} onChange={e => setEditForm(f => ({ ...f, nomComplet: e.target.value }))} />
              </label>
              <label>
                Rôle
                <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="Administrateur">Administrateur</option>
                  <option value="President">President</option>
                  <option value="JugeConstitutionnel">Juge Constitutionnel</option>
                  <option value="Greffier">Greffier</option>
                  <option value="GreffierAdjoint">Greffier Adjoint</option>
                  <option value="Consultant">Consultant</option>
                </select>
              </label>
              <label>
                Matricule
                <input value={editForm.matricule || ''} onChange={e => setEditForm(f => ({ ...f, matricule: e.target.value }))} />
              </label>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={closeEdit}>Annuler</button>
                <button type="submit" className="btn" disabled={savingEdit}>{savingEdit ? '⏳ Sauvegarde...' : '💾 Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetPasswordUser && (
        <AdminResetPasswordModal
          userId={resetPasswordUser.id}
          onClose={() => setResetPasswordUser(null)}
        />
      )}
    </div>
  )
}
