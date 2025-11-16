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
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
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
  Username: formData.username.trim(),
  Email: formData.email.trim(),
  Password: formData.password.trim(),
  Role: Number(formData.role),
  NomComplet: formData.nomComplet.trim() || null,
  Matricule: formData.matricule.trim() || null
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
