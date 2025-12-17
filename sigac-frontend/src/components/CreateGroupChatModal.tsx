import React, { useState, useEffect } from 'react';
import { chatApi } from '../api/chatApi';
import { userApi } from '../api/userApi';
import '../styles/create-chat-modal.css';

interface CreateGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (groupId: string) => void;
}

export const CreateGroupChatModal: React.FC<CreateGroupChatModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; username: string; nomComplet: string }>>([]);
  const [filteredUsers, setFilteredUsers] = useState<Array<{ id: string; username: string; nomComplet: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && users.length === 0) {
      loadUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers([]);
      return;
    }
    const search = searchTerm.toLowerCase();
    const filtered = users.filter(u => 
      !selectedUsers.includes(u.id) && (
        u.username.toLowerCase().includes(search) ||
        u.nomComplet.toLowerCase().includes(search)
      )
    );
    setFilteredUsers(filtered.slice(0, 10));
  }, [searchTerm, users, selectedUsers]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const result = await userApi.list(1, 100);
      const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').userId;
      const usersList = (result.data || [])
        .filter((user: any) => user.id !== currentUserId)
        .map((user: any) => ({
          id: user.id,
          username: user.username,
          nomComplet: user.nomComplet || user.username,
        }));
      setUsers(usersList);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Le nom du groupe est requis');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Sélectionnez au moins un utilisateur');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const group = await chatApi.createGroup({
        name: groupName,
        description: description || undefined,
        memberIds: selectedUsers,
      });

      setGroupName('');
      setDescription('');
      setSelectedUsers([]);
      onGroupCreated(group.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du groupe');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'hidden'
        }}
      >
        {/* Header avec gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              👥
            </div>
            <h2 style={{ 
              margin: 0, 
              color: 'white', 
              fontSize: '24px',
              fontWeight: 700
            }}>
              Créer un groupe
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'rotate(0deg)';
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ 
          padding: '32px',
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 160px)'
        }}>
          {error && (
            <div style={{
              padding: '16px',
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              border: '1px solid #fca5a5',
              borderRadius: '16px',
              color: '#dc2626',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label 
              htmlFor="groupName"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              Nom du groupe *
            </label>
            <input
              id="groupName"
              type="text"
              placeholder="Ex: Équipe Projet, Famille, Amis..."
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 18px',
                border: '2px solid #e5e7eb',
                borderRadius: '16px',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
                background: 'white',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label 
              htmlFor="description"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              Description <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optionnel)</span>
            </label>
            <textarea
              id="description"
              placeholder="Ajoutez une description pour le groupe..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
              style={{
                width: '100%',
                padding: '14px 18px',
                border: '2px solid #e5e7eb',
                borderRadius: '16px',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
                background: 'white',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '80px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              color: '#1e293b',
              fontWeight: 600,
              fontSize: '14px'
            }}>
              Membres du groupe *
            </label>
            
            {/* Champ de recherche avec design moderne */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="🔍 Rechercher un utilisateur à ajouter..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                disabled={loading || loadingUsers}
                style={{
                  width: '100%',
                  padding: '14px 18px 14px 48px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '20px',
                  fontSize: '15px',
                  transition: 'all 0.2s',
                  outline: 'none',
                  background: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div style={{
                position: 'absolute',
                left: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '18px',
                pointerEvents: 'none'
              }}>
                🔍
              </div>
              {loadingUsers && (
                <div style={{
                  position: 'absolute',
                  right: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  border: '3px solid #e5e7eb',
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              )}
            </div>
            
            {/* Dropdown des résultats avec design ultra moderne */}
            {searchTerm && filteredUsers.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '20px',
                maxHeight: '280px',
                overflowY: 'auto',
                marginBottom: '20px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
                border: '1px solid #e5e7eb',
                animation: 'slideDown 0.3s ease'
              }}>
                {filteredUsers.map((user, index) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      toggleUserSelection(user.id);
                      setSearchTerm('');
                    }}
                    style={{
                      padding: '14px 18px',
                      cursor: 'pointer',
                      borderBottom: index < filteredUsers.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      borderRadius: index === 0 ? '20px 20px 0 0' : (index === filteredUsers.length - 1 ? '0 0 20px 20px' : '0')
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
                      e.currentTarget.style.transform = 'translateX(6px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {/* Avatar avec effet de brillance */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '18px',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {user.nomComplet.charAt(0).toUpperCase()}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      }} />
                    </div>
                    
                    {/* Info utilisateur */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: 600, 
                        color: '#1e293b',
                        fontSize: '15px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '2px'
                      }}>
                        {user.nomComplet}
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#64748b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        @{user.username}
                      </div>
                    </div>
                    
                    {/* Bouton d'ajout moderne */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.2s'
                    }}>
                      +
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Message si recherche sans résultat */}
            {searchTerm && filteredUsers.length === 0 && !loadingUsers && (
              <div style={{
                padding: '32px 24px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '14px',
                marginBottom: '20px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '20px',
                border: '2px dashed #cbd5e1'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>🔍</div>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: '#475569' }}>
                  Aucun utilisateur trouvé
                </div>
                <div style={{ fontSize: '13px' }}>
                  pour "{searchTerm}"
                </div>
              </div>
            )}
            
            {/* En-tête des utilisateurs sélectionnés avec design premium */}
            {selectedUsers.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                padding: '12px 18px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                borderRadius: '16px',
                border: '1px solid #bfdbfe'
              }}>
                <span style={{ 
                  fontWeight: 600, 
                  color: '#1e40af',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '18px' }}>👥</span>
                  {selectedUsers.length} membre{selectedUsers.length !== 1 ? 's' : ''} sélectionné{selectedUsers.length !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedUsers([])}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#dc2626',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: '10px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                    e.currentTarget.style.borderColor = '#fca5a5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                  }}
                >
                  Tout retirer
                </button>
              </div>
            )}
            
            {/* Liste des utilisateurs sélectionnés avec pills ultra modernes */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              minHeight: selectedUsers.length === 0 ? '100px' : 'auto',
              padding: '20px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '20px',
              border: '2px dashed #cbd5e1',
              alignItems: 'center',
              justifyContent: selectedUsers.length === 0 ? 'center' : 'flex-start'
            }}>
              {selectedUsers.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '14px'
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px', opacity: 0.5 }}>👥</div>
                  <div style={{ fontWeight: 500 }}>Aucun membre sélectionné</div>
                  <div style={{ fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>
                    Recherchez et ajoutez des utilisateurs ci-dessus
                  </div>
                </div>
              ) : (
                selectedUsers.map(userId => {
                  const user = users.find(u => u.id === userId);
                  return (
                    <div
                      key={userId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        background: 'white',
                        borderRadius: '30px',
                        border: '2px solid #e5e7eb',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#1e293b',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.25)';
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Mini avatar arrondi */}
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 700,
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                      }}>
                        {user?.nomComplet.charAt(0).toUpperCase()}
                      </div>
                      
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {user?.nomComplet}
                      </span>
                      
                      {/* Bouton de suppression moderne */}
                      <button
                        onClick={() => toggleUserSelection(userId)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '12px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: 'none',
                          color: '#dc2626',
                          fontSize: '16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          flexShrink: 0,
                          fontWeight: 600
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
                          e.currentTarget.style.transform = 'scale(1.15) rotate(90deg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer avec boutons modernes */}
        <div style={{
          padding: '24px 32px',
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          borderBottomLeftRadius: '24px',
          borderBottomRightRadius: '24px'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '12px 28px',
              borderRadius: '14px',
              border: '2px solid #e5e7eb',
              background: 'white',
              color: '#64748b',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={loading || !groupName.trim() || selectedUsers.length === 0}
            style={{
              padding: '12px 32px',
              borderRadius: '14px',
              border: 'none',
              background: loading || !groupName.trim() || selectedUsers.length === 0
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading || !groupName.trim() || selectedUsers.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading || !groupName.trim() || selectedUsers.length === 0
                ? 'none'
                : '0 4px 12px rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!loading && groupName.trim() && selectedUsers.length > 0) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && groupName.trim() && selectedUsers.length > 0) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Création en cours...
              </>
            ) : (
              <>
                <span style={{ fontSize: '18px' }}>✨</span>
                Créer le groupe
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
