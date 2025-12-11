import React, { useState, useEffect } from 'react';
import { chatApi } from '../api/chatApi';
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
      // Note: Vous aurez besoin d'un endpoint pour récupérer les utilisateurs
      // Pour maintenant, on suppose que chatApi a une méthode getUsers()
      // Sinon, vous devrez créer une autre classe API
      const response = await fetch('https://sigac-api.onrender.com/api/Users?page=1&pageSize=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }

      const data = await response.json();
      // Filtrer l'utilisateur courant
      const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').userId;
      const usersList = (data.data || data || [])
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Nouvelle Conversation</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Champ de recherche */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Chercher une personne..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
              autoFocus
            />
            <span className="search-icon">🔍</span>
          </div>

          {/* Message d'erreur */}
          {error && <div className="error-message">{error}</div>}

          {/* Résultats de recherche */}
          <div className="users-list">
            {loading ? (
              <div className="loading">Chargement...</div>
            ) : searchQuery.trim() === '' ? (
              <div className="empty-state">Commencez à taper pour chercher une personne</div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">Aucune personne trouvée</div>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="user-item"
                  onClick={() => handleSelectUser(user.id)}
                  style={{ opacity: creatingConversation ? 0.5 : 1, pointerEvents: creatingConversation ? 'none' : 'auto' }}
                >
                  <div className="user-avatar">
                    {user.nomComplet.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.nomComplet}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  <div className="user-action">→</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
