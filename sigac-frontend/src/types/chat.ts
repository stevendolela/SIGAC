/**
 * Types TypeScript pour les DTOs du système de chat
 * Doit correspondre exactement aux DTOs C# du backend
 */

export enum UserStatus {
  EnLigne = 0,
  Occupe = 1,
  Absent = 2
}

export interface ChatAttachmentDto {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileType: string;
  isVoiceNote: boolean;
  durationSeconds?: number;
  uploadedBy: string;
  uploaderUsername?: string;
  uploadedAt: string;
  downloadUrl: string;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername?: string;
  senderNomComplet?: string; // Nom complet de l'expéditeur
  senderStatus?: UserStatus; // Statut de disponibilité
  content: string;
  sentAt: string; // ISO DateTime
  isRead: boolean;
  readAt?: string; // ISO DateTime
  attachments: ChatAttachmentDto[];
}

export interface CreateMessageDto {
  conversationId: string;
  content: string;
}

export interface ChatConversationDto {
  id: string;
  user1Id: string;
  user1Username?: string;
  user1NomComplet?: string; // Nom complet user1
  user1Status?: UserStatus; // Statut user1
  user2Id: string;
  user2Username?: string;
  user2NomComplet?: string; // Nom complet user2
  user2Status?: UserStatus; // Statut user2
  createdAt: string; // ISO DateTime
  lastMessageAt?: string; // ISO DateTime
  unreadCount: number;
}

export interface ChatConversationDetailDto {
  id: string;
  user1Id: string;
  user1Username?: string;
  user1NomComplet?: string;
  user1Status?: UserStatus;
  user2Id: string;
  user2Username?: string;
  user2NomComplet?: string;
  user2Status?: UserStatus;
  createdAt: string; // ISO DateTime
  lastMessageAt?: string; // ISO DateTime
  messages: MessageDto[];
}

export interface CreateChatConversationDto {
  recipientId: string;
}

// Types pour les groupes de chat
export interface GroupMessageDto {
  id: string;
  chatGroupId: string;
  senderId: string;
  senderUsername?: string;
  senderNomComplet?: string; // Nom complet de l'expéditeur
  senderStatus?: UserStatus; // Statut de disponibilité
  content: string;
  sentAt: string; // ISO DateTime
  attachments: ChatAttachmentDto[];
}

export interface CreateGroupMessageDto {
  chatGroupId: string;
  content: string;
}

export interface ChatGroupMemberDto {
  id: string;
  userId: string;
  username?: string;
  nomComplet?: string; // Nom complet du membre
  status?: UserStatus; // Statut de disponibilité
  email?: string;
  joinedAt: string; // ISO DateTime
  isAdmin: boolean;
}

export interface ChatGroupDto {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdByUsername?: string;
  createdAt: string; // ISO DateTime
  lastMessageAt?: string; // ISO DateTime
  memberCount: number;
  messageCount: number;
}

export interface ChatGroupDetailDto {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdByUsername?: string;
  createdAt: string; // ISO DateTime
  lastMessageAt?: string; // ISO DateTime
  members: ChatGroupMemberDto[];
  messages: GroupMessageDto[];
}

export interface CreateChatGroupDto {
  name: string;
  description?: string;
  memberIds: string[];
}

export interface AddGroupMemberDto {
  userId: string;
}

