import { useState, useEffect, useCallback } from 'react';
import { ChatConversationDto, ChatConversationDetailDto, MessageDto } from '../types/chat';
import { chatApi } from '../api/chatApi';

export function useChatConversations() {
  const [conversations, setConversations] = useState<ChatConversationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await chatApi.getConversations();
      setConversations(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des conversations');
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    // Rafraîchir les conversations toutes les 3 secondes en temps réel
    const interval = setInterval(fetchConversations, 3000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  return { conversations, loading, error, refetch: fetchConversations };
}

export function useChatConversation(conversationId: string | null) {
  const [conversation, setConversation] = useState<ChatConversationDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const data = await chatApi.getConversation(conversationId);
      setConversation(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la conversation');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    // Charger la conversation immédiatement
    fetchConversation();
    
    // Rafraîchir les messages toutes les 2 secondes en temps réel
    const interval = setInterval(fetchConversation, 2000);
    return () => clearInterval(interval);
  }, [fetchConversation]);

  return { conversation, loading, error, refetch: fetchConversation };
}

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await chatApi.getUnreadCount();
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Erreur lors de la récupération du nombre de messages non lus:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    // Rafraîchir le nombre de messages non lus toutes les 5 secondes
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return { unreadCount, refetch: fetchUnreadCount };
}
