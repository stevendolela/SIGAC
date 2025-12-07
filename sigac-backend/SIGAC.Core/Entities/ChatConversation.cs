namespace SIGAC.Core.Entities;

/// <summary>
/// Représente une conversation 1-to-1 entre deux utilisateurs
/// </summary>
public class ChatConversation
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Premier utilisateur de la conversation
    /// </summary>
    public Guid User1Id { get; set; }
    public User? User1 { get; set; }
    
    /// <summary>
    /// Deuxième utilisateur de la conversation
    /// </summary>
    public Guid User2Id { get; set; }
    public User? User2 { get; set; }
    
    /// <summary>
    /// Date de création de la conversation
    /// </summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// Date du dernier message de la conversation
    /// </summary>
    public DateTime? LastMessageAt { get; set; }
    
    /// <summary>
    /// Collection des messages de cette conversation
    /// </summary>
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
