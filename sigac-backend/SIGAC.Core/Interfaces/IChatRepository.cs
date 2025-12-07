using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Repository pour l'accès aux données de chat
/// </summary>
public interface IChatRepository
{
    /// <summary>
    /// Obtient toutes les conversations d'un utilisateur
    /// </summary>
    Task<IEnumerable<ChatConversation>> GetUserConversationsAsync(Guid userId);
    
    /// <summary>
    /// Obtient une conversation par ID
    /// </summary>
    Task<ChatConversation?> GetConversationByIdAsync(Guid conversationId);
    
    /// <summary>
    /// Trouve une conversation existante entre deux utilisateurs
    /// </summary>
    Task<ChatConversation?> GetConversationBetweenUsersAsync(Guid user1Id, Guid user2Id);
    
    /// <summary>
    /// Ajoute une nouvelle conversation
    /// </summary>
    Task AddConversationAsync(ChatConversation conversation);
    
    /// <summary>
    /// Ajoute un nouveau message
    /// </summary>
    Task AddMessageAsync(Message message);
    
    /// <summary>
    /// Mises à jour un message existant
    /// </summary>
    Task UpdateMessageAsync(Message message);
    
    /// <summary>
    /// Supprime une conversation (supprime aussi tous les messages en cascade)
    /// </summary>
    Task DeleteConversationAsync(ChatConversation conversation);
    
    /// <summary>
    /// Sauvegarde les changements dans la base de données
    /// </summary>
    Task SaveChangesAsync();
}
