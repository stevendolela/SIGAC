import { useEffect, useMemo, useState } from 'react'
import { userApi } from '../api/userApi'
import type { UserDto } from '../types/user'
import type { PaginationMetadata } from '../types/pagination'
import { useToast } from '../components/common/ToastProvider'
import { AdminResetPasswordModal } from '../components/common/AdminResetPasswordModal'
import { migrateRole } from '../utils/roleMigration'
import {
  Users, Plus, X, Edit2, Trash2, RefreshCw, Search, Shield, UserCheck, 
  UserX, Key, ExternalLink, Crown, Briefcase, User, ClipboardList, 
  GraduationCap, Eye, Lock, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  AlertTriangle, Info, Save
} from 'lucide-react'

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
      // Migration automatique des rôles en cas de données anciennes
      const migratedData = res.data.map(user => ({
        ...user,
        role: migrateRole(user.role) as any
      }))
      setItems(migratedData)
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
        // Migration du rôle en cas de données anciennes
        updated.role = migrateRole(updated.role) as any
        setItems(prev => prev.map(x => x.id === updated.id ? updated : x))
        notify({ type: 'success', message: `✅ Utilisateur désactivé: ${updated.username}` })
      } else {
        const updated = await userApi.activate(u.id)
        // Migration du rôle en cas de données anciennes
        updated.role = migrateRole(updated.role) as any
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
    // Migration du rôle au moment de l'ouverture du formulaire
    const migratedRole = migrateRole(u.role)
    setEditForm({
      email: u.email,
      nomComplet: u.nomComplet || '',
      role: migratedRole,
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

  const roleColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    'Admin': { bg: '#fee2e2', text: '#991b1b', icon: <Crown size={16} /> },
    'Manager': { bg: '#ddd6fe', text: '#5b21b6', icon: <Briefcase size={16} /> },
    'Collaborateur': { bg: '#dbeafe', text: '#1e40af', icon: <User size={16} /> },
    'Assistant': { bg: '#d1fae5', text: '#065f46', icon: <ClipboardList size={16} /> },
    'AssistantJunior': { bg: '#e0e7ff', text: '#3730a3', icon: <GraduationCap size={16} /> },
    'Consultant': { bg: '#f3f4f6', text: '#374151', icon: <Eye size={16} /> }
  }

  // Stats calculées
  const stats = useMemo(() => {
    const total = pagination?.totalItems || items.length;
    const active = items.filter(u => u.isActive).length;
    const inactive = items.filter(u => !u.isActive).length;
    const admins = items.filter(u => u.role === 'Admin').length;
    return { total, active, inactive, admins };
  }, [items, pagination]);

  // Restriction d'accès aux administrateurs uniquement
  if (!isAdmin) {
    return (
      <div className="panel">
        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '16px',
          padding: '24px 32px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex'
            }}>
              <Lock size={32} color="white" />
            </div>
            <div>
              <h1 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: 700 }}>
                Accès Refusé
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0 0', fontSize: '15px' }}>
                Accès Administrateur Requis
              </p>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ color: '#64748b' }}>
            Vous devez être administrateur pour accéder à la gestion des utilisateurs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      {/* Header moderne */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={32} color="white" />
          </div>
          <div>
            <h1 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: 700 }}>
              Gestion des Utilisateurs
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0 0', fontSize: '15px' }}>
              Gérez les comptes et les permissions de votre organisation
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #6366f1'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Total Utilisateurs</p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: '4px 0 0 0' }}>{stats.total}</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              borderRadius: '10px',
              padding: '10px',
              display: 'flex'
            }}>
              <Users size={24} color="white" />
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #10b981'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Actifs</p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: '4px 0 0 0' }}>{stats.active}</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '10px',
              padding: '10px',
              display: 'flex'
            }}>
              <UserCheck size={24} color="white" />
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #ef4444'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Inactifs</p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: '4px 0 0 0' }}>{stats.inactive}</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '10px',
              padding: '10px',
              display: 'flex'
            }}>
              <UserX size={24} color="white" />
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Administrateurs</p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: '4px 0 0 0' }}>{stats.admins}</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '10px',
              padding: '10px',
              display: 'flex'
            }}>
              <Crown size={24} color="white" />
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            placeholder="Rechercher par nom d'utilisateur ou email..."
            value={pendingSearch}
            onChange={(e) => { setPendingSearch(e.target.value); setPage(1) }}
            style={{ 
              width: '100%', 
              paddingLeft: 40,
              padding: '10px 14px 10px 40px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>
        {pendingSearch && (
          <button 
            onClick={() => { setPendingSearch(''); setPage(1) }} 
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            <X size={16} />
            Effacer
          </button>
        )}
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: showCreateForm ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {showCreateForm ? <><X size={18} /> Annuler</> : <><Plus size={18} /> Nouvel Utilisateur</>}
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
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={24} color="white" />
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
                  justifyContent: 'center'
                }}>
                  <Key size={16} color="#f59e0b" />
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
                    <option value="1">Admin</option>
                    <option value="2">Manager</option>
                    <option value="3">Collaborateur</option>
                    <option value="4">Assistant</option>
                    <option value="5">Assistant Junior</option>
                    <option value="6">Consultant</option>
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
                  justifyContent: 'center'
                }}>
                  <ClipboardList size={16} color="#3b82f6" />
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
                <AlertTriangle size={18} />
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  background: creating ? '#9ca3af' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: 'white',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: creating ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
                onMouseEnter={(e) => !creating && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {creating ? <><RefreshCw size={16} className="animate-spin" /> Création...</> : <><CheckCircle size={16} /> Créer l'utilisateur</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="info" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><RefreshCw size={18} className="animate-spin" /> Chargement des utilisateurs...</div>}
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
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          {u.isActive ? <><CheckCircle size={14} /> Actif</> : <><XCircle size={14} /> Inactif</>}
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
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button
                          title="Éditer"
                          style={{ 
                            background: '#6366f1', 
                            color: 'white',
                            border: 'none',
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => openEdit(u)}
                        ><Edit2 size={16} /></button>
                        <button
                          title="Réinitialiser MDP"
                          style={{ 
                            background: '#f59e0b', 
                            color: 'white',
                            border: 'none',
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => setResetPasswordUser(u)}
                        ><Key size={16} /></button>
                        <button
                          title="Page avancée"
                          style={{ 
                            background: '#0ea5e9', 
                            color: 'white',
                            border: 'none',
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => { window.location.href = `/admin/users/${u.id}` }}
                        ><ExternalLink size={16} /></button>
                        <button
                          title="Supprimer"
                          style={{ 
                            background: '#7c3aed', 
                            color: 'white',
                            border: 'none',
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => handleDeleteUser(u)}
                        ><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <div className="info" style={{ textAlign: 'center', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Search size={32} color="#9ca3af" />
              <span>Aucun utilisateur trouvé</span>
            </div>
          )}
        </>
      )}
      
      {pagination && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 16, 
          marginTop: 24,
          padding: '16px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <button 
            disabled={page <= 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: page <= 1 ? '#f3f4f6' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: page <= 1 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: page <= 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={18} />
            Précédent
          </button>
          <span style={{ fontWeight: 600 }}>
            Page {pagination.page} / {pagination.totalPages} 
            <span style={{ color: '#94a3b8', marginLeft: 8 }}>
              ({pagination.totalItems} utilisateurs)
            </span>
          </span>
          <button 
            disabled={pagination.page >= pagination.totalPages} 
            onClick={() => setPage(p => p + 1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: pagination.page >= pagination.totalPages ? '#f3f4f6' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: pagination.page >= pagination.totalPages ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Suivant
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {editingUser && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Édition utilisateur">
          <div className="panel" style={{ maxWidth: 520, borderRadius: '16px', overflow: 'hidden' }}>
            {/* Header moderne du modal */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex'
                }}>
                  <Edit2 size={20} color="white" />
                </div>
                <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 700 }}>
                  Modifier {editingUser.username}
                </h3>
              </div>
              <button
                onClick={closeEdit}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitEdit} style={{ display: 'grid', gap: 16, padding: 24 }}>
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
                <button 
                  type="button" 
                  onClick={closeEdit}
                  style={{
                    padding: '10px 20px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >Annuler</button>
                <button 
                  type="submit" 
                  disabled={savingEdit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: savingEdit ? 'not-allowed' : 'pointer',
                    opacity: savingEdit ? 0.7 : 1
                  }}
                >
                  {savingEdit ? <><RefreshCw size={16} className="animate-spin" /> Sauvegarde...</> : <><Save size={16} /> Enregistrer</>}
                </button>
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
