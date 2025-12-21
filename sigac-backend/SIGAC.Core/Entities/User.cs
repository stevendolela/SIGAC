namespace SIGAC.Core.Entities;

using SIGAC.Core.Enums;

public class User
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? NomComplet { get; set; }
    public UserRole Role { get; set; }
    public string? Matricule { get; set; }
    
    /// <summary>
    /// Statut de disponibilité (Disponible, Occupé, Absent, etc.)
    /// </summary>
    public UserStatus Status { get; set; } = UserStatus.Disponible;
    
    [Obsolete("Use AvatarBase64 instead for better cross-browser compatibility")]
    public string? AvatarUrl { get; set; }
    
    /// <summary>
    /// Avatar encodé en base64 avec data URI (ex: "data:image/png;base64,iVBORw0KG...")
    /// </summary>
    public string? AvatarBase64 { get; set; }
    
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Authentification
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryDate { get; set; }
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiry { get; set; }
    public DateTime? LastPasswordChange { get; set; }
    public DateTime? LastLogin { get; set; }
    
    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedAt { get; set; }
    
    // Relations
    public ICollection<Dossier> DossiersRapporteur { get; set; } = new List<Dossier>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    
    // Workspace relations (nouveau - modèle GED)
    public ICollection<WorkspaceUser> WorkspaceMemberships { get; set; } = new List<WorkspaceUser>();
    public ICollection<Workspace> OwnedWorkspaces { get; set; } = new List<Workspace>();
}
