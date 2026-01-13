namespace SIGAC.Core.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? NomComplet { get; set; }
    public string Role { get; set; } = string.Empty;
    public string? Matricule { get; set; }
    
    [Obsolete("Use AvatarBase64 instead")]
    public string? AvatarUrl { get; set; }
    
    /// <summary>
    /// Avatar en base64 avec data URI
    /// </summary>
    public string? AvatarBase64 { get; set; }
    
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastLogin { get; set; }
    
    /// <summary>
    /// ID du workspace par défaut (premier workspace auquel l'utilisateur appartient)
    /// </summary>
    public Guid? DefaultWorkspaceId { get; set; }
}