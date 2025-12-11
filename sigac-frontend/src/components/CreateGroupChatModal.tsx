import React, { useState, useEffect } from 'react';
import { chatApi } from '../api/chatApi';
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
  const [users, setUsers] = useState<Array<{ id: string; username: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Charger les utilisateurs disponibles
      // TODO: Implémenter l'endpoint pour récupérer les utilisateurs
      setSearchTerm('');
      setSelectedUsers([]);
    }
  }, [isOpen]);

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Créer un groupe de chat</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="groupName">Nom du groupe *</label>
            <input
              id="groupName"
              type="text"
              placeholder="Ex: Équipe Projet"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optionnel)</label>
            <textarea
              id="description"
              placeholder="Description du groupe"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Membres à ajouter *</label>
            <div className="selected-members">
              {selectedUsers.length === 0 ? (
                <span className="placeholder">Aucun utilisateur sélectionné</span>
              ) : (
                selectedUsers.map(userId => (
                  <span key={userId} className="selected-member">
                    {users.find(u => u.id === userId)?.username || userId}
                    <button
                      type="button"
                      onClick={() => toggleUserSelection(userId)}
                      className="remove-member"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
            <p className="member-count">
              {selectedUsers.length} utilisateur{selectedUsers.length !== 1 ? 's' : ''} sélectionné{selectedUsers.length !== 1 ? 's' : ''}
            </p>
          </div>

          <p className="info-text">
            Note: Un endpoint pour récupérer les utilisateurs disponibles est nécessaire.
          </p>
        </div>

        <div className="modal-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className="btn-primary"
            onClick={handleCreateGroup}
            disabled={loading || !groupName.trim() || selectedUsers.length === 0}
          >
            {loading ? 'Création...' : 'Créer le groupe'}
          </button>
        </div>
      </div>
    </div>
  );
};
