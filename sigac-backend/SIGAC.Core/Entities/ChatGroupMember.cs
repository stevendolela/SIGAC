namespace SIGAC.Core.Entities;

/// <summary>
/// Représente un membre d'un groupe de chat
/// </summary>
public class ChatGroupMember
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// ID du groupe
    /// </summary>
    public Guid ChatGroupId { get; set; }
    public ChatGroup? ChatGroup { get; set; }
    
    /// <summary>
    /// ID de l'utilisateur membre du groupe
    /// </summary>
    public Guid UserId { get; set; }
    public User? User { get; set; }
    
    /// <summary>
    /// Date d'ajout du membre au groupe
    /// </summary>
    public DateTime JoinedAt { get; set; }
    
    /// <summary>
    /// Indique si le membre a des permissions d'administrateur
    /// </summary>
    public bool IsAdmin { get; set; }
}
