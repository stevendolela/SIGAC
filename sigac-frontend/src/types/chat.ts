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
