using SIGAC.Core.Enums;

namespace SIGAC.Core.Entities;

/// <summary>
/// Table de jonction: Workspace ↔ User
/// Représente l'assignation d'un utilisateur à un département (Workspace)
/// Un utilisateur peut être assigné à plusieurs Workspaces avec des rôles différents
/// ADAPTÉ: Ajout de TenantId pour isolation multi-tenant
/// </summary>
public class WorkspaceUser
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;
    
    /// <summary>
    /// Tenant ID pour isolation multi-tenant (ne pas naviguer avec HasOne(Tenant))
    /// car WorkspaceUser.PrimaryKey = (WorkspaceId, UserId)
    /// </summary>
    public Guid? TenantId { get; set; }
    
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    /// <summary>
    /// Rôle de l'utilisateur DANS CE WORKSPACE (Département)
    /// </summary>
    public WorkspaceRole Role { get; set; } = WorkspaceRole.Member;
    
    /// <summary>
    /// Date d'assignation au workspace
    /// </summary>
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Invité par (optionnel)
    /// </summary>
    public Guid? InvitedBy { get; set; }
    
    /// <summary>
    /// Membre actif ou désactivé dans ce workspace
    /// </summary>
    public bool IsActive { get; set; } = true;
}
