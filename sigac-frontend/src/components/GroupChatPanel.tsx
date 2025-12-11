import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useChatGroups, useChatGroup } from '../hooks/useChat';
import { chatApi } from '../api/chatApi';
import { ChatGroupDto, ChatGroupDetailDto } from '../types/chat';
import { CreateGroupChatModal } from './CreateGroupChatModal';
import '../styles/chat.css';

export const GroupChatPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const { groups, loading: groupsLoading, refetch: refetchGroups } = useChatGroups();
  const { group, loading: detailLoading, refetch: refetchGroup } = useChatGroup(selectedGroup);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledRef = useRef(false);

  // Créer un checksum pour détecter les changements réels dans les groupes
  const groupsChecksum = useMemo(() => {
    return JSON.stringify(groups);
  }, [groups]);

  // Créer un checksum pour détecter les changements réels dans les messages
  const messagesChecksum = useMemo(() => {
    return group?.messages ? JSON.stringify(group.messages) : null;
  }, [group?.messages]);

  // Détecter si l'utilisateur scrolle manuellement
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => {
      const isAtBottom = 
        messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 10;
      isUserScrolledRef.current = !isAtBottom;
    };

    messagesContainer.addEventListener('scroll', handleScroll);
    return () => messagesContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Réinitialiser le scroll quand on change de groupe
  useEffect(() => {
    if (selectedGroup && group) {
      setLastMessageCount(group.messages.length);
      isUserScrolledRef.current = false;
      // Scroll vers le bas après le rendu
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [selectedGroup]);

  // Auto-scroll vers le dernier message
  useEffect(() => {
    if (!messagesChecksum) return;

    const currentMessageCount = group?.messages.length || 0;
    
    // Seulement scroll si de nouveaux messages arrivent
    if (currentMessageCount > lastMessageCount && !isUserScrolledRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
      setLastMessageCount(currentMessageCount);
    }
  }, [messagesChecksum, lastMessageCount, group?.messages.length]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedGroup) return;

    try {
      await chatApi.sendGroupMessage({
        chatGroupId: selectedGroup,
        content: messageInput,
      });
      setMessageInput('');
      // Rafraîchir le groupe
      await refetchGroup();
      // Rafraîchir la liste des groupes
      await refetchGroups();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  const handleOpenGroup = (groupId: string) => {
    setSelectedGroup(groupId);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) return;

    try {
      await chatApi.deleteGroup(groupId);
      setSelectedGroup(null);
      await refetchGroups();
    } catch (error) {
      console.error('Erreur lors de la suppression du groupe:', error);
    }
  };

  const handleGroupCreated = (groupId: string) => {
    setSelectedGroup(groupId);
    refetchGroups();
  };

  return (
    <>
      {/* Onglet pour afficher les groupes */}
      <div className="chat-groups-tab">
        <button
          className="groups-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          title="Ouvrir/Fermer les groupes"
        >
          👥
        </button>

        {isOpen && (
          <div className="chat-container groups-container">
            <div className="chat-header">
              <h3>Groupes</h3>
              <div className="header-actions">
                <button
                  className="new-chat-btn"
                  onClick={() => setIsCreateModalOpen(true)}
                  title="Nouveau groupe"
                >
                  ➕
                </button>
                <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
              </div>
            </div>

            <div className="chat-content">
              {/* Liste des groupes */}
              <div className="conversations-list">
                {groupsLoading ? (
                  <div className="loading">Chargement...</div>
                ) : groups.length === 0 ? (
                  <div className="empty-state">Aucun groupe</div>
                ) : (
                  groups.map(grp => (
                    <div
                      key={grp.id}
                      className={`conversation-item ${selectedGroup === grp.id ? 'active' : ''}`}
                      onClick={() => handleOpenGroup(grp.id)}
                    >
                      <div className="conversation-header">
                        <span className="user-name">{grp.name}</span>
                        <span className="member-badge">{grp.memberCount}</span>
                      </div>
                      <div className="conversation-date">
                        {grp.lastMessageAt
                          ? new Date(grp.lastMessageAt).toLocaleDateString('fr-FR')
                          : new Date(grp.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Détail du groupe sélectionné */}
              {selectedGroup && group && (
                <div className="conversation-detail">
                  <div className="conversation-detail-header">
                    <h4>{group.name}</h4>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteGroup(selectedGroup)}
                      title="Supprimer le groupe"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="messages-container" ref={messagesContainerRef}>
                    {detailLoading ? (
                      <div className="loading">Chargement des messages...</div>
                    ) : (
                      <>
                        {group.messages.map(message => (
                          <div
                            key={message.id}
                            className="message"
                          >
                            <div className="message-sender">{message.senderUsername}</div>
                            <div className="message-content">{message.content}</div>
                            <div className="message-time">
                              {new Date(message.sentAt).toLocaleTimeString('fr-FR')}
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  <div className="message-input-area">
                    <input
                      type="text"
                      placeholder="Votre message..."
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                      Envoyer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal pour créer un groupe */}
      <CreateGroupChatModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </>
  );
};
