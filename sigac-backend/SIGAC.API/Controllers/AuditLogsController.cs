using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.Entities;
using SIGAC.Core.DTOs;
using SIGAC.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

/// <summary>
/// Contrôleur pour consulter les logs d'audit système.
/// Accessible uniquement aux administrateurs.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditLogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuditLogsController> _logger;

    public AuditLogsController(
        ApplicationDbContext context,
        ILogger<AuditLogsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Récupère les logs d'audit avec filtres optionnels.
    /// Réservé aux administrateurs uniquement.
    /// </summary>
    /// <param name="entityType">Type d'entité (ex: Document, Dossier, User). Peut être une liste séparée par virgules.</param>
    /// <param name="action">Action effectuée (ex: VIEW_DOCUMENT, DOWNLOAD_DOCUMENT)</param>
    /// <param name="userId">ID de l'utilisateur</param>
    /// <param name="startDate">Date de début</param>
    /// <param name="endDate">Date de fin</param>
    /// <param name="limit">Nombre maximum de résultats (défaut: 1000, max: 10000)</param>
    /// <returns>Liste des logs d'audit</returns>
    [HttpGet]
    public async Task<ActionResult<List<AuditLogDto>>> GetAuditLogs(
        [FromQuery] string? entityType = null,
        [FromQuery] string? action = null,
        [FromQuery] Guid? userId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int limit = 1000)
    {
        try
        {
            // Vérifier que l'utilisateur est administrateur ou manager
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && userRole != "Manager")
            {
                _logger.LogWarning("Tentative d'accès aux logs par utilisateur non autorisé: {User}", User.Identity?.Name);
                return Forbid();
            }

            // Limiter le nombre de résultats (max 10000 pour admin)
            if (limit > 10000) limit = 10000;
            if (limit < 1) limit = 1000;

            var query = _context.AuditLogs
                .Include(a => a.User)
                .AsQueryable();

            // Appliquer les filtres
            // Support pour plusieurs entityTypes séparés par virgule (ex: "Document,Dossier")
            if (!string.IsNullOrEmpty(entityType))
            {
                var entityTypes = entityType.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                if (entityTypes.Length == 1)
                {
                    query = query.Where(a => a.EntityType == entityTypes[0]);
                }
                else if (entityTypes.Length > 1)
                {
                    query = query.Where(a => entityTypes.Contains(a.EntityType));
                }
            }

            if (!string.IsNullOrEmpty(action))
            {
                query = query.Where(a => a.Action == action);
            }

            if (userId.HasValue)
            {
                query = query.Where(a => a.UserId == userId.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(a => a.Timestamp >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(a => a.Timestamp <= endDate.Value);
            }

            // Ordonner par date décroissante et limiter
            var logs = await query
                .OrderByDescending(a => a.Timestamp)
                .Take(limit)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    Timestamp = a.Timestamp,
                    UserId = a.UserId,
                    UserName = a.User != null ? a.User.Username : null,
                    Action = a.Action,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    OldValues = a.OldValues,
                    NewValues = a.NewValues,
                    IpAddress = a.IpAddress,
                    UserAgent = a.UserAgent
                })
                .ToListAsync();

            _logger.LogInformation(
                "Logs d'audit récupérés: {Count} résultats (entityType={EntityType}, action={Action})",
                logs.Count, entityType ?? "all", action ?? "all");

            return Ok(logs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des logs d'audit");
            return StatusCode(500, new { message = "Erreur serveur lors de la récupération des logs" });
        }
    }

    /// <summary>
    /// Récupère un log d'audit spécifique par son ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AuditLogDto>> GetAuditLogById(Guid id)
    {
        try
        {
            // Vérifier que l'utilisateur est administrateur ou manager
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && userRole != "Manager")
            {
                return Forbid();
            }

            var log = await _context.AuditLogs
                .Include(a => a.User)
                .Where(a => a.Id == id)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    Timestamp = a.Timestamp,
                    UserId = a.UserId,
                    UserName = a.User != null ? a.User.Username : null,
                    Action = a.Action,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    OldValues = a.OldValues,
                    NewValues = a.NewValues,
                    IpAddress = a.IpAddress,
                    UserAgent = a.UserAgent
                })
                .FirstOrDefaultAsync();

            if (log == null)
            {
                return NotFound(new { message = "Log non trouvé" });
            }

            return Ok(log);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération du log {LogId}", id);
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    /// <summary>
    /// Récupère les statistiques des logs d'audit.
    /// </summary>
    [HttpGet("statistics")]
    public async Task<ActionResult<object>> GetStatistics(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            // Vérifier que l'utilisateur est administrateur ou manager
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin" && userRole != "Manager")
            {
                return Forbid();
            }

            var query = _context.AuditLogs.AsQueryable();

            if (startDate.HasValue)
            {
                query = query.Where(a => a.Timestamp >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(a => a.Timestamp <= endDate.Value);
            }

            var stats = new
            {
                TotalLogs = await query.CountAsync(),
                TotalViews = await query.CountAsync(a => a.Action == "VIEW_DOCUMENT"),
                TotalDownloads = await query.CountAsync(a => a.Action == "DOWNLOAD_DOCUMENT"),
                TotalUploads = await query.CountAsync(a => a.Action == "UPLOAD"),
                TotalDeletes = await query.CountAsync(a => a.Action == "DELETE"),
                LogsByEntityType = await query
                    .GroupBy(a => a.EntityType)
                    .Select(g => new { EntityType = g.Key, Count = g.Count() })
                    .ToListAsync(),
                LogsByAction = await query
                    .GroupBy(a => a.Action)
                    .Select(g => new { Action = g.Key, Count = g.Count() })
                    .ToListAsync()
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des statistiques");
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }
}
