namespace SIGAC.Core.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// TenantId pour isolation multi-tenant (propriété scalaire seulement, pas de FK navigation)
    /// </summary>
    public Guid TenantId { get; set; }
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    
    public string IpAddress { get; set; } = string.Empty;
    public string? UserAgent { get; set; }
}