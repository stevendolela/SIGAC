import React, { useState, useEffect } from 'react';
import { chatApi } from '../api/chatApi';
import { userApi } from '../api/userApi';
import '../styles/create-chat-modal.css';

interface User {
  id: string;
  username: string;
  nomComplet: string;
  email: string;
}

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export const CreateChatModal: React.FC<CreateChatModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingConversation, setCreatingConversation] = useState(false);

  // Charger la liste des utilisateurs au ouverture
  useEffect(() => {
    if (isOpen && users.length === 0) {
      loadUsers();
    }
  }, [isOpen]);

  // Filtrer les utilisateurs selon la recherche
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(query) ||
      user.nomComplet.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      // Utiliser l'API userApi au lieu de fetch direct
      const result = await userApi.list(1, 100);
      
      // Filtrer l'utilisateur courant
      const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').userId;
      const usersList = (result.data || [])
        .filter((user: any) => user.id !== currentUserId)
        .map((user: any) => ({
          id: user.id,
          username: user.username,
          nomComplet: user.nomComplet || user.name || user.username,
          email: user.email,
        }));
      
      setUsers(usersList);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError('Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (userId: string) => {
    try {
      setCreatingConversation(true);
      const conversation = await chatApi.createOrGetConversation(userId);
      setSearchQuery('');
      onConversationCreated(conversation.id);
      onClose();
    } catch (err) {
      console.error('Erreur lors de la création de la conversation:', err);
      setError('Impossible de créer la conversation');
    } finally {
      setCreatingConversation(false);
    }
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
              💬
            </div>
            <h2 style={{ 
              margin: 0, 
              color: 'white', 
              fontSize: '24px',
              fontWeight: 700
            }}>
              Nouvelle conversation
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
          {/* Champ de recherche amélioré */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Rechercher une personne à contacter..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '14px 18px 14px 48px',
                border: '2px solid #e5e7eb',
                borderRadius: '20px',
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
            {loading && (
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
                animation: 'spin 0.6s linear infinite'
              }} />
            )}
          </div>

          {/* Message d'erreur */}
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

          {/* Résultats de recherche */}
          <div style={{
            borderRadius: '20px'
          }}>
            {loading ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '14px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 16px',
                  border: '4px solid #e5e7eb',
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <div style={{ fontWeight: 600, color: '#475569' }}>
                  Chargement des utilisateurs...
                </div>
              </div>
            ) : searchQuery.trim() === '' ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '14px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '20px',
                border: '2px dashed #cbd5e1'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>💬</div>
                <div style={{ fontWeight: 600, marginBottom: '8px', color: '#475569' }}>
                  Démarrez une conversation
                </div>
                <div style={{ fontSize: '13px' }}>
                  Recherchez une personne pour commencer à discuter
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '14px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '20px',
                border: '2px dashed #cbd5e1'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
                <div style={{ fontWeight: 600, marginBottom: '8px', color: '#475569' }}>
                  Aucune personne trouvée
                </div>
                <div style={{ fontSize: '13px' }}>
                  pour "{searchQuery}"
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'white',
                borderRadius: '20px'
              }}>
                {filteredUsers.map((user, index) => (
                  <div
                    key={user.id}
                    onClick={() => !creatingConversation && handleSelectUser(user.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px 18px',
                      borderRadius: '18px',
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      cursor: creatingConversation ? 'not-allowed' : 'pointer',
                      opacity: creatingConversation ? 0.5 : 1,
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!creatingConversation) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.transform = 'translateX(6px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!creatingConversation) {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {/* Avatar circulaire premium avec gradient */}
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '18px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: 700,
                      flexShrink: 0,
                      boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
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
                    
                    {/* Informations utilisateur */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '16px',
                        color: '#1e293b',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {user.nomComplet}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#64748b',
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        @{user.username}
                      </div>
                      {user.email && (
                        <div style={{
                          fontSize: '13px',
                          color: '#94a3b8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {user.email}
                        </div>
                      )}
                    </div>
                    
                    {/* Icône d'action moderne */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '14px',
                      background: creatingConversation 
                        ? 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)' 
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 600,
                      flexShrink: 0,
                      transition: 'all 0.2s',
                      boxShadow: creatingConversation ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.4)'
                    }}>
                      {creatingConversation ? '⏳' : '💬'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
