import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useChatConversations, useChatConversation, useChatGroups, useChatGroup, useUnreadCount } from '../hooks/useChat';
import { chatApi } from '../api/chatApi';
import { chatAttachmentApi } from '../api/chatAttachmentApi';
import { ChatConversationDto, ChatGroupDto, UserStatus } from '../types/chat';
import { CreateChatModal } from './CreateChatModal';
import { CreateGroupChatModal } from './CreateGroupChatModal';
import StatusSelector from './StatusSelector';
import { AudioPlayer } from './AudioPlayer';
import '../styles/unified-chat.css';

type ChatTab = 'conversations' | 'groups';
type ChatType = 'conversation' | 'group';

interface SelectedChat {
  type: ChatType;
  id: string;
}

// Fonction pour obtenir la couleur du statut - Nouvelles couleurs modernes
const getStatusColor = (status?: UserStatus): string => {
  switch (status) {
    case UserStatus.EnLigne:
      return '#10b981'; // Vert moderne
    case UserStatus.Occupe:
      return '#ef4444'; // Rouge moderne
    case UserStatus.Absent:
      return '#f59e0b'; // Orange moderne
    default:
      return '#6b7280'; // Gris par défaut
  }
};

// Fonction pour obtenir le libellé du statut
const getStatusLabel = (status?: UserStatus): string => {
  switch (status) {
    case UserStatus.EnLigne:
      return 'En ligne';
    case UserStatus.Occupe:
      return 'Occupé';
    case UserStatus.Absent:
      return 'Absent';
    default:
      return 'Hors ligne';
  }
};

// Composant pour afficher le statut avec le nouveau design
const StatusIndicator: React.FC<{ status?: UserStatus; size?: number; showPulse?: boolean }> = ({ 
  status, 
  size = 10, 
  showPulse = false 
}) => (
  <span
    style={{
      display: 'inline-block',
      position: 'relative',
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      backgroundColor: getStatusColor(status),
      border: '2px solid #fff',
      boxShadow: `0 0 0 2px ${getStatusColor(status)}40, 0 0 8px ${getStatusColor(status)}60`,
      animation: showPulse ? 'statusPulse 2s ease-in-out infinite' : 'none'
    }}
    title={getStatusLabel(status)}
  />
);

