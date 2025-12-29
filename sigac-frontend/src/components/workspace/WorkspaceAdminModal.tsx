import { useState, useEffect } from 'react'
import { X, Building2, Plus, Users, Trash2, Check, Edit2, UserPlus, Search } from 'lucide-react'
import { workspaceApi } from '../../api/workspaceApi'
import { userApi } from '../../api/userApi'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { WorkspaceRole } from '../../types/workspace'
import type { WorkspaceDto, CreateWorkspaceDto, UpdateWorkspaceDto, WorkspaceMemberDto } from '../../types/workspace'
import type { UserDto } from '../../types/user'
import './WorkspaceAdminModal.css'

interface WorkspaceAdminModalProps {
  onClose: () => void
}

type TabType = 'list' | 'create' | 'members'

export default function WorkspaceAdminModal({ onClose }: WorkspaceAdminModalProps) {
  const { currentWorkspace, setCurrentWorkspace, refreshWorkspaces } = useWorkspaceStore()
  const [activeTab, setActiveTab] = useState<TabType>('list')
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Create form
  const [newWorkspace, setNewWorkspace] = useState<CreateWorkspaceDto>({
    name: '',
    slug: '',
    description: ''
  })
  
  // Edit form
  const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceDto | null>(null)
  
  // Members management
  const [members, setMembers] = useState<WorkspaceMemberDto[]>([])
  const [selectedWorkspaceForMembers, setSelectedWorkspaceForMembers] = useState<WorkspaceDto | null>(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<WorkspaceRole>(WorkspaceRole.Member)
  
  // Users list for selection
  const [availableUsers, setAvailableUsers] = useState<UserDto[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState<UserDto[]>([])

  const loadWorkspaces = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await workspaceApi.getUserWorkspaces()
      setWorkspaces(data)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des workspaces')
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async (workspaceId: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await workspaceApi.getMembers(workspaceId)
      setMembers(data)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des membres')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableUsers = async () => {
    setLoadingUsers(true)
    try {
      const result = await userApi.list(1, 100, undefined)
      // Filtrer les utilisateurs qui ne sont pas déjà membres
      const memberUserIds = members.map(m => m.userId)
      const filtered = result.data.filter(u => !memberUserIds.includes(u.id))
      setAvailableUsers(filtered)
    } catch (err: any) {
      console.error('Erreur lors du chargement des utilisateurs:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const filterUsers = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredUsers([])
      setShowUserDropdown(false)
      return
    }

    const search = searchTerm.toLowerCase()
    const filtered = availableUsers.filter(user => 
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.nomComplet?.toLowerCase().includes(search)
    )
    setFilteredUsers(filtered)
    setShowUserDropdown(filtered.length > 0)
  }

  const selectUser = (user: UserDto) => {
    setSelectedUserId(user.id)
    setUserSearchTerm(user.nomComplet || user.username)
    setShowUserDropdown(false)
    setFilteredUsers([])
  }

  useEffect(() => {
    loadWorkspaces()
  }, [])

  useEffect(() => {
    if (selectedWorkspaceForMembers) {
      loadMembers(selectedWorkspaceForMembers.id)
    }
  }, [selectedWorkspaceForMembers])

  useEffect(() => {
    if (showAddMember) {
      loadAvailableUsers()
    } else {
      // Reset quand on ferme le modal
      setUserSearchTerm('')
      setSelectedUserId('')
      setFilteredUsers([])
      setShowUserDropdown(false)
    }
  }, [showAddMember, members])

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.form-group')) {
        setShowUserDropdown(false)
      }
    }

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserDropdown])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const created = await workspaceApi.createWorkspace(newWorkspace)
      setWorkspaces([...workspaces, created])
      setNewWorkspace({ name: '', slug: '', description: '' })
      setActiveTab('list')
      await refreshWorkspaces()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: string, updates: UpdateWorkspaceDto) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await workspaceApi.update(id, updates)
      setWorkspaces(workspaces.map(w => w.id === id ? updated : w))
      setEditingWorkspace(null)
      await refreshWorkspaces()
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(updated)
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce workspace ?')) return
    
    setLoading(true)
    setError(null)
    try {
      await workspaceApi.delete(id)
      setWorkspaces(workspaces.filter(w => w.id !== id))
      await refreshWorkspaces()
      if (currentWorkspace?.id === id && workspaces.length > 1) {
        const nextWorkspace = workspaces.find(w => w.id !== id)
        if (nextWorkspace) setCurrentWorkspace(nextWorkspace)
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitch = async (workspace: WorkspaceDto) => {
    setCurrentWorkspace(workspace)
    localStorage.setItem('currentWorkspaceId', workspace.id)
    onClose()
    window.location.reload() // Recharger pour appliquer le filtre
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorkspaceForMembers || !selectedUserId) return
    
    setLoading(true)
    setError(null)
    try {
      await workspaceApi.addMember(selectedWorkspaceForMembers.id, {
        userId: selectedUserId,
        role: newMemberRole
      })
      await loadMembers(selectedWorkspaceForMembers.id)
      setSelectedUserId('')
      setNewMemberRole(WorkspaceRole.Member)
      setUserSearchTerm('')
      setShowAddMember(false)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout du membre')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: WorkspaceRole) => {
    if (!selectedWorkspaceForMembers) return
    
    setLoading(true)
    setError(null)
    try {
      await workspaceApi.updateMemberRole(selectedWorkspaceForMembers.id, memberId, { role: newRole })
      await loadMembers(selectedWorkspaceForMembers.id)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du rôle')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedWorkspaceForMembers) return
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) return
    
    setLoading(true)
    setError(null)
    try {
      await workspaceApi.removeMember(selectedWorkspaceForMembers.id, memberId)
      await loadMembers(selectedWorkspaceForMembers.id)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression du membre')
    } finally {
      setLoading(false)
    }
  }

  const getRoleName = (role: WorkspaceRole): string => {
    switch (role) {
      case WorkspaceRole.Owner: return 'Propriétaire'
      case WorkspaceRole.Admin: return 'Admin'
      case WorkspaceRole.Member: return 'Membre'
      case WorkspaceRole.Guest: return 'Invité'
      default: return 'Inconnu'
    }
  }

  const getRoleColor = (role: WorkspaceRole): string => {
    switch (role) {
      case WorkspaceRole.Owner: return '#8b5cf6'
      case WorkspaceRole.Admin: return '#3b82f6'
      case WorkspaceRole.Member: return '#10b981'
      case WorkspaceRole.Guest: return '#64748b'
      default: return '#94a3b8'
    }
  }

  return (
    <div className="workspace-admin-modal-overlay" onClick={onClose}>
      <div className="workspace-admin-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="workspace-admin-header">
          <div className="workspace-admin-header-left">
            <Building2 size={24} />
            <h2>Gestion des Workspaces</h2>
          </div>
          <button className="workspace-admin-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="workspace-admin-tabs">
          <button 
            className={`workspace-admin-tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <Building2 size={16} />
            Mes Workspaces
          </button>
          <button 
            className={`workspace-admin-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <Plus size={16} />
            Créer
          </button>
          <button 
            className={`workspace-admin-tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('members')
              if (!selectedWorkspaceForMembers && currentWorkspace) {
                setSelectedWorkspaceForMembers(currentWorkspace)
              }
            }}
          >
            <Users size={16} />
            Membres
          </button>
        </div>

        {/* Content */}
        <div className="workspace-admin-content">
          {error && (
            <div className="workspace-admin-error">
              ⚠️ {error}
            </div>
          )}

          {/* Tab: Liste */}
          {activeTab === 'list' && (
            <div className="workspace-list">
              {loading && workspaces.length === 0 ? (
                <div className="workspace-loading">⏳ Chargement...</div>
              ) : workspaces.length === 0 ? (
                <div className="workspace-empty">
                  <Building2 size={48} />
                  <p>Aucun workspace</p>
                  <button className="btn" onClick={() => setActiveTab('create')}>
                    Créer un workspace
                  </button>
                </div>
              ) : (
                <div className="workspace-grid">
                  {workspaces.map((workspace) => (
                    <div 
                      key={workspace.id} 
                      className={`workspace-card ${currentWorkspace?.id === workspace.id ? 'active' : ''}`}
                    >
                      <div className="workspace-card-header">
                        <div className="workspace-card-icon">
                          <Building2 size={24} />
                        </div>
                        <div className="workspace-card-info">
                          <h3>{workspace.name}</h3>
                          {workspace.description && (
                            <p>{workspace.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="workspace-card-stats">
                        <div className="workspace-stat">
                          <Users size={14} />
                          <span>{workspace.currentMemberCount || 0} membres</span>
                        </div>
                        <div className="workspace-stat">
                          <Building2 size={14} />
                          <span>{workspace.currentProjectCount || 0} dossiers</span>
                        </div>
                      </div>

                      <div className="workspace-card-actions">
                        {currentWorkspace?.id === workspace.id ? (
                          <div className="workspace-current-badge">
                            <Check size={14} />
                            Actif
                          </div>
                        ) : (
                          <button 
                            className="btn-workspace-switch"
                            onClick={() => handleSwitch(workspace)}
                          >
                            Basculer
                          </button>
                        )}
                        <button 
                          className="btn-workspace-icon"
                          onClick={() => setEditingWorkspace(workspace)}
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                        {workspaces.length > 1 && (
                          <button 
                            className="btn-workspace-icon btn-danger"
                            onClick={() => handleDelete(workspace.id)}
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Créer */}
          {activeTab === 'create' && (
            <div className="workspace-create">
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label>Nom du workspace *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Projet Alpha"
                    value={newWorkspace.name}
                    onChange={(e) => {
                      const name = e.target.value
                      const slug = name.toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '')
                      setNewWorkspace({ ...newWorkspace, name, slug })
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Slug (URL) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="projet-alpha"
                    value={newWorkspace.slug}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, slug: e.target.value })}
                    required
                    pattern="[a-z0-9-]+"
                  />
                  <small style={{ color: '#64748b', fontSize: '12px' }}>
                    Lettres minuscules, chiffres et tirets seulement
                  </small>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-input"
                    placeholder="Description du workspace..."
                    rows={4}
                    value={newWorkspace.description}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setActiveTab('list')}>
                    Annuler
                  </button>
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Création...' : 'Créer le workspace'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab: Membres */}
          {activeTab === 'members' && (
            <div className="workspace-members">
              {/* Workspace Selector */}
              <div className="members-workspace-selector">
                <label>Workspace :</label>
                <select
                  className="form-input"
                  value={selectedWorkspaceForMembers?.id || ''}
                  onChange={(e) => {
                    const ws = workspaces.find(w => w.id === e.target.value)
                    setSelectedWorkspaceForMembers(ws || null)
                  }}
                >
                  <option value="">Sélectionner un workspace</option>
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              </div>

              {selectedWorkspaceForMembers ? (
                <>
                  {/* Add Member Button */}
                  <div className="members-header">
                    <h3>
                      <Users size={20} />
                      Membres ({members.length})
                    </h3>
                    <button 
                      className="btn"
                      onClick={() => setShowAddMember(true)}
                    >
                      <UserPlus size={16} />
                      Ajouter un membre
                    </button>
                  </div>

                  {/* Members List */}
                  {loading && members.length === 0 ? (
                    <div className="workspace-loading">⏳ Chargement...</div>
                  ) : members.length === 0 ? (
                    <div className="workspace-empty">
                      <Users size={48} />
                      <p>Aucun membre</p>
                    </div>
                  ) : (
                    <div className="members-list">
                      {members.map((member) => (
                        <div key={member.userId} className="member-card">
                          <div className="member-info">
                            <div className="member-avatar">
                              {member.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="member-details">
                              <div className="member-name">{member.username}</div>
                              <div className="member-email">{member.email}</div>
                            </div>
                          </div>

                          <div className="member-actions">
                            <select
                              className="member-role-select"
                              value={member.role}
                              onChange={(e) => handleUpdateMemberRole(member.userId, parseInt(e.target.value))}
                              disabled={member.role === WorkspaceRole.Owner}
                              style={{ 
                                borderColor: getRoleColor(member.role),
                                color: getRoleColor(member.role)
                              }}
                            >
                              <option value={WorkspaceRole.Owner}>Propriétaire</option>
                              <option value={WorkspaceRole.Admin}>Administrateur</option>
                              <option value={WorkspaceRole.Member}>Membre</option>
                              <option value={WorkspaceRole.Guest}>Invité</option>
                            </select>

                            {member.role !== WorkspaceRole.Owner && (
                              <button
                                className="btn-workspace-icon btn-danger"
                                onClick={() => handleRemoveMember(member.userId)}
                                title="Retirer"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="workspace-empty">
                  <Building2 size={48} />
                  <p>Sélectionnez un workspace pour gérer ses membres</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Member Modal */}
        {showAddMember && selectedWorkspaceForMembers && (
          <div className="workspace-edit-modal-overlay" onClick={() => setShowAddMember(false)}>
            <div className="workspace-edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="workspace-edit-header">
                <h3>Ajouter un membre</h3>
                <button onClick={() => setShowAddMember(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddMember}>
                <div className="form-group">
                  <label>Sélectionner un utilisateur *</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                      <Search 
                        size={18} 
                        style={{ 
                          position: 'absolute', 
                          left: '12px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          color: '#94a3b8',
                          pointerEvents: 'none',
                          zIndex: 1
                        }} 
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Rechercher un utilisateur par nom ou email..."
                        value={userSearchTerm}
                        onChange={(e) => {
                          setUserSearchTerm(e.target.value)
                          filterUsers(e.target.value)
                        }}
                        onFocus={() => {
                          if (filteredUsers.length > 0) {
                            setShowUserDropdown(true)
                          }
                        }}
                        style={{ paddingLeft: '40px' }}
                        autoComplete="off"
                      />
                    </div>
                    
                    {/* Dropdown des utilisateurs */}
                    {showUserDropdown && filteredUsers.length > 0 && (
                      <div className="user-dropdown">
                        {filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className="user-dropdown-item"
                            onClick={() => selectUser(user)}
                          >
                            <div className="user-dropdown-avatar">
                              {(user.nomComplet || user.username)?.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-dropdown-info">
                              <div className="user-dropdown-name">
                                {user.nomComplet || user.username}
                              </div>
                              <div className="user-dropdown-email">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {loadingUsers && (
                      <div style={{ 
                        marginTop: '8px', 
                        color: '#64748b', 
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          border: '2px solid #e5e7eb',
                          borderTopColor: '#3b82f6',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                        Chargement des utilisateurs...
                      </div>
                    )}
                    
                    {userSearchTerm && filteredUsers.length === 0 && !loadingUsers && (
                      <div style={{ 
                        marginTop: '8px', 
                        color: '#ef4444', 
                        fontSize: '13px' 
                      }}>
                        Aucun utilisateur trouvé
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Rôle *</label>
                  <select
                    className="form-input"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(parseInt(e.target.value))}
                  >
                    <option value={WorkspaceRole.Admin}>Administrateur</option>
                    <option value={WorkspaceRole.Member}>Membre</option>
                    <option value={WorkspaceRole.Guest}>Invité</option>
                  </select>
                  <small style={{ color: '#64748b', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                    {newMemberRole === WorkspaceRole.Admin && '• Peut gérer les membres et les paramètres'}
                    {newMemberRole === WorkspaceRole.Member && '• Peut créer et modifier des dossiers'}
                    {newMemberRole === WorkspaceRole.Guest && '• Accès en lecture seule'}
                  </small>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddMember(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn" disabled={loading || !selectedUserId}>
                    {loading ? 'Ajout...' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingWorkspace && (
          <div className="workspace-edit-modal-overlay" onClick={() => setEditingWorkspace(null)}>
            <div className="workspace-edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="workspace-edit-header">
                <h3>Modifier le workspace</h3>
                <button onClick={() => setEditingWorkspace(null)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault()
                handleUpdate(editingWorkspace.id, {
                  name: editingWorkspace.name,
                  description: editingWorkspace.description,
                  isActive: editingWorkspace.isActive
                })
              }}>
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingWorkspace.name}
                    onChange={(e) => setEditingWorkspace({ ...editingWorkspace, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={editingWorkspace.description || ''}
                    onChange={(e) => setEditingWorkspace({ ...editingWorkspace, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editingWorkspace.isActive}
                      onChange={(e) => setEditingWorkspace({ ...editingWorkspace, isActive: e.target.checked })}
                    />
                    <span>Workspace actif</span>
                  </label>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setEditingWorkspace(null)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
