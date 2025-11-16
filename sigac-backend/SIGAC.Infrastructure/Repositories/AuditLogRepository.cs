using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace SIGAC.Infrastructure.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly ApplicationDbContext _context;

    public AuditLogRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AuditLog?> GetByIdAsync(Guid id)
    {
        return await _context.AuditLogs.FindAsync(id);
    }

    public async Task<List<AuditLog>> GetByUserIdAsync(Guid userId)
    {
        return await _context.AuditLogs
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();
    }

    public async Task AddAsync(AuditLog auditLog)
    {
        _context.AuditLogs.Add(auditLog);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task LogActionAsync(
        Guid? userId,
        string action,
        string entityType,
        string? entityId,
        string? oldValues = null,
        string? newValues = null,
        string? ipAddress = null,
        string? userAgent = null)
    {
        // Certains schémas PostgreSQL utilisent jsonb pour NewValues/OldValues.
        // Pour éviter les erreurs de cast (text -> jsonb), on exécute un INSERT
        // via Npgsql en définissant explicitement le type JSONB quand nécessaire.
        try
        {
            var conn = (Npgsql.NpgsqlConnection)_context.Database.GetDbConnection();
            var wasClosed = conn.State == System.Data.ConnectionState.Closed;
            if (wasClosed) await conn.OpenAsync();

            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"INSERT INTO ""AuditLogs"" (""Id"", ""Timestamp"", ""UserId"", ""Action"", ""EntityType"", ""EntityId"", ""OldValues"", ""NewValues"", ""IpAddress"", ""UserAgent"")
                                VALUES (@id, @ts, @userId, @action, @entityType, @entityId, @oldValues::jsonb, @newValues::jsonb, @ipAddress, @userAgent);";

            var id = Guid.NewGuid();
            cmd.Parameters.AddWithValue("id", id);
            cmd.Parameters.AddWithValue("ts", DateTime.UtcNow);
            cmd.Parameters.AddWithValue("userId", userId.HasValue ? (object)userId.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("action", action);
            cmd.Parameters.AddWithValue("entityType", entityType);
            cmd.Parameters.AddWithValue("entityId", entityId ?? (object)DBNull.Value);

            // oldValues/newValues: if null -> pass NULL, otherwise pass the JSON string
            if (oldValues == null)
                cmd.Parameters.AddWithValue("oldValues", DBNull.Value);
            else
                cmd.Parameters.AddWithValue("oldValues", oldValues);

            if (newValues == null)
                cmd.Parameters.AddWithValue("newValues", DBNull.Value);
            else
                cmd.Parameters.AddWithValue("newValues", newValues);

            cmd.Parameters.AddWithValue("ipAddress", ipAddress ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("userAgent", userAgent ?? (object)DBNull.Value);

            await cmd.ExecuteNonQueryAsync();

            if (wasClosed) await conn.CloseAsync();
        }
        catch (Exception)
        {
            // En cas d'échec de l'insertion directe (ex: colonne text), fallback sur EF Core classique
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                OldValues = oldValues,
                NewValues = newValues,
                IpAddress = ipAddress ?? "unknown",
                UserAgent = userAgent ?? "unknown",
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }
    }
}
