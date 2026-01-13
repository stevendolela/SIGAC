using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

/// <summary>
/// Contrôleur pour l'historique des connexions utilisateurs
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LoginHistoryController : ControllerBase
{
    private readonly ILoginHistoryService _loginHistoryService;
    private readonly ILogger<LoginHistoryController> _logger;

    public LoginHistoryController(
        ILoginHistoryService loginHistoryService,
        ILogger<LoginHistoryController> logger)
    {
        _loginHistoryService = loginHistoryService;
        _logger = logger;
    }

    /// <summary>
    /// Récupère l'historique de connexion de l'utilisateur actuel
    /// </summary>
    /// <param name="limit">Nombre maximum d'enregistrements à retourner (défaut: 50)</param>
    [HttpGet("my-history")]
    public async Task<ActionResult<List<LoginHistoryDto>>> GetMyLoginHistory([FromQuery] int limit = 50)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var userIdGuid))
            {
                return Unauthorized(new { message = "Impossible de récupérer l'identifiant utilisateur" });
            }

            var history = await _loginHistoryService.GetMyLoginHistoryAsync(userIdGuid, limit);

            _logger.LogInformation(
                "Historique de connexion récupéré pour l'utilisateur {UserId}: {Count} enregistrements",
                userIdGuid, history.Count);

            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de l'historique de connexion");
            return StatusCode(500, new { message = "Erreur lors de la récupération de l'historique" });
        }
    }

    /// <summary>
    /// Récupère l'historique de connexion de tous les utilisateurs (Admin only)
    /// </summary>
    /// <param name="limit">Nombre maximum d'enregistrements à retourner (défaut: 100)</param>
    [HttpGet("all")]
    public async Task<ActionResult<List<LoginHistoryDto>>> GetAllLoginHistory([FromQuery] int limit = 100)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var userIdGuid))
            {
                return Unauthorized(new { message = "Impossible de récupérer l'identifiant utilisateur" });
            }

            var roleString = User.FindFirst(ClaimTypes.Role)?.Value;
            if (!Enum.TryParse<UserRole>(roleString, out var userRole))
            {
                userRole = UserRole.Collaborateur;
            }

            if (userRole != UserRole.Admin)
            {
                return Forbid();
            }

            var history = await _loginHistoryService.GetAllLoginHistoryAsync(userIdGuid, userRole, limit);

            _logger.LogInformation(
                "Historique de connexion global récupéré par admin {AdminId}: {Count} enregistrements",
                userIdGuid, history.Count);

            return Ok(history);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Accès non autorisé à l'historique de connexion global");
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de l'historique de connexion global");
            return StatusCode(500, new { message = "Erreur lors de la récupération de l'historique" });
        }
    }

    /// <summary>
    /// Récupère l'historique de connexion pour un utilisateur spécifique (Admin only)
    /// </summary>
    /// <param name="userId">ID de l'utilisateur</param>
    /// <param name="limit">Nombre maximum d'enregistrements à retourner (défaut: 50)</param>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<LoginHistoryDto>>> GetUserLoginHistory(
        Guid userId,
        [FromQuery] int limit = 50)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(currentUserId, out var currentUserIdGuid))
            {
                return Unauthorized(new { message = "Impossible de récupérer l'identifiant utilisateur" });
            }

            var roleString = User.FindFirst(ClaimTypes.Role)?.Value;
            if (!Enum.TryParse<UserRole>(roleString, out var userRole))
            {
                userRole = UserRole.Collaborateur;
            }

            var history = await _loginHistoryService.GetUserLoginHistoryAsync(currentUserIdGuid, userId, userRole, limit);

            _logger.LogInformation(
                "Historique de connexion récupéré pour l'utilisateur {TargetUserId}: {Count} enregistrements",
                userId, history.Count);

            return Ok(history);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Accès non autorisé à l'historique de connexion pour l'utilisateur {UserId}", userId);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de l'historique de connexion pour l'utilisateur {UserId}", userId);
            return StatusCode(500, new { message = "Erreur lors de la récupération de l'historique" });
        }
    }
}
