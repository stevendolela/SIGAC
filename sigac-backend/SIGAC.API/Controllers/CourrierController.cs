using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;
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
    private readonly ApplicationDbContext _context;

    public CourrierController(ICourrierService courrierService, ILogger<CourrierController> logger, ApplicationDbContext context)
    {
        _courrierService = courrierService;
        _logger = logger;
        _context = context;
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
    /// Crée un courrier manuellement (sans OCR) - accepte JSON ou FormData
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CourrierDetailDto>> CreateCourrier()
    {
        // Accepter à la fois [FromBody] JSON et [FromForm] FormData
        CreateCourrierDto? dto = null;

        try
        {
            // Essayer de lire du FormData d'abord
            if (Request.ContentType?.Contains("multipart/form-data") == true)
            {
                if (!Request.Form.ContainsKey("type") || !Request.Form.ContainsKey("objet"))
                {
                    return BadRequest(new { message = "Champs requis manquants: type, objet" });
                }

                string typeStr = Request.Form["type"].ToString();
                string urgenceStr = Request.Form["urgence"].ToString() ?? "Normale";

                // Convertir strings en enums
                if (!Enum.TryParse<TypeCourrier>(typeStr, ignoreCase: true, out var typeEnum))
                {
                    return BadRequest(new { message = $"Type '{typeStr}' n'est pas valide. Valeurs acceptées: Entrant, Sortant" });
                }

                if (!Enum.TryParse<UrgenceCourrier>(urgenceStr, ignoreCase: true, out var urgenceEnum))
                {
                    urgenceEnum = UrgenceCourrier.Normale;
                }

                dto = new CreateCourrierDto
                {
                    Type = typeEnum,
                    Objet = Request.Form["objet"].ToString(),
                    Expediteur = Request.Form["expediteur"].ToString() ?? string.Empty,
                    Destinataire = Request.Form["destinataire"].ToString() ?? string.Empty,
                    DateCourrier = DateTime.TryParse(Request.Form["dateCourrier"].ToString(), out var date) ? date : DateTime.UtcNow,
                    Urgence = urgenceEnum,
                    Notes = Request.Form["notes"].ToString(),
                    WorkspaceId = Guid.TryParse(Request.Form["workspaceId"].ToString(), out var wsId) ? wsId : null,
                    AssigneAId = Guid.TryParse(Request.Form["assigneAId"].ToString(), out var userId) ? userId : null
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la lecture du FormData");
            return BadRequest(new { message = "Erreur lors de la lecture des données du formulaire" });
        }

        if (dto == null)
        {
            return BadRequest(new { message = "Impossible de parser les données du courrier" });
        }

        if (string.IsNullOrWhiteSpace(dto.Objet))
        {
            return BadRequest(new { message = "Objet est obligatoire" });
        }

        try
        {
            var courrier = await _courrierService.CreateCourrierAsync(dto, GetUserId());
            return CreatedAtAction(nameof(GetCourrier), new { id = courrier.Id }, courrier);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la création du courrier");
            return BadRequest(new { message = ex.Message });
        }
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

    /// <summary>
    /// Applique la migration de la table Courriers si elle n'existe pas
    /// </summary>
    [HttpPost("apply-migration")]
    [AllowAnonymous]
    public async Task<IActionResult> ApplyCourrierMigration()
    {
        try
        {
            await using var conn = _context.Database.GetDbConnection();
            await conn.OpenAsync();
            
            // Vérifier si la table Courriers existe déjà
            await using var checkCmd = conn.CreateCommand();
            checkCmd.CommandText = @"
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name = 'Courriers'";
            var tableExists = Convert.ToInt32(await checkCmd.ExecuteScalarAsync()) > 0;
            
            if (tableExists)
            {
                return Ok(new { 
                    message = "La table Courriers existe déjà",
                    alreadyExists = true
                });
            }
            
            // Créer la table Courriers
            await using var createTableCmd = conn.CreateCommand();
            createTableCmd.CommandText = @"
                CREATE TABLE ""Courriers"" (
                    ""Id"" uuid NOT NULL,
                    ""Reference"" character varying(50) NOT NULL,
                    ""Type"" integer NOT NULL,
                    ""Objet"" character varying(500) NOT NULL,
                    ""Expediteur"" character varying(300) NOT NULL,
                    ""Destinataire"" character varying(300) NOT NULL,
                    ""DateCourrier"" timestamp with time zone NOT NULL,
                    ""DateReception"" timestamp with time zone NOT NULL,
                    ""Statut"" integer NOT NULL,
                    ""Urgence"" integer NOT NULL,
                    ""ReferenceExterne"" character varying(100),
                    ""TexteOCR"" text,
                    ""ConfianceOCR"" integer,
                    ""Notes"" text,
                    ""DocumentData"" text,
                    ""NomFichier"" character varying(255),
                    ""MimeType"" character varying(100),
                    ""TailleFichier"" bigint,
                    ""DossierId"" uuid,
                    ""WorkspaceId"" uuid,
                    ""AssigneAId"" uuid,
                    ""CreatedBy"" uuid NOT NULL,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    ""ModifiedBy"" uuid,
                    ""ModifiedAt"" timestamp with time zone,
                    CONSTRAINT ""PK_Courriers"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_Courriers_Dossiers_DossierId"" FOREIGN KEY (""DossierId"") REFERENCES ""Dossiers"" (""Id"") ON DELETE SET NULL,
                    CONSTRAINT ""FK_Courriers_Users_AssigneAId"" FOREIGN KEY (""AssigneAId"") REFERENCES ""Users"" (""Id"") ON DELETE SET NULL,
                    CONSTRAINT ""FK_Courriers_Users_CreatedBy"" FOREIGN KEY (""CreatedBy"") REFERENCES ""Users"" (""Id"") ON DELETE RESTRICT,
                    CONSTRAINT ""FK_Courriers_Workspaces_WorkspaceId"" FOREIGN KEY (""WorkspaceId"") REFERENCES ""Workspaces"" (""Id"") ON DELETE RESTRICT
                )";
            await createTableCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("Table Courriers créée");
            
            // Créer la table CourrierHistoriques
            await using var createHistCmd = conn.CreateCommand();
            createHistCmd.CommandText = @"
                CREATE TABLE ""CourrierHistoriques"" (
                    ""Id"" uuid NOT NULL,
                    ""CourrierId"" uuid NOT NULL,
                    ""Action"" character varying(100) NOT NULL,
                    ""Details"" character varying(1000),
                    ""AncienStatut"" character varying(50),
                    ""NouveauStatut"" character varying(50),
                    ""UserId"" uuid NOT NULL,
                    ""DateAction"" timestamp with time zone NOT NULL,
                    CONSTRAINT ""PK_CourrierHistoriques"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_CourrierHistoriques_Courriers_CourrierId"" FOREIGN KEY (""CourrierId"") REFERENCES ""Courriers"" (""Id"") ON DELETE CASCADE,
                    CONSTRAINT ""FK_CourrierHistoriques_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE RESTRICT
                )";
            await createHistCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("Table CourrierHistoriques créée");
            
            // Créer les index
            var indexCommands = new[] {
                @"CREATE INDEX ""IX_CourrierHistoriques_CourrierId"" ON ""CourrierHistoriques"" (""CourrierId"")",
                @"CREATE INDEX ""IX_CourrierHistoriques_UserId"" ON ""CourrierHistoriques"" (""UserId"")",
                @"CREATE INDEX ""IX_Courriers_AssigneAId"" ON ""Courriers"" (""AssigneAId"")",
                @"CREATE INDEX ""IX_Courriers_CreatedBy"" ON ""Courriers"" (""CreatedBy"")",
                @"CREATE INDEX ""IX_Courriers_DossierId"" ON ""Courriers"" (""DossierId"")",
                @"CREATE UNIQUE INDEX ""IX_Courriers_Reference"" ON ""Courriers"" (""Reference"")",
                @"CREATE INDEX ""IX_Courriers_WorkspaceId"" ON ""Courriers"" (""WorkspaceId"")"
            };
            
            foreach (var indexSql in indexCommands)
            {
                await using var indexCmd = conn.CreateCommand();
                indexCmd.CommandText = indexSql;
                await indexCmd.ExecuteNonQueryAsync();
            }
            _logger.LogInformation("Index Courriers créés");
            
            // Enregistrer la migration
            await using var migrationCmd = conn.CreateCommand();
            migrationCmd.CommandText = @"
                INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                SELECT '20260117014820_AddCourrierManagement', '8.0.8'
                WHERE NOT EXISTS (
                    SELECT 1 FROM ""__EFMigrationsHistory"" 
                    WHERE ""MigrationId"" = '20260117014820_AddCourrierManagement'
                )";
            await migrationCmd.ExecuteNonQueryAsync();
            
            _logger.LogInformation("Migration Courrier appliquée avec succès");
            
            return Ok(new { 
                message = "Migration Courrier appliquée avec succès",
                success = true,
                tablesCreated = new[] { "Courriers", "CourrierHistoriques" }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de l'application de la migration Courrier");
            return StatusCode(500, new { 
                message = "Erreur lors de l'application de la migration",
                error = ex.Message 
            });
        }
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
