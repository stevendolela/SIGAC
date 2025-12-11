import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useChatConversations, useChatConversation, useChatGroups, useChatGroup, useUnreadCount } from '../hooks/useChat';
import { chatApi } from '../api/chatApi';
import { ChatConversationDto, ChatGroupDto } from '../types/chat';
import { CreateChatModal } from './CreateChatModal';
import { CreateGroupChatModal } from './CreateGroupChatModal';
import '../styles/unified-chat.css';

type ChatTab = 'conversations' | 'groups';
type ChatType = 'conversation' | 'group';

interface SelectedChat {
  type: ChatType;
  id: string;
}

export const UnifiedChatPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTab>('conversations');
  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isCreateConvModalOpen, setIsCreateConvModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Conversations
  const { conversations, loading: convLoading, refetch: refetchConversations } = useChatConversations();
  const { conversation, loading: convDetailLoading, refetch: refetchConversation } = useChatConversation(
    selectedChat?.type === 'conversation' ? selectedChat.id : null
  );

  // Groups
  const { groups, loading: groupsLoading, refetch: refetchGroups } = useChatGroups();
  const { group, loading: groupDetailLoading, refetch: refetchGroup } = useChatGroup(
    selectedChat?.type === 'group' ? selectedChat.id : null
  );

  const { unreadCount } = useUnreadCount();

  // Refs pour le scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledRef = useRef(false);

  // Checksums pour détecter les changements
  const messagesChecksum = useMemo(() => {
    if (selectedChat?.type === 'conversation' && conversation) {
      return JSON.stringify(conversation.messages);
    } else if (selectedChat?.type === 'group' && group) {
      return JSON.stringify(group.messages);
    }
    return null;
  }, [selectedChat, conversation?.messages, group?.messages]);

  // Détection scroll utilisateur
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

  // Réinitialiser scroll au changement de chat
  useEffect(() => {
    if (selectedChat) {
      setLastMessageCount(0);
      isUserScrolledRef.current = false;
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [selectedChat?.id, selectedChat?.type]);

  // Auto-scroll
  useEffect(() => {
    if (!messagesChecksum) return;

    const messageCount = selectedChat?.type === 'conversation' 
      ? conversation?.messages.length || 0 
      : group?.messages.length || 0;
    
    if (messageCount > lastMessageCount && !isUserScrolledRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
      setLastMessageCount(messageCount);
    }
  }, [messagesChecksum, lastMessageCount, selectedChat, conversation?.messages.length, group?.messages.length]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;

    try {
      if (selectedChat.type === 'conversation') {
        await chatApi.sendMessage(selectedChat.id, messageInput);
        await refetchConversation();
      } else {
        await chatApi.sendGroupMessage({
          chatGroupId: selectedChat.id,
          content: messageInput,
        });
        await refetchGroup();
      }
      setMessageInput('');
      await refetchConversations();
      await refetchGroups();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) return;
    try {
      await chatApi.deleteConversation(convId);
      setSelectedChat(null);
      await refetchConversations();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) return;
    try {
      await chatApi.deleteGroup(groupId);
      setSelectedChat(null);
      await refetchGroups();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleConversationCreated = (convId: string) => {
    setSelectedChat({ type: 'conversation', id: convId });
    setIsCreateConvModalOpen(false);
    setActiveTab('conversations');
    refetchConversations();
  };

  const handleGroupCreated = (groupId: string) => {
    setSelectedChat({ type: 'group', id: groupId });
    setIsCreateGroupModalOpen(false);
    setActiveTab('groups');
    refetchGroups();
  };

  const getOtherUserName = (conv: ChatConversationDto): string => {
    return `${conv.user1Username} & ${conv.user2Username}`;
  };

  const isLoading = selectedChat?.type === 'conversation' ? convDetailLoading : groupDetailLoading;

  return (
    <div className="unified-chat-panel">
      {/* Bouton toggle */}
      <button
        className="unified-chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Ouvrir/Fermer le chat"
      >
        💬
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>

      {/* Panel principal */}
      {isOpen && (
        <div className="unified-chat-container">
          {/* Header */}
          <div className="unified-chat-header">
            <h2>Messages</h2>
            <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {/* Onglets */}
          <div className="unified-tabs">
            <button
              className={`tab ${activeTab === 'conversations' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('conversations');
                setSelectedChat(null);
              }}
            >
              💬 Conversations
            </button>
            <button
              className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('groups');
                setSelectedChat(null);
              }}
            >
              👥 Groupes
            </button>
          </div>

          {/* Contenu */}
          <div className="unified-chat-content">
            {/* Liste */}
            <div className="chats-list">
              {activeTab === 'conversations' && (
                <>
                  <div className="list-header">
                    <h3>Conversations</h3>
                    <button
                      className="new-btn"
                      onClick={() => setIsCreateConvModalOpen(true)}
                      title="Nouvelle conversation"
                    >
                      ➕
                    </button>
                  </div>
                  {convLoading ? (
                    <div className="loading">Chargement...</div>
                  ) : conversations.length === 0 ? (
                    <div className="empty-state">Aucune conversation</div>
                  ) : (
                    conversations.map(conv => (
                      <div
                        key={conv.id}
                        className={`chat-item ${selectedChat?.id === conv.id && selectedChat?.type === 'conversation' ? 'active' : ''}`}
                        onClick={() => setSelectedChat({ type: 'conversation', id: conv.id })}
                      >
                        <div className="chat-item-header">
                          <span className="chat-name">{getOtherUserName(conv)}</span>
                          {conv.unreadCount > 0 && (
                            <span className="unread-count">{conv.unreadCount}</span>
                          )}
                        </div>
                        <div className="chat-item-date">
                          {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString('fr-FR') : new Date(conv.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {activeTab === 'groups' && (
                <>
                  <div className="list-header">
                    <h3>Groupes</h3>
                    <button
                      className="new-btn"
                      onClick={() => setIsCreateGroupModalOpen(true)}
                      title="Nouveau groupe"
                    >
                      ➕
                    </button>
                  </div>
                  {groupsLoading ? (
                    <div className="loading">Chargement...</div>
                  ) : groups.length === 0 ? (
                    <div className="empty-state">Aucun groupe</div>
                  ) : (
                    groups.map(grp => (
                      <div
                        key={grp.id}
                        className={`chat-item ${selectedChat?.id === grp.id && selectedChat?.type === 'group' ? 'active' : ''}`}
                        onClick={() => setSelectedChat({ type: 'group', id: grp.id })}
                      >
                        <div className="chat-item-header">
                          <span className="chat-name">{grp.name}</span>
                          <span className="member-badge">{grp.memberCount}</span>
                        </div>
                        <div className="chat-item-date">
                          {grp.lastMessageAt ? new Date(grp.lastMessageAt).toLocaleDateString('fr-FR') : new Date(grp.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>

            {/* Détail du chat sélectionné */}
            {selectedChat && (selectedChat.type === 'conversation' ? conversation : group) && (
              <div className="chat-detail">
                <div className="chat-detail-header">
                  <h3>
                    {selectedChat.type === 'conversation'
                      ? getOtherUserName(conversations.find(c => c.id === selectedChat.id) || {} as ChatConversationDto)
                      : groups.find(g => g.id === selectedChat.id)?.name}
                  </h3>
                  <button
                    className="delete-btn"
                    onClick={() => {
                      if (selectedChat.type === 'conversation') {
                        handleDeleteConversation(selectedChat.id);
                      } else {
                        handleDeleteGroup(selectedChat.id);
                      }
                    }}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>

                <div className="messages-container" ref={messagesContainerRef}>
                  {isLoading ? (
                    <div className="loading">Chargement des messages...</div>
                  ) : (
                    <>
                      {(selectedChat.type === 'conversation' ? conversation?.messages : group?.messages)?.map(msg => (
                        <div key={msg.id} className="message">
                          <div className="message-sender">{msg.senderUsername}</div>
                          <div className="message-content">{msg.content}</div>
                          <div className="message-time">
                            {new Date(msg.sentAt).toLocaleTimeString('fr-FR')}
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

      {/* Modals */}
      <CreateChatModal
        isOpen={isCreateConvModalOpen}
        onClose={() => setIsCreateConvModalOpen(false)}
        onConversationCreated={handleConversationCreated}
      />
      <CreateGroupChatModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
};
