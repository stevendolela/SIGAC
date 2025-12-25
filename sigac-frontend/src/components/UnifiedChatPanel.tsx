import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

  // Composant pour afficher une image avec authentification
  // Composant pour afficher un document avec boutons au hover
  const DocumentCard: React.FC<{
    attachment: any;
    onPreview: () => void;
    onDownload: () => void;
    onDelete: () => void;
    getFileIcon: (fileName: string, mimeType: string) => string;
  }> = ({ attachment, onPreview, onDownload, onDelete, getFileIcon }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        onClick={onPreview}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          maxWidth: '320px',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f3f4f6';
          e.currentTarget.style.borderColor = '#d1d5db';
          setIsHovered(true);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#f9fafb';
          e.currentTarget.style.borderColor = '#e5e7eb';
          setIsHovered(false);
        }}
        title="Cliquer pour visualiser"
      >
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '8px',
          background: 
            attachment.fileType === 'Document' ? '#fee2e2' :
            attachment.fileType === 'Audio' ? '#ede9fe' :
            attachment.fileType === 'Video' ? '#fef3c7' : '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0
        }}>
          {getFileIcon(attachment.fileName, attachment.mimeType)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: '500', 
            fontSize: '14px', 
            color: '#111827',
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            marginBottom: '2px'
          }}>
            {attachment.fileName}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{(attachment.fileSize / 1024).toFixed(0)} KB</span>
            {attachment.fileType === 'Document' && (
              <span>• {attachment.mimeType.includes('pdf') ? 'PDF' : 
                       attachment.mimeType.includes('word') ? 'Word' : 
                       attachment.mimeType.includes('excel') ? 'Excel' : 'Doc'}</span>
            )}
          </div>
        </div>
        <div style={{
          display: 'flex',
          gap: '8px',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          pointerEvents: isHovered ? 'auto' : 'none'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            style={{
              padding: '8px 14px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              padding: '8px 12px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              marginLeft: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            🗑️
          </button>
        </div>
      </div>
    );
  };

  // Composant pour afficher une note vocale avec bouton suppression au hover
  const VoiceNoteCard: React.FC<{
    attachment: any;
    onDelete: () => void;
  }> = ({ attachment, onDelete }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div 
        style={{
          position: 'relative',
          maxWidth: '400px'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AudioPlayer attachment={attachment} />
        
        {/* Bouton suppression overlay au hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            padding: '6px',
            background: 'rgba(239, 68, 68, 0.95)',
            color: 'white',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
            pointerEvents: isHovered ? 'auto' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.95)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.95)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    );
  };

  const ImageWithAuth: React.FC<{
    attachmentId: string;
    fileName: string;
    onImageClick: () => void;
    onDownload: () => void;
    onDelete: () => void;
    getFileIcon: (fileName: string, mimeType: string) => string;
    mimeType: string;
  }> = ({ attachmentId, fileName, onImageClick, onDownload, onDelete, getFileIcon, mimeType }) => {
    const [imgSrc, setImgSrc] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
      let mounted = true;
      
      const loadImage = async () => {
        try {
          const blob = await chatAttachmentApi.downloadAttachment(attachmentId);
          const url = URL.createObjectURL(blob);
          if (mounted) {
            setImgSrc(url);
            setLoading(false);
          }
        } catch (error) {
          console.error('Erreur chargement image:', error);
          if (mounted) setLoading(false);
        }
      };

      loadImage();

      return () => {
        mounted = false;
        if (imgSrc) URL.revokeObjectURL(imgSrc);
      };
    }, [attachmentId]);

    if (loading) {
      return (
        <div style={{
          maxWidth: '300px',
          height: '200px',
          borderRadius: '12px',
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          Chargement...
        </div>
      );
    }

    return (
      <div 
        style={{
          maxWidth: '300px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          background: '#fff',
          position: 'relative'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {imgSrc && (
          <img 
            src={imgSrc} 
            alt={fileName}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              cursor: 'pointer'
            }}
            onClick={onImageClick}
            title="Cliquer pour agrandir"
          />
        )}
        <div style={{
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          pointerEvents: isHovered ? 'auto' : 'none'
        }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{getFileIcon(fileName, mimeType)}</span>
            <span>{fileName}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            style={{
              padding: '4px 8px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              marginLeft: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              padding: '4px 8px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              marginLeft: '4px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      </div>
    );
  };

// Composant isolé pour le badge unread (évite re-render du panel principal)
const UnreadBadge: React.FC = React.memo(() => {
  const { unreadCount } = useUnreadCount();
  return unreadCount > 0 ? <span className="unread-badge">{unreadCount}</span> : null;
});

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
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewTime, setPreviewTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [voiceNotePreview, setVoiceNotePreview] = useState<{ file: File; duration: number; blobUrl: string } | null>(null);
  const [filePreviewModal, setFilePreviewModal] = useState<{ isOpen: boolean; attachment: any | null; blobUrl: string | null }>({ isOpen: false, attachment: null, blobUrl: null });
  const imageBlobUrls = useRef<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingDurationRef = useRef<number>(0);

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

  // Refs pour le scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledRef = useRef(false);

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

  // Auto-scroll uniquement sur nouveau message
  useEffect(() => {
    const messageCount = selectedChat?.type === 'conversation' 
      ? conversation?.messages.length || 0 
      : group?.messages.length || 0;
    
    if (messageCount > lastMessageCount && !isUserScrolledRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 50);
      setLastMessageCount(messageCount);
    }
  }, [conversation?.messages.length, group?.messages.length, lastMessageCount, selectedChat]);

  // Composant Message mémorisé pour éviter les re-renders
  const MessageItem = React.memo<{ msg: any }>(({ msg }) => (
    <div className="message" style={{ willChange: 'auto' }}>
      <div className="message-sender" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <StatusIndicator status={msg.senderStatus} />
        <span>{msg.senderNomComplet || msg.senderUsername}</span>
      </div>
      
      {/* Afficher les pièces jointes */}
      {msg.attachments && msg.attachments.length > 0 ? (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {msg.attachments.map((attachment: any) => (
            <div key={attachment.id}>
              {attachment.isVoiceNote ? (
                <VoiceNoteCard 
                  attachment={attachment}
                  onDelete={() => handleDeleteAttachment(attachment.id)}
                />
              ) : attachment.fileType === 'Image' ? (
                <ImageWithAuth 
                  attachmentId={attachment.id}
                  fileName={attachment.fileName}
                  onImageClick={() => openFilePreview(attachment)}
                  onDownload={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                  onDelete={() => handleDeleteAttachment(attachment.id)}
                  getFileIcon={getFileIcon}
                  mimeType={attachment.mimeType}
                />
              ) : (
                <DocumentCard
                  attachment={attachment}
                  onPreview={() => openFilePreview(attachment)}
                  onDownload={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                  onDelete={() => handleDeleteAttachment(attachment.id)}
                  getFileIcon={getFileIcon}
                />
              )}
            </div>
          ))}
        </div>
      ) : msg.content ? (
        <div className="message-content">{msg.content}</div>
      ) : null}
      
      <div className="message-time">
        {new Date(msg.sentAt).toLocaleTimeString('fr-FR')}
      </div>
    </div>
  ), (prevProps, nextProps) => {
    // Ne re-render que si le message a réellement changé
    return prevProps.msg.id === nextProps.msg.id && 
           prevProps.msg.attachments?.length === nextProps.msg.attachments?.length &&
           prevProps.msg.content === nextProps.msg.content;
  });

  // Composant ConversationItem mémorisé
  const ConversationItem = React.memo<{ 
    conv: any; 
    isSelected: boolean;
    onSelect: () => void;
  }>(({ conv, isSelected, onSelect }) => (
    <div
      className={`chat-item ${isSelected ? 'active' : ''}`}
      onClick={onSelect}
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
  ), (prevProps, nextProps) => {
    return prevProps.conv.id === nextProps.conv.id &&
           prevProps.conv.unreadCount === nextProps.conv.unreadCount &&
           prevProps.conv.lastMessageAt === nextProps.conv.lastMessageAt &&
           prevProps.isSelected === nextProps.isSelected;
  });

  // Composant GroupItem mémorisé
  const GroupItem = React.memo<{ 
    grp: any; 
    isSelected: boolean;
    onSelect: () => void;
  }>(({ grp, isSelected, onSelect }) => (
    <div
      className={`chat-item ${isSelected ? 'active' : ''}`}
      onClick={onSelect}
    >
      <div className="chat-item-header">
        <span className="chat-name">{grp.name}</span>
        {grp.unreadCount > 0 ? (
          <span className="unread-count">{grp.unreadCount}</span>
        ) : (
          <span className="member-badge">{grp.memberCount}</span>
        )}
      </div>
      <div className="chat-item-date">
        {grp.lastMessageAt ? new Date(grp.lastMessageAt).toLocaleDateString('fr-FR') : new Date(grp.createdAt).toLocaleDateString('fr-FR')}
      </div>
    </div>
  ), (prevProps, nextProps) => {
    return prevProps.grp.id === nextProps.grp.id &&
           prevProps.grp.unreadCount === nextProps.grp.unreadCount &&
           prevProps.grp.lastMessageAt === nextProps.grp.lastMessageAt &&
           prevProps.grp.memberCount === nextProps.grp.memberCount &&
           prevProps.isSelected === nextProps.isSelected;
  });

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

  const getOtherUserName = useCallback((conv: ChatConversationDto): string => {
    // Utilise le nom complet si disponible, sinon le username
    const userStr = localStorage.getItem('user');
    if (!userStr) return conv.user1NomComplet || conv.user1Username;
    
    const user = JSON.parse(userStr);
    const currentUserId = user.id;
    
    if (conv.user1Id === currentUserId) {
      return conv.user2NomComplet || conv.user2Username;
    }
    return conv.user1NomComplet || conv.user1Username;
  }, []);

  const getOtherUserStatus = useCallback((conv: ChatConversationDto): UserStatus | undefined => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return undefined;
    
    const user = JSON.parse(userStr);
    const currentUserId = user.id;
    
    if (conv.user1Id === currentUserId) {
      return conv.user2Status;
    }
    return conv.user1Status;
  }, []);

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
          
          // Créer une URL de preview
          const blobUrl = URL.createObjectURL(audioBlob);
          
          // Afficher le preview au lieu d'envoyer directement
          setVoiceNotePreview({
            file: audioFile,
            duration: durationSeconds,
            blobUrl: blobUrl
          });
          
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
  
  // Filtrer les conversations selon la recherche (mémorisé pour éviter recalcul)
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      if (!searchQuery) return true;
      const otherUserName = getOtherUserName(conv).toLowerCase();
      return otherUserName.includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery]);
  
  const filteredGroups = useMemo(() => {
    return groups.filter(grp => {
      if (!searchQuery) return true;
      return grp.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [groups, searchQuery]);

  // Démarrer l'enregistrement
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Essayer webm sans codec spécifique pour compatibilité backend
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Fallback sur ogg si webm non supporté
        mimeType = 'audio/ogg';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        
        // Utiliser la ref pour avoir la durée correcte
        setAudioBlob(audioBlob);
        setBlobUrl(url);
        setDuration(recordingDurationRef.current);
        setIsPreviewing(true);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingDurationRef.current = 0;

      // Timer
      recordingIntervalRef.current = window.setInterval(() => {
        recordingDurationRef.current += 1;
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erreur accès microphone:', error);
      alert('Impossible d\'accéder au microphone');
    }
  };

  // Arrêter l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  // Lecture/Pause du preview
  const togglePlayPause = () => {
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(blobUrl);
      previewAudioRef.current.ontimeupdate = () => {
        setPreviewTime(Math.floor(previewAudioRef.current!.currentTime));
      };
      previewAudioRef.current.onended = () => {
        setIsPlaying(false);
        setPreviewTime(0);
      };
    }

    if (isPlaying) {
      previewAudioRef.current.pause();
      setIsPlaying(false);
    } else {
      previewAudioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Envoyer la note vocale inline
  const sendVoiceNote = async () => {
    if (!audioBlob || !selectedChat) return;

    try {
      console.log('Envoi note vocale:', {
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        duration: duration,
        chatId: selectedChat.id,
        chatType: selectedChat.type
      });

      // Créer le fichier avec le même MIME type que le blob
      const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { 
        type: audioBlob.type // Utiliser le type du blob (audio/webm ou audio/ogg)
      });
      
      console.log('File créé:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      if (selectedChat.type === 'conversation') {
        await chatAttachmentApi.uploadAttachment(selectedChat.id, file, true, duration);
        await refetchConversation();
      } else {
        await chatAttachmentApi.uploadGroupAttachment(selectedChat.id, file, true, duration);
        await refetchGroup();
      }

      console.log('Upload réussi!');
      cancelVoiceNote();
    } catch (error: any) {
      console.error('Erreur upload complète:', error);
      console.error('Response:', error.response);
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.title
        || error.message 
        || 'Erreur lors de l\'envoi de la note vocale';
      
      alert(`Erreur upload: ${errorMessage}`);
    }
  };

  // Annuler l'enregistrement/preview
  const cancelVoiceNote = () => {
    if (isRecording) {
      stopRecording();
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
    setIsRecording(false);
    setIsPreviewing(false);
    setIsPlaying(false);
    setRecordingTime(0);
    setPreviewTime(0);
    setDuration(0);
    setAudioBlob(null);
    setBlobUrl('');
  };

  // Télécharger une pièce jointe
  const handleDownloadAttachment = useCallback(async (attachmentId: string, fileName: string) => {
    try {
      const blob = await chatAttachmentApi.downloadAttachment(attachmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  }, []);

  // Obtenir l'icône selon l'extension du fichier
  const getFileIcon = useCallback((fileName: string, mimeType: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')) return '🖼️';
    
    // Documents PDF
    if (ext === 'pdf') return '📕';
    
    // Word
    if (['doc', 'docx'].includes(ext || '')) return '📘';
    
    // Excel
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return '📊';
    
    // PowerPoint
    if (['ppt', 'pptx'].includes(ext || '')) return '📙';
    
    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return '🗜️';
    
    // Code
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'html', 'css'].includes(ext || '')) return '💻';
    
    // Audio
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext || '') || mimeType.startsWith('audio/')) return '🎵';
    
    // Vidéo
    if (['mp4', 'avi', 'mkv', 'mov', 'webm'].includes(ext || '') || mimeType.startsWith('video/')) return '🎬';
    
    // Texte
    if (['txt', 'md', 'log'].includes(ext || '')) return '📝';
    
    // Par défaut
    return '📎';
  }, []);

  // Charger l'image en blob pour l'affichage avec authentification
  const loadImageBlob = async (attachmentId: string) => {
    if (imageBlobUrls.current[attachmentId]) return imageBlobUrls.current[attachmentId];
    
    try {
      const blob = await chatAttachmentApi.downloadAttachment(attachmentId);
      const url = URL.createObjectURL(blob);
      imageBlobUrls.current[attachmentId] = url;
      return url;
    } catch (error) {
      console.error('Erreur chargement image:', error);
      return '';
    }
  };

  // Ouvrir la modal de prévisualisation
  const openFilePreview = useCallback(async (attachment: any) => {
    try {
      // Télécharger le fichier en blob pour l'afficher
      const blob = await chatAttachmentApi.downloadAttachment(attachment.id);
      const blobUrl = URL.createObjectURL(blob);
      setFilePreviewModal({ isOpen: true, attachment, blobUrl });
    } catch (error) {
      console.error('Erreur chargement fichier:', error);
      alert('Impossible de charger le fichier');
    }
  }, []);

  // Fermer la modal de prévisualisation
  const closeFilePreview = useCallback(() => {
    if (filePreviewModal.blobUrl) {
      URL.revokeObjectURL(filePreviewModal.blobUrl);
    }
    setFilePreviewModal({ isOpen: false, attachment: null, blobUrl: null });
  }, [filePreviewModal.blobUrl]);

  // Supprimer une pièce jointe
  const handleDeleteAttachment = useCallback(async (attachmentId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette pièce jointe ?')) return;

    try {
      await chatAttachmentApi.deleteAttachment(attachmentId);
      
      // Rafraîchir les messages
      if (selectedChat?.type === 'conversation') {
        await refetchConversation();
      } else if (selectedChat?.type === 'group') {
        await refetchGroup();
      }

      // Fermer la modal si elle est ouverte
      if (filePreviewModal.isOpen && filePreviewModal.attachment?.id === attachmentId) {
        closeFilePreview();
      }

      alert('Pièce jointe supprimée avec succès');
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  }, [selectedChat, refetchConversation, refetchGroup, filePreviewModal.isOpen, filePreviewModal.attachment, closeFilePreview]);

  // Envoyer la note vocale après validation (ancien système popup)
  const handleSendVoiceNote = async () => {
    if (!voiceNotePreview || !selectedChat) return;

    try {
      if (selectedChat.type === 'conversation') {
        await chatAttachmentApi.uploadAttachment(
          selectedChat.id, 
          voiceNotePreview.file, 
          true, 
          voiceNotePreview.duration
        );
        await refetchConversation();
      } else {
        await chatAttachmentApi.uploadGroupAttachment(
          selectedChat.id, 
          voiceNotePreview.file, 
          true, 
          voiceNotePreview.duration
        );
        await refetchGroup();
      }
      
      // Nettoyer le preview
      URL.revokeObjectURL(voiceNotePreview.blobUrl);
      setVoiceNotePreview(null);
    } catch (error: any) {
      console.error('Erreur upload note vocale:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'envoi de la note vocale');
    }
  };

  // Supprimer le preview
  const handleCancelVoiceNote = () => {
    if (voiceNotePreview) {
      URL.revokeObjectURL(voiceNotePreview.blobUrl);
      setVoiceNotePreview(null);
    }
  };

  return (
    <div className="unified-chat-panel">
      {/* Bouton toggle */}
      <button
        className="unified-chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Ouvrir/Fermer le chat"
      >
        💬
        <UnreadBadge />
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
                      <ConversationItem
                        key={conv.id}
                        conv={conv}
                        isSelected={selectedChat?.id === conv.id && selectedChat?.type === 'conversation'}
                        onSelect={() => setSelectedChat({ type: 'conversation', id: conv.id })}
                      />
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
                      <GroupItem
                        key={grp.id}
                        grp={grp}
                        isSelected={selectedChat?.id === grp.id && selectedChat?.type === 'group'}
                        onSelect={() => setSelectedChat({ type: 'group', id: grp.id })}
                      />
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
                        <MessageItem key={msg.id} msg={msg} />
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Preview de la note vocale avant envoi */}
                {voiceNotePreview && (
                  <div style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ 
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🎤 Prévisualisation de votre note vocale
                    </div>
                    
                    {/* Player audio pour le preview */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '12px',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <audio 
                        controls 
                        src={voiceNotePreview.blobUrl}
                        style={{
                          width: '100%',
                          height: '40px',
                          borderRadius: '8px'
                        }}
                      />
                    </div>

                    {/* Boutons d'action */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={handleCancelVoiceNote}
                        style={{
                          padding: '10px 20px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(220, 38, 38, 0.9)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                        }}
                      >
                        🗑️ Supprimer
                      </button>
                      
                      <button
                        onClick={handleSendVoiceNote}
                        style={{
                          padding: '10px 20px',
                          background: 'rgba(16, 185, 129, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(5, 150, 105, 0.9)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.9)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                        }}
                      >
                        ✅ Envoyer
                      </button>
                    </div>
                  </div>
                )}

                <div className="message-input-area" style={{
                  background: (isRecording || isPreviewing) 
                    ? 'linear-gradient(135deg, #6264a7 0%, #464775 100%)'
                    : '#f9fafb',
                  transition: 'all 0.3s ease',
                  padding: (isRecording || isPreviewing) ? '8px 12px' : '12px',
                  minHeight: (isRecording || isPreviewing) ? '50px' : 'auto'
                }}>
                  {(isRecording || isPreviewing) ? (
                    /* Mode Enregistrement / Preview - Style Teams compact */
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      width: '100%'
                    }}>
                      {/* Bouton Annuler compact */}
                      <button
                        onClick={cancelVoiceNote}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '18px',
                          padding: '4px',
                          opacity: 0.9,
                          transition: 'opacity 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
                        title="Annuler"
                      >
                        ✕
                      </button>

                      {/* Icône Micro/Play compact */}
                      {isRecording ? (
                        <div style={{
                          background: '#e53935',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                        }}>
                          <span style={{ fontSize: '14px' }}>🎤</span>
                        </div>
                      ) : (
                        <button
                          onClick={togglePlayPause}
                          style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '12px',
                            transition: 'all 0.2s ease',
                            color: '#fff'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                          title={isPlaying ? 'Pause' : 'Lire'}
                        >
                          {isPlaying ? '⏸' : '▶'}
                        </button>
                      )}

                      {/* Waveform Animation compacte */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        flex: 1,
                        height: '24px'
                      }}>
                        {[...Array(18)].map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: '2px',
                              background: 'rgba(255, 255, 255, 0.7)',
                              borderRadius: '1px',
                              height: `${8 + Math.random() * 12}px`,
                              animation: isRecording 
                                ? `wave 1s ease-in-out infinite ${i * 0.05}s`
                                : 'none',
                              transition: 'height 0.2s ease'
                            }}
                          />
                        ))}
                      </div>

                      {/* Timer compact */}
                      <div style={{
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: '500',
                        fontFamily: 'monospace',
                        minWidth: '42px',
                        textAlign: 'center',
                        opacity: 0.95
                      }}>
                        {isRecording 
                          ? `${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`
                          : `${Math.floor(previewTime / 60)}:${(previewTime % 60).toString().padStart(2, '0')}`
                        }
                      </div>

                      {/* Bouton Stop (enregistrement) ou Send (preview) - compact */}
                      {isRecording ? (
                        <button
                          onClick={stopRecording}
                          style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                            color: '#fff'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                          title="Arrêter"
                        >
                          ⏹
                        </button>
                      ) : (
                        <button
                          onClick={sendVoiceNote}
                          style={{
                            background: '#10b981',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            color: '#fff'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                          title="Envoyer"
                        >
                          Envoyer
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Mode Normal - Input classique */
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
                        onClick={startRecording}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: '22px',
                          cursor: 'pointer',
                          padding: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title="Enregistrer une note vocale"
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
                                fontSize: '24px',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '8px',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f3f4f6';
                                e.currentTarget.style.transform = 'scale(1.2)';
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
                  )}
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

      {/* Modal de prévisualisation des fichiers */}
      {filePreviewModal.isOpen && filePreviewModal.attachment && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={closeFilePreview}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#fff',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
                minWidth: 0
              }}>
                <span style={{ fontSize: '24px' }}>
                  {getFileIcon(filePreviewModal.attachment.fileName, filePreviewModal.attachment.mimeType)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {filePreviewModal.attachment.fileName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {(filePreviewModal.attachment.fileSize / 1024).toFixed(0)} KB
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleDownloadAttachment(filePreviewModal.attachment.id, filePreviewModal.attachment.fileName)}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Télécharger
                </button>
                <button
                  onClick={() => handleDeleteAttachment(filePreviewModal.attachment.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  Supprimer
                </button>
                <button
                  onClick={closeFilePreview}
                  style={{
                    padding: '8px 12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{
              maxWidth: '90vw',
              maxHeight: 'calc(90vh - 80px)',
              overflow: 'auto',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {filePreviewModal.attachment.fileType === 'Image' ? (
                <img
                  src={filePreviewModal.blobUrl || ''}
                  alt={filePreviewModal.attachment.fileName}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(90vh - 80px)',
                    width: 'auto',
                    height: 'auto',
                    display: 'block'
                  }}
                />
              ) : filePreviewModal.attachment.mimeType === 'application/pdf' ? (
                <iframe
                  src={filePreviewModal.blobUrl || ''}
                  style={{
                    width: '90vw',
                    height: 'calc(90vh - 80px)',
                    border: 'none'
                  }}
                  title={filePreviewModal.attachment.fileName}
                />
              ) : filePreviewModal.attachment.fileType === 'Video' ? (
                <video
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(90vh - 80px)'
                  }}
                >
                  <source src={filePreviewModal.blobUrl || ''} type={filePreviewModal.attachment.mimeType} />
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
              ) : filePreviewModal.attachment.fileType === 'Audio' ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎵</div>
                  <audio
                    controls
                    style={{ width: '100%', maxWidth: '500px' }}
                  >
                    <source src={filePreviewModal.blobUrl || ''} type={filePreviewModal.attachment.mimeType} />
                  </audio>
                </div>
              ) : (
                <div style={{
                  padding: '60px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                    {getFileIcon(filePreviewModal.attachment.fileName, filePreviewModal.attachment.mimeType)}
                  </div>
                  <p style={{ fontSize: '16px', marginBottom: '20px' }}>
                    Aperçu non disponible pour ce type de fichier
                  </p>
                  <button
                    onClick={() => handleDownloadAttachment(filePreviewModal.attachment.id, filePreviewModal.attachment.fileName)}
                    style={{
                      padding: '12px 24px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Télécharger le fichier
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
