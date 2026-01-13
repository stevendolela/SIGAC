using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

/// <summary>
/// Contrôleur pour le tableau de bord avec métriques avancées
/// Supporte filtres temporels et vues multi-rôles
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(IDashboardService dashboardService, ILogger<DashboardController> logger)
    {
        _dashboardService = dashboardService;
        _logger = logger;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
    
    private UserRole GetCurrentUserRole()
    {
        try
        {
            var roleClaim = User.FindFirst("role")?.Value 
                         ?? User.FindFirst(ClaimTypes.Role)?.Value 
                         ?? UserRole.Collaborateur.ToString();
            return Enum.Parse<UserRole>(roleClaim);
        }
        catch
        {
            return UserRole.Collaborateur;
        }
    }

    /// <summary>
    /// Récupère les statistiques complètes du tableau de bord
    /// </summary>
    /// <param name="periodeDays">Nombre de jours à analyser (0 = tous les temps)</param>
    /// <param name="workspaceId">ID du workspace (optionnel)</param>
    /// <returns>Statistiques enrichies du dashboard</returns>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(DashboardStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardStatisticsDto>> GetStatistics([FromQuery] int periodeDays = 0, [FromQuery] Guid? workspaceId = null)
    {
        try
        {
            if (periodeDays < 0)
                return BadRequest("La période doit être positive");

            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var stats = await _dashboardService.GetStatisticsAsync(userId, userRole, periodeDays, workspaceId);
            
            _logger.LogInformation(
                "Utilisateur {UserId} a consulté les statistiques du dashboard (période: {PeriodeDays}j)",
                userId, periodeDays);

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des statistiques");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "Erreur lors de la récupération des statistiques" });
        }
    }

    /// <summary>
    /// Récupère les statistiques pour une période spécifique
    /// </summary>
    [HttpGet("statistics/period")]
    [ProducesResponseType(typeof(DashboardStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardStatisticsDto>> GetStatisticsForPeriod(
        [FromQuery] DateTime dateDebut,
        [FromQuery] DateTime dateFin)
    {
        try
        {
            if (dateDebut >= dateFin)
                return BadRequest("La date de début doit être antérieure à la date de fin");

            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var stats = await _dashboardService.GetStatisticsForPeriodAsync(
                userId, userRole, dateDebut, dateFin);

            _logger.LogInformation(
                "Utilisateur {UserId} a consulté les statistiques pour la période {Start:d} - {End:d}",
                userId, dateDebut, dateFin);

            return Ok(stats);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des statistiques pour la période");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "Erreur lors de la récupération des statistiques" });
        }
    }

    /// <summary>
    /// Récupère la timeline des dossiers créés (derniers 6 mois)
    /// </summary>
    [HttpGet("timeline/created")]
    [ProducesResponseType(typeof(List<TimelineDataDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<TimelineDataDto>>> GetCreatedTimeline()
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var timeline = await _dashboardService.GetDossiersCreatedTimelineAsync(userId, userRole);

            return Ok(timeline);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de la timeline créée");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "Erreur lors de la récupération de la timeline" });
        }
    }

    /// <summary>
    /// Récupère la timeline des dossiers complétés (derniers 6 mois)
    /// </summary>
    [HttpGet("timeline/completed")]
    [ProducesResponseType(typeof(List<TimelineDataDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<TimelineDataDto>>> GetCompletedTimeline()
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var timeline = await _dashboardService.GetDossiersCompletedTimelineAsync(userId, userRole);

            return Ok(timeline);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de la timeline complétée");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "Erreur lors de la récupération de la timeline" });
        }
    }

    /// <summary>
    /// Récupère le top des utilisateurs les plus actifs (Admin only)
    /// </summary>
    [HttpGet("top-users")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<UserActivityDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<UserActivityDto>>> GetTopUsers([FromQuery] int limit = 5)
    {
        try
        {
            if (limit <= 0 || limit > 100)
                return BadRequest("La limite doit être entre 1 et 100");

            var topUsers = await _dashboardService.GetTopUsersAsync(limit);

            _logger.LogInformation("Admin a consulté le top {Limit} des utilisateurs actifs", limit);

            return Ok(topUsers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération du top utilisateurs");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "Erreur lors de la récupération du top utilisateurs" });
        }
    }

    /// <summary>
    /// Récupère les statistiques de stockage pour un workspace
    /// </summary>
    [HttpGet("storage/{workspaceId:guid}")]
    [ProducesResponseType(typeof(StorageStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<StorageStatisticsDto>> GetStorageStatistics(Guid workspaceId)
    {
        try
        {
            var userRole = GetCurrentUserRole();

            // Validation: seulement Admin ou Owner du workspace
            if (userRole != UserRole.Admin)
                return Forbid();

            var stats = await _dashboardService.GetStorageStatisticsAsync(workspaceId);

            _logger.LogInformation("Statistiques de stockage consultées pour workspace {WorkspaceId}", workspaceId);

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des statistiques de stockage");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "Erreur lors de la récupération des statistiques de stockage" });
        }
    }
}
