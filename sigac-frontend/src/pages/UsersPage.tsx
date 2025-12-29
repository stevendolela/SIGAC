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
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Admin'

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
    
    // Validation username
    if (!formData.username.trim() || formData.username.trim().length < 3) {
      notify({ type: 'error', message: "Le nom d'utilisateur doit contenir au moins 3 caractères" })
      return
    }
    
    // Validation email
    if (!formData.email.trim() || !formData.email.includes('@')) {
      notify({ type: 'error', message: "L'adresse email est invalide" })
      return
    }
    
    // Validation mot de passe renforcée
    const password = formData.password.trim()
    if (!password || password.length < 8) {
      notify({ type: 'error', message: "Le mot de passe doit contenir au moins 8 caractères" })
      return
    }
    
    // Vérifier la complexité du mot de passe
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      notify({ 
        type: 'error', 
        message: "Le mot de passe doit contenir au moins: 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial (!@#$%...)" 
      })
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
      
      console.log('🔍 Payload envoyé:', payload)
      
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
      console.error('❌ Erreur création utilisateur:', e)
      console.error('❌ Response data:', e?.response?.data)
      
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
    'Admin': { bg: '#fee2e2', text: '#991b1b', icon: '👑' },
    'Manager': { bg: '#ddd6fe', text: '#5b21b6', icon: '⚖️' },
    'Collaborateur': { bg: '#dbeafe', text: '#1e40af', icon: '👨‍⚖️' },
    'Assistant': { bg: '#d1fae5', text: '#065f46', icon: '📋' },
    'AssistantJunior': { bg: '#e0e7ff', text: '#3730a3', icon: '📝' },
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
        <div style={{ 
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '28px',
            paddingBottom: '20px',
            borderBottom: '2px solid #f3f4f6'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              👤
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937', fontWeight: '700' }}>
                Gestion des Utilisateurs
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                Créer un nouvel utilisateur système
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateUser}>
            {/* Section Informations de Connexion */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  🔐
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                  Informations de Connexion
                </h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Nom d'utilisateur <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Ex: jean.dupont"
                    required
                    minLength={3}
                    style={{ 
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ex: jean.dupont@entreprise.com"
                    required
                    style={{ 
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Mot de passe <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 8 car: Aa1! (majuscule, minuscule, chiffre, spécial)"
                    required
                    minLength={8}
                    style={{ 
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  />
                  <p style={{ 
                    margin: '6px 0 0 0', 
                    fontSize: '12px', 
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    Doit contenir: majuscule, minuscule, chiffre et caractère spécial
                  </p>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Rôle <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                    style={{ 
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Sélectionner un rôle --</option>
                    <option value="1">👑 Admin</option>
                    <option value="2">👔 Manager</option>
                    <option value="3">👨‍💼 Collaborateur</option>
                    <option value="4">📋 Assistant</option>
                    <option value="5">🎓 Assistant Junior</option>
                    <option value="6">👁️ Consultant</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section Informations Complémentaires */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  📋
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                  Informations Complémentaires <span style={{ fontSize: '13px', fontWeight: '400', color: '#9ca3af' }}>(optionnel)</span>
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={formData.nomComplet}
                    onChange={(e) => setFormData({ ...formData, nomComplet: e.target.value })}
                    placeholder="Ex: Jean Dupont Martin"
                    style={{ 
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Matricule
                  </label>
                  <input
                    type="text"
                    value={formData.matricule}
                    onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                    placeholder="Ex: MAT-2025-001"
                    style={{ 
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end',
              paddingTop: '20px',
              borderTop: '1px solid #f3f4f6'
            }}>
              <button 
                type="button" 
                onClick={resetForm}
                disabled={creating}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  color: '#374151',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !creating && (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={creating}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  background: creating ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: creating ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => !creating && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
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
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Collaborateur">Collaborateur</option>
                  <option value="Assistant">Assistant</option>
                  <option value="AssistantJunior">Assistant Junior</option>
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
