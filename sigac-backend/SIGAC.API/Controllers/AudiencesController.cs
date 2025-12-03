using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AudiencesController : ControllerBase
{
    private readonly IAudienceService _audienceService;
    private readonly ILogger<AudiencesController> _logger;

    public AudiencesController(IAudienceService audienceService, ILogger<AudiencesController> logger)
    {
        _audienceService = audienceService;
        _logger = logger;
    }

    /// <summary>
    /// Obtient toutes les audiences (filtrées par rôle)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<AudienceListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AudienceListDto>>> GetAllAudiences()
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var audiences = await _audienceService.GetAllAudiencesAsync(userId, userRole);
            return Ok(audiences);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des audiences");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Obtient les audiences d'un dossier spécifique
    /// </summary>
    [HttpGet("dossier/{dossierId}")]
    [ProducesResponseType(typeof(List<AudienceListDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<AudienceListDto>>> GetAudiencesByDossier(Guid dossierId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var audiences = await _audienceService.GetAudiencesByDossierAsync(dossierId, userId, userRole);
            return Ok(audiences);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des audiences du dossier {DossierId}", dossierId);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Obtient les audiences dans une plage de dates
    /// </summary>
    [HttpGet("date-range")]
    [ProducesResponseType(typeof(List<AudienceListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AudienceListDto>>> GetAudiencesByDateRange(
        [FromQuery] DateTime dateDebut,
        [FromQuery] DateTime dateFin)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var audiences = await _audienceService.GetAudiencesByDateRangeAsync(dateDebut, dateFin, userId, userRole);
            return Ok(audiences);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des audiences par plage de dates");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Obtient une audience par son ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AudienceDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AudienceDetailDto>> GetAudienceById(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var audience = await _audienceService.GetAudienceByIdAsync(id, userId, userRole);
            if (audience == null)
                return NotFound(new { message = "Audience non trouvée" });

            return Ok(audience);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de l'audience {AudienceId}", id);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Crée une nouvelle audience
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AudienceDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AudienceDetailDto>> CreateAudience([FromBody] CreateAudienceDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var audience = await _audienceService.CreateAudienceAsync(dto, userId, userRole);
            
            _logger.LogInformation("Audience {AudienceId} créée pour le dossier {DossierId} par {UserId}", 
                audience.Id, dto.DossierId, userId);

            return CreatedAtAction(nameof(GetAudienceById), new { id = audience.Id }, audience);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la création de l'audience");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Met à jour une audience
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AudienceDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AudienceDetailDto>> UpdateAudience(Guid id, [FromBody] UpdateAudienceDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var audience = await _audienceService.UpdateAudienceAsync(id, dto, userId, userRole);
            
            _logger.LogInformation("Audience {AudienceId} mise à jour par {UserId}", id, userId);

            return Ok(audience);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la mise à jour de l'audience {AudienceId}", id);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Supprime une audience
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAudience(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var deleted = await _audienceService.DeleteAudienceAsync(id, userId, userRole);
            if (!deleted)
                return NotFound(new { message = "Audience non trouvée" });

            _logger.LogInformation("Audience {AudienceId} supprimée par {UserId}", id, userId);

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la suppression de l'audience {AudienceId}", id);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    #region Helpers

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null && Guid.TryParse(claim.Value, out var userId) ? userId : Guid.Empty;
    }

    private UserRole GetCurrentUserRole()
    {
        var claim = User.FindFirst(ClaimTypes.Role);
        return claim != null && Enum.TryParse<UserRole>(claim.Value, out var role) ? role : UserRole.JugeConstitutionnel;
    }

    #endregion
}
