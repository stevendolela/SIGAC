/**
 * Types TypeScript pour les DTOs du système de chat
 * Doit correspondre exactement aux DTOs C# du backend
 */

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername?: string;
  content: string;
  sentAt: string; // ISO DateTime
  isRead: boolean;
  readAt?: string; // ISO DateTime
}

export interface CreateMessageDto {
  conversationId: string;
  content: string;
}

export interface ChatConversationDto {
  id: string;
  user1Id: string;
  user1Username?: string;
  user2Id: string;
  user2Username?: string;
  createdAt: string; // ISO DateTime
  lastMessageAt?: string; // ISO DateTime
  unreadCount: number;
}

export interface ChatConversationDetailDto {
  id: string;
  user1Id: string;
  user1Username?: string;
  user2Id: string;
  user2Username?: string;
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
  content: string;
  sentAt: string; // ISO DateTime
}

export interface CreateGroupMessageDto {
  chatGroupId: string;
  content: string;
}

export interface ChatGroupMemberDto {
  id: string;
  userId: string;
  username?: string;
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

