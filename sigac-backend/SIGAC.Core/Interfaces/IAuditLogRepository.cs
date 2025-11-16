namespace SIGAC.Core.Interfaces;

using SIGAC.Core.Entities;

public interface IAuditLogRepository
{
    Task<AuditLog?> GetByIdAsync(Guid id);
    Task<List<AuditLog>> GetByUserIdAsync(Guid userId);
    Task AddAsync(AuditLog auditLog);
    Task SaveChangesAsync();
    
    Task LogActionAsync(
        Guid? userId,
        string action,
        string entityType,
        string? entityId,
        string? oldValues,
        string? newValues,
        string? ipAddress = null,
        string? userAgent = null
    );
}
