using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;
using System.Security.Claims;
using System.Security.Cryptography;

namespace SIGAC.API.Controllers;

/// <summary>
/// Gestion des documents et fichiers associés aux dossiers.
/// Endpoints pour upload, download, listing et suppression de documents.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly IDossierRepository _dossierRepository;
    private readonly ILogger<DocumentsController> _logger;
    private readonly IConfiguration _configuration;

    // Configuration des uploads
    private const long MAX_FILE_SIZE = 52428800; // 50 MB en bytes
    private readonly string[] ALLOWED_MIME_TYPES = new[]
    {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/tiff",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/zip",
        "application/x-zip-compressed"
    };

    public DocumentsController(
        IDocumentService documentService,
        IDossierRepository dossierRepository,
        ILogger<DocumentsController> logger,
        IConfiguration configuration)
    {
        _documentService = documentService;
        _dossierRepository = dossierRepository;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Récupère les documents d'un dossier
    /// </summary>
    [HttpGet("dossier/{dossierId}")]
    [ProducesResponseType(typeof(List<DocumentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<DocumentDto>>> GetDocumentsByDossierId(Guid dossierId)
    {
        try
        {
            // Vérifier que le dossier existe
            var dossier = await _dossierRepository.GetByIdAsync(dossierId);
            if (dossier == null)
                return NotFound(new { message = "Dossier non trouvé" });

            var documents = await _documentService.GetByDossierIdAsync(dossierId);
            return Ok(documents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des documents du dossier {DossierId}", dossierId);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Récupère les détails d'un document
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentDto>> GetDocumentById(Guid id)
    {
        try
        {
            var document = await _documentService.GetByIdAsync(id);
            if (document == null)
                return NotFound(new { message = "Document non trouvé" });

            return Ok(document);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération du document {DocumentId}", id);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Upload un fichier pour un dossier
    /// </summary>
    [HttpPost("upload/{dossierId}")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    [ProducesResponseType(StatusCodes.Status415UnsupportedMediaType)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentDto>> UploadDocument(
        Guid dossierId,
        [FromForm] IFormFile file,
        [FromForm] string typeDocument = "Document")
    {
        try
        {
            // Vérifier que le dossier existe
            var dossier = await _dossierRepository.GetByIdAsync(dossierId);
            if (dossier == null)
                return NotFound(new { message = "Dossier non trouvé" });

            // Valider le fichier
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Aucun fichier n'a été uploadé" });

            if (file.Length > MAX_FILE_SIZE)
                return StatusCode(413, new { message = $"Le fichier dépasse la taille maximale de {MAX_FILE_SIZE / 1024 / 1024}MB" });

            if (!ALLOWED_MIME_TYPES.Contains(file.ContentType))
                return StatusCode(415, new { message = $"Type de fichier non autorisé. Types acceptés: {string.Join(", ", ALLOWED_MIME_TYPES)}" });

            // Vérifier l'extension du fichier
            var ext = Path.GetExtension(file.FileName).ToLower();
            var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".doc", ".docx", ".xls", ".xlsx", ".zip" };
            if (!allowedExtensions.Contains(ext))
                return BadRequest(new { message = $"Extension de fichier non autorisée: {ext}" });

            // Calculer le hash SHA256 du fichier
            string hashSHA256 = await CalculateSHA256HashAsync(file);

            // Créer le répertoire de stockage s'il n'existe pas
            var uploadDir = GetUploadDirectory();
            Directory.CreateDirectory(uploadDir);

            // Générer un nom de fichier sécurisé (GUID + extension)
            var storedFileName = $"{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadDir, storedFileName);

            // Sauvegarder le fichier
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            _logger.LogInformation(
                "Fichier uploadé: {OriginalName} -> {StoredName} ({Size} bytes) pour dossier {DossierId}",
                file.FileName, storedFileName, file.Length, dossierId);

            // Enregistrer le document en base de données
            var userId = GetCurrentUserId();
            var document = await _documentService.UploadAsync(
                dossierId,
                file.FileName,
                Path.Combine("uploads", DateTime.Now.Year.ToString(), DateTime.Now.Month.ToString("D2"), storedFileName),
                typeDocument,
                file.Length,
                file.ContentType,
                hashSHA256,
                userId);

            return CreatedAtAction(nameof(GetDocumentById), new { id = document.Id }, document);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de l'upload du document pour le dossier {DossierId}", dossierId);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Télécharge un fichier document
    /// </summary>
    [HttpGet("download/{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadDocument(Guid id)
    {
        try
        {
            var document = await _documentService.GetByIdAsync(id);
            if (document == null)
                return NotFound(new { message = "Document non trouvé" });

            // Construire le chemin physique du fichier
            var uploadDir = GetUploadDirectory();
            var filePath = Path.Combine(uploadDir, Path.GetFileName(document.CheminFichier));

            if (!System.IO.File.Exists(filePath))
            {
                _logger.LogWarning("Fichier physique non trouvé: {FilePath}", filePath);
                return NotFound(new { message = "Fichier non trouvé sur le serveur" });
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            var fileName = document.NomFichier;

            _logger.LogInformation(
                "Utilisateur {UserId} a téléchargé le document {DocumentId} ({FileName})",
                GetCurrentUserId(), id, fileName);

            return File(fileBytes, document.MimeType, fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors du téléchargement du document {DocumentId}", id);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Supprime un document
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDocument(Guid id)
    {
        try
        {
            var document = await _documentService.GetByIdAsync(id);
            if (document == null)
                return NotFound(new { message = "Document non trouvé" });

            var userId = GetCurrentUserId();

            // Supprimer le fichier physique (optionnel - peut garder l'archive)
            try
            {
                var uploadDir = GetUploadDirectory();
                var filePath = Path.Combine(uploadDir, Path.GetFileName(document.CheminFichier));
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Avertissement: impossible de supprimer le fichier physique pour {DocumentId}", id);
                // Continuer même si la suppression du fichier échoue
            }

            // Supprimer de la base de données
            var deleted = await _documentService.DeleteAsync(id, userId);

            if (!deleted)
                return NotFound(new { message = "Document non trouvé" });

            _logger.LogInformation("Utilisateur {UserId} a supprimé le document {DocumentId}", userId, id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la suppression du document {DocumentId}", id);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Obtient les statistiques de stockage
    /// </summary>
    [HttpGet("admin/stats")]
    [Authorize(Roles = "Administrateur")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> GetStorageStats()
    {
        try
        {
            var uploadDir = GetUploadDirectory();
            long totalSize = 0;
            int fileCount = 0;

            if (Directory.Exists(uploadDir))
            {
                var files = Directory.GetFiles(uploadDir, "*", SearchOption.AllDirectories);
                fileCount = files.Length;
                totalSize = files.Sum(f => new FileInfo(f).Length);
            }

            var stats = new
            {
                timestamp = DateTime.UtcNow,
                totalFiles = fileCount,
                totalStorageBytes = totalSize,
                totalStorageMB = Math.Round(totalSize / 1024.0 / 1024.0, 2),
                maxFileSizeMB = MAX_FILE_SIZE / 1024 / 1024,
                uploadDirectory = uploadDir
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des statistiques de stockage");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    #region Helpers

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null && Guid.TryParse(claim.Value, out var userId) ? userId : Guid.Empty;
    }

    private string GetUploadDirectory()
    {
        var baseDir = _configuration["FileStorage:BasePath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads");
        var yearMonth = DateTime.Now.ToString("yyyy/MM");
        return Path.Combine(baseDir, yearMonth);
    }

    private async Task<string> CalculateSHA256HashAsync(IFormFile file)
    {
        using var sha256 = SHA256.Create();
        using var stream = file.OpenReadStream();
        var hash = await Task.Run(() => sha256.ComputeHash(stream));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }

    #endregion
}
