namespace SIGAC.Core.Entities;

/// <summary>
/// Représente un groupe de chat avec plusieurs participants
/// </summary>
public class ChatGroup
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Nom du groupe de chat
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Description optionnelle du groupe
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// ID de l'utilisateur qui a créé le groupe
    /// </summary>
    public Guid CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    
    /// <summary>
    /// Date de création du groupe
    /// </summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// Date du dernier message du groupe
    /// </summary>
    public DateTime? LastMessageAt { get; set; }
    
    /// <summary>
    /// Membres du groupe
    /// </summary>
    public ICollection<ChatGroupMember> Members { get; set; } = new List<ChatGroupMember>();
    
    /// <summary>
    /// Messages du groupe
    /// </summary>
    public ICollection<GroupMessage> Messages { get; set; } = new List<GroupMessage>();
}
