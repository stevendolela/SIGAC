namespace SIGAC.Core.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// NOUVEAU: Tenant pour isolation et audit cross-tenant
    /// Permet de tracer les actions par Tenant (Client)
    /// </summary>
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;
    
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