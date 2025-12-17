import React, { useState, useEffect } from 'react'
import { useWorkspaceStore } from '../store/workspaceStore'
import { workspaceApi } from '../api/workspaceApi'
import type { WorkspaceDto, WorkspaceMemberDto, UpdateWorkspaceDto } from '../types/workspace'

type TabType = 'general' | 'members' | 'quotas' | 'danger'

export default function WorkspaceSettings() {
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // General tab state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  
  // Members tab state
  const [members, setMembers] = useState<WorkspaceMemberDto[]>([])
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  
  // Quotas tab state
  const [maxStorageGB, setMaxStorageGB] = useState(0)
  const [maxUsers, setMaxUsers] = useState(0)
  const [allowGuestAccess, setAllowGuestAccess] = useState(false)

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name)
      setDescription(currentWorkspace.description || '')
      setMaxStorageGB(currentWorkspace.maxStorageGB || 10)
      setMaxUsers(currentWorkspace.maxUsers || 50)
      setAllowGuestAccess(currentWorkspace.allowGuestAccess || false)
      loadMembers()
    }
  }, [currentWorkspace])

  const loadMembers = async () => {
    if (!currentWorkspace) return
    try {
      const membersList = await workspaceApi.getMembers(currentWorkspace.id)
      setMembers(membersList)
    } catch (err) {
      console.error('Error loading members:', err)
    }
  }

  const handleUpdateGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWorkspace) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const updateDto: UpdateWorkspaceDto = {
        name,
        description,
        maxStorageGB,
        maxUsers,
        allowGuestAccess
      }
      
      const updated = await workspaceApi.update(currentWorkspace.id, updateDto)
      setCurrentWorkspace(updated)
      setSuccess('Workspace mis à jour avec succès')
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRole = async (userId: string, newRole: number) => {
    if (!currentWorkspace) return
    
    try {
      await workspaceApi.updateMemberRoleSimple(currentWorkspace.id, userId, newRole)
      await loadMembers()
      setSuccess('Rôle mis à jour avec succès')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du changement de rôle')
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!currentWorkspace) return
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) return
    
    try {
      await workspaceApi.removeMember(currentWorkspace.id, userId)
      await loadMembers()
      setSuccess('Membre retiré avec succès')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression')
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return
    
    const confirmText = prompt(
      `Pour confirmer la suppression, tapez le nom du workspace: "${currentWorkspace.name}"`
    )
    
    if (confirmText !== currentWorkspace.name) {
      setError('Nom incorrect. Suppression annulée.')
      return
    }
    
    setLoading(true)
    try {
      await workspaceApi.delete(currentWorkspace.id)
      setCurrentWorkspace(null)
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression')
      setLoading(false)
    }
  }

  if (!currentWorkspace) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Aucun workspace sélectionné</h2>
        <p>Veuillez sélectionner un workspace pour accéder aux paramètres.</p>
      </div>
    )
  }

  const getRoleName = (role: number) => {
    switch (role) {
      case 0: return 'Owner'
      case 1: return 'Admin'
      case 2: return 'Member'
      case 3: return 'Guest'
      default: return 'Unknown'
    }
  }

  const getRoleColor = (role: number) => {
    switch (role) {
      case 0: return '#8b5cf6' // Owner - Purple
      case 1: return '#3b82f6' // Admin - Blue
      case 2: return '#10b981' // Member - Green
      case 3: return '#6b7280' // Guest - Gray
      default: return '#9ca3af'
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          Paramètres du Workspace
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          {currentWorkspace.name} ({currentWorkspace.slug})
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '6px',
          color: '#991b1b'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {success && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          backgroundColor: '#d1fae5',
          border: '1px solid #10b981',
          borderRadius: '6px',
          color: '#065f46'
        }}>
          ✅ {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '30px',
        display: 'flex',
        gap: '8px'
      }}>
        {[
          { id: 'general', label: '⚙️ Général', icon: '⚙️' },
          { id: 'members', label: '👥 Membres', icon: '👥' },
          { id: 'quotas', label: '📊 Quotas', icon: '📊' },
          { id: 'danger', label: '⚠️ Danger Zone', icon: '⚠️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
              color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === tab.id ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
              Informations Générales
            </h2>
            
            <form onSubmit={handleUpdateGeneral}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  Nom du Workspace *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  Slug
                </label>
                <input
                  type="text"
                  value={currentWorkspace.slug}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#f3f4f6',
                    cursor: 'not-allowed'
                  }}
                />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                  Le slug ne peut pas être modifié
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Description du workspace..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Enregistrement...' : '💾 Enregistrer'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setName(currentWorkspace.name)
                    setDescription(currentWorkspace.description || '')
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
                Membres ({members.length})
              </h2>
              <button
                onClick={() => setShowAddMemberModal(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                ➕ Ajouter un membre
              </button>
            </div>

            <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: '#6b7280' }}>
                      UTILISATEUR
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: '#6b7280' }}>
                      RÔLE
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: '#6b7280' }}>
                      AJOUTÉ LE
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '12px', color: '#6b7280' }}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                        Aucun membre trouvé
                      </td>
                    </tr>
                  ) : (
                    members.map(member => (
                      <tr key={member.userId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div>
                            <div style={{ fontWeight: '500', fontSize: '14px' }}>
                              {member.nomComplet || 'N/A'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {member.email || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <select
                            value={member.role}
                            onChange={(e) => handleChangeRole(member.userId, parseInt(e.target.value))}
                            disabled={member.role === 0} // Can't change Owner role
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '13px',
                              backgroundColor: member.role === 0 ? '#f3f4f6' : 'white',
                              cursor: member.role === 0 ? 'not-allowed' : 'pointer',
                              color: getRoleColor(member.role),
                              fontWeight: '500'
                            }}
                          >
                            <option value={0}>Owner</option>
                            <option value={1}>Admin</option>
                            <option value={2}>Member</option>
                            <option value={3}>Guest</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                          {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {member.role !== 0 && (
                            <button
                              onClick={() => handleRemoveMember(member.userId)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                fontSize: '13px',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              🗑️ Retirer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* QUOTAS TAB */}
        {activeTab === 'quotas' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
              Quotas et Limites
            </h2>

            <form onSubmit={handleUpdateGeneral}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  Stockage Maximum (GB)
                </label>
                <input
                  type="number"
                  value={maxStorageGB}
                  onChange={(e) => setMaxStorageGB(parseInt(e.target.value))}
                  min={1}
                  max={1000}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                  Limite de stockage pour les documents
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  Nombre Maximum d'Utilisateurs
                </label>
                <input
                  type="number"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(parseInt(e.target.value))}
                  min={1}
                  max={10000}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                  Nombre maximum de membres autorisés
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <input
                    type="checkbox"
                    checked={allowGuestAccess}
                    onChange={(e) => setAllowGuestAccess(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  Autoriser l'accès invité
                </label>
                <p style={{ marginTop: '4px', marginLeft: '26px', fontSize: '12px', color: '#6b7280' }}>
                  Permet aux utilisateurs invités de consulter les documents
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Enregistrement...' : '💾 Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DANGER ZONE TAB */}
        {activeTab === 'danger' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#dc2626' }}>
              ⚠️ Zone Dangereuse
            </h2>

            <div style={{
              border: '2px solid #ef4444',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#fef2f2'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#991b1b' }}>
                Supprimer ce workspace
              </h3>
              
              <p style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '16px' }}>
                Cette action est <strong>irréversible</strong>. Toutes les données suivantes seront définitivement supprimées :
              </p>
              
              <ul style={{ marginLeft: '20px', marginBottom: '16px', color: '#7f1d1d', fontSize: '14px' }}>
                <li>Tous les dossiers et documents</li>
                <li>Toutes les formations et audiences</li>
                <li>Tous les membres du workspace</li>
                <li>L'historique complet</li>
              </ul>

              <p style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '20px', fontWeight: '500' }}>
                ⚠️ Assurez-vous d'avoir sauvegardé toutes les données importantes avant de continuer.
              </p>

              <button
                onClick={handleDeleteWorkspace}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontSize: '14px'
                }}
              >
                🗑️ Supprimer définitivement le workspace
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal (placeholder) */}
      {showAddMemberModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Ajouter un membre
            </h3>
            <p style={{ marginBottom: '20px', color: '#6b7280' }}>
              Fonctionnalité à implémenter : sélection d'utilisateur + attribution de rôle
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddMemberModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
