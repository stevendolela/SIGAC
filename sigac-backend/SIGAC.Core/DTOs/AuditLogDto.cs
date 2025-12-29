namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour les logs d'audit
/// </summary>
public class AuditLogDto
{
    public Guid Id { get; set; }
    public DateTime Timestamp { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string? UserAgent { get; set; }
}
