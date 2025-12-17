using SIGAC.Core.Enums;

namespace SIGAC.Core.Entities;

/// <summary>
/// Table de jonction: Workspace ↔ User
/// Permet de gérer les rôles et permissions par workspace
/// </summary>
public class WorkspaceUser
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;
    
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    /// <summary>
    /// Rôle de l'utilisateur dans ce workspace
    /// </summary>
    public WorkspaceRole Role { get; set; } = WorkspaceRole.Member;
    
    /// <summary>
    /// Date d'ajout au workspace
    /// </summary>
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Invité par (optionnel)
    /// </summary>
    public Guid? InvitedBy { get; set; }
    
    /// <summary>
    /// Membre actif ou désactivé
    /// </summary>
    public bool IsActive { get; set; } = true;
}
