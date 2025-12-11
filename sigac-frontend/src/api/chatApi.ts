import axios, { AxiosInstance } from 'axios';
import { 
  MessageDto, 
  ChatConversationDto, 
  ChatConversationDetailDto, 
  CreateMessageDto, 
  CreateChatConversationDto,
  ChatGroupDto,
  ChatGroupDetailDto,
  CreateChatGroupDto,
  GroupMessageDto,
  CreateGroupMessageDto,
  AddGroupMemberDto
} from '../types/chat';

export class ChatApi {
  private baseUrl = import.meta.env.VITE_API_URL || 'https://sigac-api.onrender.com/api';
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
    });

    // Intercepteur pour ajouter le Bearer token
    this.axiosInstance.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Intercepteur pour gérer les erreurs 401
    this.axiosInstance.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          // Token expiré, rediriger vers login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Obtient toutes les conversations de l'utilisateur connecté
   */
  async getConversations(): Promise<ChatConversationDto[]> {
    const response = await this.axiosInstance.get('/chat/conversations');
    return response.data.data || [];
  }

  /**
   * Obtient une conversation spécifique avec tous ses messages
   */
  async getConversation(conversationId: string): Promise<ChatConversationDetailDto> {
    const response = await this.axiosInstance.get(`/chat/conversations/${conversationId}`);
    return response.data.data;
  }

  /**
   * Crée ou récupère une conversation 1-to-1 avec un utilisateur
   */
  async createOrGetConversation(recipientId: string): Promise<ChatConversationDto> {
    const dto: CreateChatConversationDto = { recipientId: recipientId as any };
    const response = await this.axiosInstance.post('/chat/conversations', dto);
    return response.data.data;
  }

  /**
   * Envoie un nouveau message dans une conversation
   */
  async sendMessage(conversationId: string, content: string): Promise<MessageDto> {
    const dto: CreateMessageDto = {
      conversationId: conversationId as any,
      content,
    };
    const response = await this.axiosInstance.post('/chat/messages', dto);
    return response.data.data;
  }

  /**
   * Obtient le nombre total de messages non lus
   */
  async getUnreadCount(): Promise<number> {
    const response = await this.axiosInstance.get('/chat/unread-count');
    return response.data.data || 0;
  }

  /**
   * Supprime une conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await this.axiosInstance.delete(`/chat/conversations/${conversationId}`);
  }

  /**
   * Crée un nouveau groupe de chat
   */
  async createGroup(dto: CreateChatGroupDto): Promise<ChatGroupDto> {
    const response = await this.axiosInstance.post('/chatgroups/create', dto);
    return response.data.data;
  }

  /**
   * Obtient tous les groupes de l'utilisateur connecté
   */
  async getGroups(): Promise<ChatGroupDto[]> {
    const response = await this.axiosInstance.get('/chatgroups/my-groups');
    return response.data.data || [];
  }

  /**
   * Obtient les détails d'un groupe avec tous ses messages et membres
   */
  async getGroupDetail(groupId: string): Promise<ChatGroupDetailDto> {
    const response = await this.axiosInstance.get(`/chatgroups/${groupId}`);
    return response.data.data;
  }

  /**
   * Envoie un message à un groupe
   */
  async sendGroupMessage(dto: CreateGroupMessageDto): Promise<GroupMessageDto> {
    const response = await this.axiosInstance.post('/chatgroups/messages', dto);
    return response.data.data;
  }

  /**
   * Ajoute un membre à un groupe
   */
  async addGroupMember(groupId: string, dto: AddGroupMemberDto): Promise<void> {
    await this.axiosInstance.post(`/chatgroups/${groupId}/members`, dto);
  }

  /**
   * Supprime un membre d'un groupe
   */
  async removeGroupMember(groupId: string, memberId: string): Promise<void> {
    await this.axiosInstance.delete(`/chatgroups/${groupId}/members/${memberId}`);
  }

  /**
   * Supprime un groupe
   */
  async deleteGroup(groupId: string): Promise<void> {
    await this.axiosInstance.delete(`/chatgroups/${groupId}`);
  }
}

export const chatApi = new ChatApi();
