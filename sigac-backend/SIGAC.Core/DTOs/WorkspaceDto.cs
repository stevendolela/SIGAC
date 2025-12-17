using SIGAC.Core.Enums;

namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour afficher un workspace
/// </summary>
public class WorkspaceDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    
    public int MaxStorageGB { get; set; }
    public int MaxUsers { get; set; }
    public bool AllowGuestAccess { get; set; }
    public bool IsActive { get; set; }
    
    public Guid OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    
    /// <summary>
    /// Nombre de membres actifs dans ce workspace
    /// </summary>
    public int CurrentMemberCount { get; set; }
    
    /// <summary>
    /// Nombre de projets (dossiers) dans ce workspace
    /// </summary>
    public int CurrentProjectCount { get; set; }
    
    /// <summary>
    /// Rôle de l'utilisateur connecté dans ce workspace
    /// </summary>
    public WorkspaceRole UserRole { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
}

/// <summary>
/// DTO pour créer un nouveau workspace
/// </summary>
public class CreateWorkspaceDto
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(200, MinimumLength = 3)]
    public string Name { get; set; } = string.Empty;
    
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(100, MinimumLength = 3)]
    [System.ComponentModel.DataAnnotations.RegularExpression(@"^[a-z0-9-]+$", 
        ErrorMessage = "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets")]
    public string Slug { get; set; } = string.Empty;
    
    [System.ComponentModel.DataAnnotations.StringLength(1000)]
    public string? Description { get; set; }
    
    public int MaxStorageGB { get; set; } = 100;
    public int MaxUsers { get; set; } = 50;
    public bool AllowGuestAccess { get; set; } = false;
}

/// <summary>
/// DTO pour mettre à jour un workspace
/// </summary>
public class UpdateWorkspaceDto
{
    [System.ComponentModel.DataAnnotations.StringLength(200, MinimumLength = 3)]
    public string? Name { get; set; }
    
    [System.ComponentModel.DataAnnotations.StringLength(1000)]
    public string? Description { get; set; }
    
    [System.ComponentModel.DataAnnotations.Url]
    public string? LogoUrl { get; set; }
    
    [System.ComponentModel.DataAnnotations.Range(1, 1000)]
    public int? MaxStorageGB { get; set; }
    
    [System.ComponentModel.DataAnnotations.Range(1, 500)]
    public int? MaxUsers { get; set; }
    
    public bool? AllowGuestAccess { get; set; }
    public bool? IsActive { get; set; }
}

/// <summary>
/// DTO pour un membre du workspace
/// </summary>
public class WorkspaceMemberDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string NomComplet { get; set; } = string.Empty;
    
    public WorkspaceRole Role { get; set; }
    public DateTime JoinedAt { get; set; }
    public bool IsActive { get; set; }
    
    public Guid? InvitedById { get; set; }
    public string? InvitedByName { get; set; }
}

/// <summary>
/// DTO pour ajouter un membre au workspace
/// </summary>
public class AddWorkspaceMemberDto
{
    [System.ComponentModel.DataAnnotations.Required]
    public Guid UserId { get; set; }
    
    [System.ComponentModel.DataAnnotations.Required]
    public WorkspaceRole Role { get; set; } = WorkspaceRole.Member;
}

/// <summary>
/// DTO pour mettre à jour le rôle d'un membre
/// </summary>
public class UpdateMemberRoleDto
{
    [System.ComponentModel.DataAnnotations.Required]
    public WorkspaceRole Role { get; set; }
}
