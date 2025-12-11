namespace SIGAC.Core.Entities;

/// <summary>
/// Représente un message dans un groupe de chat
/// </summary>
public class GroupMessage
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// ID du groupe
    /// </summary>
    public Guid ChatGroupId { get; set; }
    public ChatGroup? ChatGroup { get; set; }
    
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
}
