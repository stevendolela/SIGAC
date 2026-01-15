import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useChatConversations, useChatConversation, useUnreadCount } from '../hooks/useChat';
import { chatApi } from '../api/chatApi';
import { ChatConversationDto, ChatConversationDetailDto } from '../types/chat';
import { CreateChatModal } from './CreateChatModal';
import { VideoCallModal } from './VideoCallModal';
import '../styles/chat.css';
import '../styles/create-chat-modal.css';
import '../styles/video-call.css';

export const ChatPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVideoCallModalOpen, setIsVideoCallModalOpen] = useState(false);
  const [videoCallReceiverId, setVideoCallReceiverId] = useState<string>('');
  const [videoCallReceiverName, setVideoCallReceiverName] = useState<string>('');
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [prevConversationsRef, setPrevConversationsRef] = useState<string | null>(null);
  const [prevMessagesRef, setPrevMessagesRef] = useState<string | null>(null);
  const { conversations, loading: convLoading, refetch: refetchConversations } = useChatConversations();
  const { conversation, loading: detailLoading, refetch: refetchConversation } = useChatConversation(selectedConversation);
  const { unreadCount } = useUnreadCount();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledRef = useRef(false);

  // Créer un checksum pour détecter les changements réels dans les conversations
  const conversationsChecksum = useMemo(() => {
    return JSON.stringify(conversations);
  }, [conversations]);

  // Créer un checksum pour détecter les changements réels dans les messages
  const messagesChecksum = useMemo(() => {
    return conversation?.messages ? JSON.stringify(conversation.messages) : null;
  }, [conversation?.messages]);

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

  // Réinitialiser le scroll quand on change de conversation
  useEffect(() => {
    if (selectedConversation && conversation) {
      setLastMessageCount(conversation.messages.length);
      isUserScrolledRef.current = false;
      // Scroll vers le bas après le rendu
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [selectedConversation]);

  // Auto-scroll vers le dernier message (seulement si l'utilisateur n'a pas scrollé)
  // N'utiliser que le checksum pour éviter les re-triggers inutiles
  useEffect(() => {
    if (!messagesChecksum) return;

    const currentMessageCount = conversation?.messages.length || 0;
    
    // Seulement scroll si de nouveaux messages arrivent
    if (currentMessageCount > lastMessageCount && !isUserScrolledRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
      setLastMessageCount(currentMessageCount);
    }
  }, [messagesChecksum, lastMessageCount, conversation?.messages.length]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      await chatApi.sendMessage(selectedConversation, messageInput);
      setMessageInput('');
      // Rafraîchir la conversation
      await refetchConversation();
      // Rafraîchir la liste des conversations
      await refetchConversations();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  const handleOpenConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) return;

    try {
      await chatApi.deleteConversation(conversationId);
      setSelectedConversation(null);
      await refetchConversations();
    } catch (error) {
      console.error('Erreur lors de la suppression de la conversation:', error);
    }
  };

  const handleConversationCreated = (conversationId: string) => {
    setSelectedConversation(conversationId);
    refetchConversations();
  };

  const handleStartVideoCall = () => {
    if (!conversation) return;

    // Déterminer l'ID et le nom de l'autre utilisateur
    const currentUserId = localStorage.getItem('userId') || '';
    const otherUserId = conversation.user1Id === currentUserId ? conversation.user2Id : conversation.user1Id;
    const otherUserName = conversation.user1Id === currentUserId 
      ? conversation.user2Username
      : conversation.user1Username;

    setVideoCallReceiverId(otherUserId);
    setVideoCallReceiverName(otherUserName || 'Utilisateur inconnu');
    setIsVideoCallModalOpen(true);
  };

  const getOtherUserName = (conv: ChatConversationDto): string => {
    // À adapter selon l'ID de l'utilisateur connecté
    // Pour l'instant, on affiche les deux noms
    return `${conv.user1Username} & ${conv.user2Username}`;
  };

  return (
    <div className="chat-panel">
      {/* Bouton toggle */}
      <button
        className="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Ouvrir/Fermer le chat"
      >
        💬
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>

      {/* Panel principal */}
      {isOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <h3>Conversations</h3>
            <div className="header-actions">
              <button
                className="new-chat-btn"
                onClick={() => setIsCreateModalOpen(true)}
                title="Nouvelle conversation"
              >
                ➕
              </button>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          <div className="chat-content">
            {/* Liste des conversations */}
            <div className="conversations-list">
              {convLoading ? (
                <div className="loading">Chargement...</div>
              ) : conversations.length === 0 ? (
                <div className="empty-state">Aucune conversation</div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${selectedConversation === conv.id ? 'active' : ''}`}
                    onClick={() => handleOpenConversation(conv.id)}
                  >
                    <div className="conversation-header">
                      <span className="user-name">{getOtherUserName(conv)}</span>
                      {conv.unreadCount > 0 && (
                        <span className="unread-count">{conv.unreadCount}</span>
                      )}
                    </div>
                    <div className="conversation-date">
                      {conv.lastMessageAt
                        ? new Date(conv.lastMessageAt).toLocaleDateString('fr-FR')
                        : new Date(conv.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Détail de la conversation sélectionnée */}
            {selectedConversation && conversation && (
              <div className="conversation-detail">
                <div className="conversation-detail-header">
                  <h4>{getOtherUserName(conversations.find(c => c.id === selectedConversation) || {} as ChatConversationDto)}</h4>
                  <div className="header-actions">
                    <button
                      className="video-call-btn"
                      onClick={handleStartVideoCall}
                      title="Démarrer un appel vidéo"
                    >
                      📹
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteConversation(selectedConversation)}
                      title="Supprimer la conversation"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="messages-container" ref={messagesContainerRef}>
                  {detailLoading ? (
                    <div className="loading">Chargement des messages...</div>
                  ) : (
                    <>
                      {conversation.messages.map(message => (
                        <div
                          key={message.id}
                          className={`message ${message.isRead ? 'read' : 'unread'}`}
                        >
                          <div className="message-sender">{message.senderUsername}</div>
                          <div className="message-content">{message.content}</div>
                          <div className="message-time">
                            {new Date(message.sentAt).toLocaleTimeString('fr-FR')}
                            {message.isRead && ' ✓'}
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

      {/* Modal pour créer une nouvelle conversation */}
      <CreateChatModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConversationCreated={handleConversationCreated}
      />

      {/* Modal pour appel vidéo */}
      <VideoCallModal
        isOpen={isVideoCallModalOpen}
        onClose={() => setIsVideoCallModalOpen(false)}
        receiverId={videoCallReceiverId}
        receiverName={videoCallReceiverName}
        conversationId={selectedConversation || undefined}
      />
    </div>
  );
};
