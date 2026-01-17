using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

/// <summary>
/// API de gestion des courriers avec support OCR
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CourrierController : ControllerBase
{
    private readonly ICourrierService _courrierService;
    private readonly ILogger<CourrierController> _logger;

    public CourrierController(ICourrierService courrierService, ILogger<CourrierController> logger)
    {
        _courrierService = courrierService;
        _logger = logger;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
    private UserRole GetUserRole() => Enum.Parse<UserRole>(User.FindFirstValue(ClaimTypes.Role) ?? "Admin");

    /// <summary>
    /// Liste les courriers avec filtres et pagination
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<CourrierListDto>>> GetCourriers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] TypeCourrier? type = null,
        [FromQuery] StatutCourrier? statut = null,
        [FromQuery] UrgenceCourrier? urgence = null,
        [FromQuery] DateTime? dateDebut = null,
        [FromQuery] DateTime? dateFin = null,
        [FromQuery] Guid? workspaceId = null,
        [FromQuery] Guid? assigneAId = null)
    {
        var result = await _courrierService.GetCourriersAsync(
            page, pageSize, search, type, statut, urgence,
            dateDebut, dateFin, workspaceId, assigneAId,
            GetUserId(), GetUserRole());

        return Ok(result);
    }

    /// <summary>
    /// Récupère les détails d'un courrier
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CourrierDetailDto>> GetCourrier(Guid id)
    {
        var courrier = await _courrierService.GetCourrierByIdAsync(id, GetUserId(), GetUserRole());
        if (courrier == null)
            return NotFound(new { message = "Courrier non trouvé" });

        return Ok(courrier);
    }

    /// <summary>
    /// Crée un courrier manuellement (sans OCR)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CourrierDetailDto>> CreateCourrier([FromBody] CreateCourrierDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var courrier = await _courrierService.CreateCourrierAsync(dto, GetUserId());
        return CreatedAtAction(nameof(GetCourrier), new { id = courrier.Id }, courrier);
    }

    /// <summary>
    /// Réceptionne un courrier avec analyse OCR automatique
    /// </summary>
    [HttpPost("reception-ocr")]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50 MB max
    public async Task<ActionResult<CourrierDetailDto>> ReceptionnerAvecOcr(
        [FromForm] IFormFile file,
        [FromForm] TypeCourrier type = TypeCourrier.Entrant,
        [FromForm] UrgenceCourrier urgence = UrgenceCourrier.Normale,
        [FromForm] Guid? workspaceId = null,
        [FromForm] Guid? assigneAId = null,
        [FromForm] string? notes = null)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Fichier requis" });

        // Vérifier le type de fichier
        var allowedTypes = new[] { "image/png", "image/jpeg", "image/jpg", "image/tiff", "application/pdf" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest(new { message = "Type de fichier non supporté. Formats acceptés: PNG, JPEG, TIFF, PDF" });

        var dto = new ReceptionCourrierOcrDto
        {
            Type = type,
            Urgence = urgence,
            WorkspaceId = workspaceId,
            AssigneAId = assigneAId,
            Notes = notes
        };

        using var stream = file.OpenReadStream();
        var courrier = await _courrierService.ReceptionnerAvecOcrAsync(
            stream, file.FileName, file.ContentType, dto, GetUserId());

        return CreatedAtAction(nameof(GetCourrier), new { id = courrier.Id }, courrier);
    }

    /// <summary>
    /// Met à jour un courrier
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CourrierDetailDto>> UpdateCourrier(Guid id, [FromBody] UpdateCourrierDto dto)
    {
        try
        {
            var courrier = await _courrierService.UpdateCourrierAsync(id, dto, GetUserId(), GetUserRole());
            return Ok(courrier);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Courrier non trouvé" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    /// <summary>
    /// Supprime un courrier (admin uniquement)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCourrier(Guid id)
    {
        try
        {
            await _courrierService.DeleteCourrierAsync(id, GetUserId(), GetUserRole());
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Courrier non trouvé" });
        }
    }

    /// <summary>
    /// Télécharge le document attaché à un courrier
    /// </summary>
    [HttpGet("{id:guid}/document")]
    public async Task<IActionResult> GetDocument(Guid id)
    {
        try
        {
            var result = await _courrierService.GetDocumentAsync(id, GetUserId(), GetUserRole());
            if (result == null)
                return NotFound(new { message = "Document non trouvé" });

            return File(result.Value.Data, result.Value.MimeType, result.Value.FileName);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Ré-analyse un courrier avec OCR
    /// </summary>
    [HttpPost("{id:guid}/analyser")]
    public async Task<ActionResult<OcrResultDto>> AnalyserDocument(Guid id)
    {
        try
        {
            var result = await _courrierService.AnalyserDocumentAsync(id, GetUserId(), GetUserRole());
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Courrier non trouvé" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Change le statut d'un courrier
    /// </summary>
    [HttpPatch("{id:guid}/statut")]
    public async Task<ActionResult<CourrierDetailDto>> ChangerStatut(
        Guid id,
        [FromBody] ChangeStatutDto dto)
    {
        try
        {
            var courrier = await _courrierService.ChangerStatutAsync(
                id, dto.NouveauStatut, dto.Commentaire, GetUserId(), GetUserRole());
            return Ok(courrier);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Courrier non trouvé" });
        }
    }

    /// <summary>
    /// Assigne un courrier à un utilisateur
    /// </summary>
    [HttpPatch("{id:guid}/assigner")]
    public async Task<ActionResult<CourrierDetailDto>> AssignerCourrier(
        Guid id,
        [FromBody] AssignerCourrierDto dto)
    {
        try
        {
            var courrier = await _courrierService.AssignerCourrierAsync(
                id, dto.AssigneAId, GetUserId(), GetUserRole());
            return Ok(courrier);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lie un courrier à un dossier existant
    /// </summary>
    [HttpPatch("{id:guid}/lier-dossier")]
    public async Task<ActionResult<CourrierDetailDto>> LierAuDossier(
        Guid id,
        [FromBody] LierDossierDto dto)
    {
        try
        {
            var courrier = await _courrierService.LierAuDossierAsync(
                id, dto.DossierId, GetUserId(), GetUserRole());
            return Ok(courrier);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Crée un dossier à partir d'un courrier
    /// </summary>
    [HttpPost("{id:guid}/creer-dossier")]
    public async Task<ActionResult<DossierDto>> CreateDossierFromCourrier(
        Guid id,
        [FromBody] CreateDossierFromCourrierRequest dto)
    {
        try
        {
            var createDto = new CreateDossierFromCourrierDto
            {
                CourrierId = id,
                Titre = dto.Titre,
                TypeAffaireId = dto.TypeAffaireId,
                Demandeur = dto.Demandeur,
                Defendeur = dto.Defendeur,
                RapporteurId = dto.RapporteurId
            };

            var dossier = await _courrierService.CreateDossierFromCourrierAsync(createDto, GetUserId());
            return Ok(dossier);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Courrier non trouvé" });
        }
    }

    /// <summary>
    /// Statistiques des courriers
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<CourrierStatsDto>> GetStatistiques([FromQuery] Guid? workspaceId = null)
    {
        var stats = await _courrierService.GetStatistiquesAsync(workspaceId, GetUserId(), GetUserRole());
        return Ok(stats);
    }
}

// DTOs pour les requêtes
public class ChangeStatutDto
{
    public StatutCourrier NouveauStatut { get; set; }
    public string? Commentaire { get; set; }
}

public class AssignerCourrierDto
{
    public Guid AssigneAId { get; set; }
}

public class LierDossierDto
{
    public Guid DossierId { get; set; }
}

public class CreateDossierFromCourrierRequest
{
    public string? Titre { get; set; }
    public Guid? TypeAffaireId { get; set; }
    public string? Demandeur { get; set; }
    public string? Defendeur { get; set; }
    public Guid? RapporteurId { get; set; }
}
