namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour l'historique de connexion
/// </summary>
public class LoginHistoryDto
{
    public Guid Id { get; set; }
    public DateTime Timestamp { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public string? NomComplet { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string? UserAgent { get; set; }
    public string? Device { get; set; } // Extracted from UserAgent
    public string? Browser { get; set; } // Extracted from UserAgent
    public string? OS { get; set; } // Extracted from UserAgent
    public bool IsSuccessful { get; set; } = true;
}
