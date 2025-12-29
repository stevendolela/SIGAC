using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DossiersController : ControllerBase
{
    private readonly IDossierService _dossierService;
    private readonly ILogger<DossiersController> _logger;

    public DossiersController(IDossierService dossierService, ILogger<DossiersController> logger)
    {
        _dossierService = dossierService;
        _logger = logger;
    }

    /// <summary>
    /// Récupère la liste paginée des dossiers avec filtres
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResult<DossierListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResult<DossierListDto>>> GetDossiers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
    [FromQuery] string? search = null,
    [FromQuery] Guid? typeAffaireId = null,
    [FromQuery] StatusDossier? status = null,
    [FromQuery] PrioriteDossier? priorite = null,
    [FromQuery] DateTime? dateDebutMin = null,
    [FromQuery] DateTime? dateDebutMax = null,
    [FromQuery] Guid? rapporteurId = null,
    [FromQuery] Guid? workspaceId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var result = await _dossierService.GetDossiersAsync(
                page, pageSize, search, typeAffaireId, status, priorite,
                dateDebutMin, dateDebutMax, rapporteurId, workspaceId, userId, userRole);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des dossiers");
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }

    /// <summary>
    /// Récupère les détails complets d'un dossier
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(DossierDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DossierDetailDto>> GetDossier(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var dossier = await _dossierService.GetDossierByIdAsync(id, userId, userRole);

            if (dossier == null)
            {
                return NotFound(new { error = "NotFound", message = $"Le dossier {id} n'existe pas" });
            }

            return Ok(dossier);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération du dossier {DossierId}", id);
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }

    /// <summary>
    /// Crée un nouveau dossier
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Manager,Assistant,AssistantJunior,Collaborateur")]
    [ProducesResponseType(typeof(DossierDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DossierDto>> CreateDossier([FromBody] CreateDossierDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new 
                { 
                    error = "ValidationError", 
                    message = "Les données fournies sont invalides",
                    errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });
            }

            var userId = GetCurrentUserId();
            var dossier = await _dossierService.CreateDossierAsync(createDto, userId);

            _logger.LogInformation("Dossier {NumeroDossier} créé par l'utilisateur {UserId}", 
                dossier.NumeroDossier, userId);

            return CreatedAtAction(nameof(GetDossier), new { id = dossier.Id }, dossier);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "ValidationError", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la création du dossier");
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }

    /// <summary>
    /// Met à jour un dossier existant
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager,Assistant")]
    [ProducesResponseType(typeof(DossierDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DossierDto>> UpdateDossier(Guid id, [FromBody] UpdateDossierDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new 
                { 
                    error = "ValidationError", 
                    message = "Les données fournies sont invalides",
                    errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });
            }

            var userId = GetCurrentUserId();
            var dossier = await _dossierService.UpdateDossierAsync(id, updateDto, userId);

            if (dossier == null)
            {
                return NotFound(new { error = "NotFound", message = $"Le dossier {id} n'existe pas" });
            }

            _logger.LogInformation("Dossier {DossierId} mis à jour par l'utilisateur {UserId}", id, userId);

            return Ok(dossier);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "ValidationError", message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la mise à jour du dossier {DossierId}", id);
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }

    /// <summary>
    /// Supprime un dossier (suppression logique)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDossier(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _dossierService.DeleteDossierAsync(id, userId);

            if (!result)
            {
                return NotFound(new { error = "NotFound", message = $"Le dossier {id} n'existe pas" });
            }

            _logger.LogWarning("Dossier {DossierId} supprimé par l'utilisateur {UserId}", id, userId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la suppression du dossier {DossierId}", id);
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }

    /// <summary>
    /// Attribue un rapporteur à un dossier
    /// </summary>
    [HttpPost("{id}/attribuer-rapporteur")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AttribuerRapporteur(Guid id, [FromBody] AttribuerRapporteurDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _dossierService.AttribuerRapporteurAsync(id, dto.RapporteurId, userId);

            if (!result)
            {
                return NotFound(new { error = "NotFound", message = $"Le dossier {id} n'existe pas" });
            }

            _logger.LogInformation("Rapporteur {RapporteurId} attribué au dossier {DossierId} par {UserId}", 
                dto.RapporteurId, id, userId);

            return Ok(new { message = "Rapporteur attribué avec succès" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "ValidationError", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de l'attribution du rapporteur au dossier {DossierId}", id);
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }

    /// <summary>
    /// Change le statut d'un dossier
    /// </summary>
    [HttpPost("{id}/changer-statut")]
    [Authorize(Roles = "Admin,Manager,Collaborateur,Assistant")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangerStatut(Guid id, [FromBody] ChangerStatutDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var result = await _dossierService.ChangerStatutAsync(id, dto.NouveauStatut, dto.Commentaire, userId, userRole);

            if (!result)
            {
                return NotFound(new { error = "NotFound", message = $"Le dossier {id} n'existe pas" });
            }

            _logger.LogInformation("Statut du dossier {DossierId} changé en {NouveauStatut} par {UserId}", 
                id, dto.NouveauStatut, userId);

            return Ok(new { message = "Statut modifié avec succès" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "ValidationError", message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = "Forbidden", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors du changement de statut du dossier {DossierId}", id);
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }

    /// <summary>
    /// Récupère les statistiques des dossiers
    /// </summary>
    [HttpGet("statistiques")]
    [ProducesResponseType(typeof(DossierStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DossierStatisticsDto>> GetStatistics()
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var stats = await _dossierService.GetStatisticsAsync(userId, userRole);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des statistiques");
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim ?? throw new UnauthorizedAccessException("Utilisateur non authentifié"));
    }

    private UserRole GetCurrentUserRole()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        return Enum.Parse<UserRole>(roleClaim ?? throw new UnauthorizedAccessException("Rôle non défini"));
    }
}