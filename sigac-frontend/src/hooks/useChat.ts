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
      const dataArray = Array.isArray(data) ? data : [];
      
      // Ne mettre à jour que si les données ont vraiment changé
      setConversations(prev => {
        if (prev.length !== dataArray.length) return dataArray;
        
        // Comparer les IDs et lastMessageTime pour détecter les vrais changements
        const hasChanged = dataArray.some((conv, idx) => {
          const prevConv = prev[idx];
          return !prevConv || 
                 prevConv.id !== conv.id || 
                 prevConv.lastMessageTime !== conv.lastMessageTime ||
                 prevConv.unreadCount !== conv.unreadCount;
        });
        
        return hasChanged ? dataArray : prev;
      });
      
      setError(null);
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (err: any) {
      // Si 404, l'endpoint n'existe pas encore (déploiement en cours)
      if (err.response?.status === 404) {
        setConversations([]);
        setError(null);
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      } else {
        setError(err.message || 'Erreur lors du chargement des conversations');
        setConversations([]); // Tableau vide en cas d'erreur
        if (err.response?.status === 401) {
          window.location.href = '/login';
        }
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
  }, []);

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
      
      // Comparer avec les données existantes pour éviter re-render inutile
      setConversation(prev => {
        if (!prev) return data;
        if (!data) return prev;
        
        // Comparer uniquement le nombre de messages et l'ID du dernier
        const prevMessages = prev.messages || [];
        const newMessages = data.messages || [];
        
        if (prevMessages.length !== newMessages.length) return data;
        if (prevMessages.length === 0) return prev;
        
        const lastPrevMsg = prevMessages[prevMessages.length - 1];
        const lastNewMsg = newMessages[newMessages.length - 1];
        
        // Si l'ID du dernier message est différent, il y a un nouveau message
        if (lastPrevMsg?.id !== lastNewMsg?.id) return data;
        
        return prev;
      });
      
      setError(null);
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
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
    if (!conversationId) return;
    
    // Reset lors du changement de conversation
    setIsInitialLoad(true);
    
    // Charger la conversation immédiatement
    fetchConversation();
    
    // Rafraîchir les messages toutes les 2 secondes en temps réel
    const interval = setInterval(fetchConversation, 2000);
    return () => clearInterval(interval);
  }, [conversationId]);

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
  }, []);

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
      const dataArray = Array.isArray(data) ? data : [];
      
      // Ne mettre à jour que si les données ont vraiment changé
      setGroups(prev => {
        if (prev.length !== dataArray.length) return dataArray;
        
        // Comparer les IDs et lastMessageTime
        const hasChanged = dataArray.some((grp, idx) => {
          const prevGrp = prev[idx];
          return !prevGrp || 
                 prevGrp.id !== grp.id || 
                 prevGrp.lastMessageTime !== grp.lastMessageTime ||
                 prevGrp.unreadCount !== grp.unreadCount;
        });
        
        return hasChanged ? dataArray : prev;
      });
      
      setError(null);
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (err: any) {
      // Si 404, l'endpoint n'existe pas encore (déploiement en cours)
      // Ne pas afficher d'erreur, juste retourner tableau vide silencieusement
      if (err.response?.status === 404) {
        setGroups([]);
        setError(null); // Pas d'erreur visible pour l'utilisateur
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      } else {
        setError(err.message || 'Erreur lors du chargement des groupes');
        setGroups([]); // Tableau vide en cas d'erreur
        if (err.response?.status === 401) {
          window.location.href = '/login';
        }
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
  }, []);

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
      
      // Comparer avec les données existantes pour éviter re-render inutile
      setGroup(prev => {
        if (!prev) return data;
        if (!data) return prev;
        
        // Comparer uniquement le nombre de messages et l'ID du dernier
        const prevMessages = prev.messages || [];
        const newMessages = data.messages || [];
        
        if (prevMessages.length !== newMessages.length) return data;
        if (prevMessages.length === 0) return prev;
        
        const lastPrevMsg = prevMessages[prevMessages.length - 1];
        const lastNewMsg = newMessages[newMessages.length - 1];
        
        // Si l'ID du dernier message est différent, il y a un nouveau message
        if (lastPrevMsg?.id !== lastNewMsg?.id) return data;
        
        return prev;
      });
      
      setError(null);
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
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
    if (!groupId) return;
    
    // Reset lors du changement de groupe
    setIsInitialLoad(true);
    
    fetchGroup();
    
    // Rafraîchir les messages du groupe toutes les 2 secondes
    const interval = setInterval(fetchGroup, 2000);
    return () => clearInterval(interval);
  }, [groupId]);

  return { group, loading, error, refetch: fetchGroup };
}