export const UnifiedChatPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTab>('conversations');
  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isCreateConvModalOpen, setIsCreateConvModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [currentUserStatus, setCurrentUserStatus] = useState<UserStatus>(UserStatus.EnLigne);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Charger le statut de l'utilisateur
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserStatus(user.status ?? UserStatus.EnLigne);
    }
  }, []);

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
    // Utilise le nom complet si disponible, sinon le username
    const userStr = localStorage.getItem('user');
    if (!userStr) return conv.user1NomComplet || conv.user1Username;
    
    const user = JSON.parse(userStr);
    const currentUserId = user.id;
    
    if (conv.user1Id === currentUserId) {
      return conv.user2NomComplet || conv.user2Username;
    }
    return conv.user1NomComplet || conv.user1Username;
  };

  const getOtherUserStatus = (conv: ChatConversationDto): UserStatus | undefined => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return undefined;
    
    const user = JSON.parse(userStr);
    const currentUserId = user.id;
    
    if (conv.user1Id === currentUserId) {
      return conv.user2Status;
    }
    return conv.user1Status;
  };

  const isLoading = selectedChat?.type === 'conversation' ? convDetailLoading : groupDetailLoading;
  
  // Emojis populaires
  const popularEmojis = ['😊', '😂', '❤️', '👍', '🎉', '🙏', '👏', '🔥', '✨', '💯', '🤝', '📝', '✅', '⚡', '💡'];
  
  // Fonction pour ajouter un emoji
  const addEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };
  
  // Fonction pour gérer les pièces jointes
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedChat) return;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Upload selon le type de chat
        if (selectedChat.type === 'conversation') {
          await chatAttachmentApi.uploadAttachment(selectedChat.id, file, false);
        } else {
          await chatAttachmentApi.uploadGroupAttachment(selectedChat.id, file, false);
        }
      }
      
      // Rafraîchir les messages
      if (selectedChat.type === 'conversation') {
        await refetchConversation();
      } else {
        await refetchGroup();
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Erreur upload fichier:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'upload du fichier');
    }
  };
  
  // Fonction pour démarrer/arrêter l'enregistrement audio
  const toggleRecording = async () => {
    if (!selectedChat) {
      alert('Veuillez sélectionner une conversation');
      return;
    }

    if (isRecording) {
      // Arrêter l'enregistrement
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Démarrer l'enregistrement
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Créer MediaRecorder avec format WebM
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        audioChunksRef.current = [];
        setRecordingStartTime(Date.now());
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const durationSeconds = Math.floor((Date.now() - recordingStartTime) / 1000);
          
          // Créer un File object
          const audioFile = new File(
            [audioBlob], 
            `voice-note-${Date.now()}.webm`, 
            { type: 'audio/webm' }
          );
          
          try {
            // Upload la note vocale
            if (selectedChat.type === 'conversation') {
              await chatAttachmentApi.uploadAttachment(
                selectedChat.id, 
                audioFile, 
                true, 
                durationSeconds
              );
              await refetchConversation();
            } else {
              await chatAttachmentApi.uploadGroupAttachment(
                selectedChat.id, 
                audioFile, 
                true, 
                durationSeconds
              );
              await refetchGroup();
            }
          } catch (error: any) {
            console.error('Erreur upload note vocale:', error);
            alert(error.response?.data?.message || 'Erreur lors de l\'envoi de la note vocale');
          }
          
          // Arrêter le stream
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Erreur microphone:', error);
        alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
      }
    }
  };
  
  // Filtrer les conversations selon la recherche
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherUserName = getOtherUserName(conv).toLowerCase();
    return otherUserName.includes(searchQuery.toLowerCase());
  });
  
  const filteredGroups = groups.filter(grp => {
    if (!searchQuery) return true;
    return grp.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ margin: 0 }}>Messages</h2>
              <StatusSelector 
                currentStatus={currentUserStatus} 
                onStatusChange={(newStatus) => setCurrentUserStatus(newStatus)}
              />
            </div>
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
                  
                  {/* Barre de recherche */}
                  <div style={{ padding: '12px 16px' }}>
                    <input
                      type="text"
                      placeholder="🔍 Rechercher une conversation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        background: '#f9fafb'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.background = '#fff';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = '#f9fafb';
                      }}
                    />
                  </div>
                  
                  {convLoading ? (
                    <div className="loading">Chargement...</div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="empty-state">
                      {searchQuery ? 'Aucun résultat' : 'Aucune conversation'}
                    </div>
                  ) : (
                    filteredConversations.map(conv => (
                      <div
                        key={conv.id}
                        className={`chat-item ${selectedChat?.id === conv.id && selectedChat?.type === 'conversation' ? 'active' : ''}`}
                        onClick={() => setSelectedChat({ type: 'conversation', id: conv.id })}
                      >
                        <div className="chat-item-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <StatusIndicator status={getOtherUserStatus(conv)} size={12} showPulse={true} />
                            <span className="chat-name">{getOtherUserName(conv)}</span>
                          </div>
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
                  
                  {/* Barre de recherche pour groupes */}
                  <div style={{ padding: '12px 16px' }}>
                    <input
                      type="text"
                      placeholder="🔍 Rechercher un groupe..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        background: '#f9fafb'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.background = '#fff';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = '#f9fafb';
                      }}
                    />
                  </div>
                  
                  {groupsLoading ? (
                    <div className="loading">Chargement...</div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="empty-state">
                      {searchQuery ? 'Aucun résultat' : 'Aucun groupe'}
                    </div>
                  ) : (
                    filteredGroups.map(grp => (
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
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedChat.type === 'conversation' && (
                      <>
                        <StatusIndicator status={getOtherUserStatus(conversations.find(c => c.id === selectedChat.id) || {} as ChatConversationDto)} />
                        {getOtherUserName(conversations.find(c => c.id === selectedChat.id) || {} as ChatConversationDto)}
                      </>
                    )}
                    {selectedChat.type === 'group' && groups.find(g => g.id === selectedChat.id)?.name}
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
                          <div className="message-sender" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <StatusIndicator status={msg.senderStatus} />
                            <span>{msg.senderNomComplet || msg.senderUsername}</span>
                          </div>
                          <div className="message-content">{msg.content}</div>
                          
                          {/* Afficher les pièces jointes */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {msg.attachments.map(attachment => (
                                <div key={attachment.id}>
                                  {attachment.isVoiceNote ? (
                                    <AudioPlayer attachment={attachment} />
                                  ) : (
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px',
                                        background: '#f0f2f5',
                                        borderRadius: '8px',
                                        maxWidth: '300px',
                                      }}
                                    >
                                      <span style={{ fontSize: '24px' }}>
                                        {attachment.fileType === 'Image' ? '🖼️' : 
                                         attachment.fileType === 'Document' ? '📄' : 
                                         attachment.fileType === 'Audio' ? '🎵' : '📎'}
                                      </span>
                                      <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: '500', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {attachment.fileName}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#667781' }}>
                                          {(attachment.fileSize / 1024).toFixed(0)} KB
                                        </div>
                                      </div>
                                      <a
                                        href={attachment.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          padding: '8px 12px',
                                          background: '#25D366',
                                          color: 'white',
                                          borderRadius: '6px',
                                          textDecoration: 'none',
                                          fontSize: '12px',
                                          fontWeight: '500',
                                        }}
                                      >
                                        ⬇️
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, position: 'relative' }}>
                    {/* Bouton emoji */}
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        padding: '4px',
                        transition: 'transform 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title="Ajouter un emoji"
                    >
                      😊
                    </button>
                    
                    {/* Bouton pièce jointe */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '22px',
                        cursor: 'pointer',
                        padding: '4px',
                        transition: 'transform 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title="Joindre un fichier"
                    >
                      📎
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    
                    {/* Bouton note vocale */}
                    <button
                      onClick={toggleRecording}
                      style={{
                        background: isRecording ? '#ef4444' : 'transparent',
                        border: isRecording ? '2px solid #dc2626' : 'none',
                        borderRadius: '50%',
                        fontSize: '22px',
                        cursor: 'pointer',
                        padding: '6px',
                        transition: 'all 0.2s ease',
                        animation: isRecording ? 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isRecording) e.currentTarget.style.transform = 'scale(1.2)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isRecording) e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title={isRecording ? "Arrêter l'enregistrement" : "Enregistrer une note vocale"}
                    >
                      🎤
                    </button>
                    
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
                      style={{ flex: 1 }}
                    />
                    
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '60px',
                          left: '0',
                          background: '#fff',
                          borderRadius: '12px',
                          padding: '16px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          zIndex: 1000,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 1fr)',
                          gap: '8px',
                          maxWidth: '280px',
                        }}
                      >
                        <div style={{ gridColumn: '1 / -1', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                          Emojis populaires
                        </div>
                        {popularEmojis.map((emoji, idx) => (
                          <button
                            key={idx}
                            onClick={() => addEmoji(emoji)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              fontSize: '28px',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '8px',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f3f4f6';
                              e.currentTarget.style.transform = 'scale(1.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
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
