namespace SIGAC.Core.Entities;

/// <summary>
/// Représente un message dans une conversation de chat
/// </summary>
public class Message
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// ID de la conversation
    /// </summary>
    public Guid ConversationId { get; set; }
    public ChatConversation? Conversation { get; set; }
    
    /// <summary>
    /// ID de l'utilisateur qui a envoyé le message
    /// </summary>
    public Guid SenderId { get; set; }
    public User? Sender { get; set; }
    
    /// <summary>
    /// Contenu du message (max 5000 caractères)
    /// </summary>
    public string Content { get; set; } = string.Empty;
    
    /// <summary>
    /// Date/heure d'envoi du message
    /// </summary>
    public DateTime SentAt { get; set; }
    
    /// <summary>
    /// Indique si le message a été lu
    /// </summary>
    public bool IsRead { get; set; }
    
    /// <summary>
    /// Date/heure de lecture du message (si lu)
    /// </summary>
    public DateTime? ReadAt { get; set; }
}
