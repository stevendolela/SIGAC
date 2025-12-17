import { useState, useEffect, useCallback } from 'react';
import { ChatConversationDto, ChatConversationDetailDto, MessageDto, ChatGroupDto, ChatGroupDetailDto } from '../types/chat';
import { chatApi } from '../api/chatApi';

export function useChatConversations() {
  const [conversations, setConversations] = useState<ChatConversationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      // Afficher le loading seulement au chargement initial
      if (isInitialLoad) {
        setLoading(true);
      }
      const data = await chatApi.getConversations();
      // S'assurer que data est un tableau
      setConversations(Array.isArray(data) ? data : []);
      setError(null);
      setIsInitialLoad(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des conversations');
      setConversations([]); // Tableau vide en cas d'erreur
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
      setLoading(false);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [isInitialLoad]);

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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      // Afficher le loading seulement au chargement initial
      if (isInitialLoad) {
        setLoading(true);
      }
      const data = await chatApi.getConversation(conversationId);
      setConversation(data);
      setError(null);
      setIsInitialLoad(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la conversation');
      setLoading(false);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [conversationId, isInitialLoad]);

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

export function useChatGroups() {
  const [groups, setGroups] = useState<ChatGroupDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchGroups = useCallback(async () => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const data = await chatApi.getGroups();
      // S'assurer que data est un tableau
      setGroups(Array.isArray(data) ? data : []);
      setError(null);
      setIsInitialLoad(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des groupes');
      setGroups([]); // Tableau vide en cas d'erreur
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
      setLoading(false);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [isInitialLoad]);

  useEffect(() => {
    fetchGroups();
    // Rafraîchir les groupes toutes les 3 secondes
    const interval = setInterval(fetchGroups, 3000);
    return () => clearInterval(interval);
  }, [fetchGroups]);

  return { groups, loading, error, refetch: fetchGroups };
}

export function useChatGroup(groupId: string | null) {
  const [group, setGroup] = useState<ChatGroupDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;

    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const data = await chatApi.getGroupDetail(groupId);
      setGroup(data);
      setError(null);
      setIsInitialLoad(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du groupe');
      setLoading(false);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [groupId, isInitialLoad]);

  useEffect(() => {
    fetchGroup();
    
    // Rafraîchir les messages du groupe toutes les 2 secondes
    const interval = setInterval(fetchGroup, 2000);
    return () => clearInterval(interval);
  }, [fetchGroup]);

  return { group, loading, error, refetch: fetchGroup };
}
