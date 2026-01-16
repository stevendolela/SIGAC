using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;
using SIGAC.Core.Entities;
using SIGAC.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
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
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly ILogger<DocumentsController> _logger;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;

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
        IAuditLogRepository auditLogRepository,
        ILogger<DocumentsController> logger,
        IConfiguration configuration,
        ApplicationDbContext context)
    {
        _documentService = documentService;
        _dossierRepository = dossierRepository;
        _auditLogRepository = auditLogRepository;
        _logger = logger;
        _configuration = configuration;
        _context = context;
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

            // Lire le contenu du fichier en mémoire pour stockage Base64
            byte[] fileBytes;
            using (var memoryStream = new MemoryStream())
            {
                await file.CopyToAsync(memoryStream);
                fileBytes = memoryStream.ToArray();
            }
            string fileDataBase64 = Convert.ToBase64String(fileBytes);

            // Préparer répertoires de stockage (racine + sous-dossier date) - fallback local
            var baseUploadDir = GetBaseUploadDirectory();
            var subDir = GetCurrentUploadSubdirectory(); // yyyy/MM
            var uploadDir = Path.Combine(baseUploadDir, subDir);
            
            string storedFileName = $"{Guid.NewGuid():N}{ext}";
            string relativeStoredPath = Path.Combine(subDir, storedFileName);
            
            // Essayer de sauvegarder localement (optionnel, peut échouer sur Render)
            try
            {
                Directory.CreateDirectory(uploadDir);
                var filePath = Path.Combine(uploadDir, storedFileName);
                await System.IO.File.WriteAllBytesAsync(filePath, fileBytes);
                _logger.LogInformation(
                    "Fichier uploadé localement: {OriginalName} -> {StoredName} ({Size} bytes) pour dossier {DossierId}",
                    file.FileName, storedFileName, file.Length, dossierId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Impossible de sauvegarder localement, stockage DB uniquement");
            }

            // Enregistrer le document en base de données avec données Base64
            var userId = GetCurrentUserId();
            var document = await _documentService.UploadWithDataAsync(
                dossierId,
                file.FileName,
                relativeStoredPath,
                typeDocument,
                file.Length,
                file.ContentType,
                hashSHA256,
                fileDataBase64,
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
            // Récupérer l'entité Document complète (avec FileData)
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
                return NotFound(new { message = "Document non trouvé" });

            byte[] fileBytes;

            // Priorité 1: FileData (stockage Base64 en DB)
            if (!string.IsNullOrEmpty(document.FileData))
            {
                _logger.LogInformation("DownloadDocument: Lecture depuis FileData (Base64) pour {DocumentId}", id);
                try
                {
                    fileBytes = Convert.FromBase64String(document.FileData);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur décodage Base64 pour document {DocumentId}", id);
                    return StatusCode(500, new { message = "Erreur lors du décodage du fichier" });
                }
            }
            // Priorité 2: Fichier physique (fallback)
            else
            {
                var filePath = GetAbsoluteFilePath(document.CheminFichier);
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("DownloadDocument 404: Ni FileData ni fichier physique pour document {DocumentId}", id);
                    return NotFound(new { message = "Fichier non trouvé sur le serveur" });
                }
                _logger.LogInformation("DownloadDocument: Lecture depuis fichier physique pour {DocumentId}", id);
                fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            }

            var fileName = document.NomFichier;

            // Enregistrer la visualisation
            await LogDocumentVisualisation(id, "download");

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
    /// Visualise un document dans le navigateur sans le télécharger
    /// </summary>
    [HttpGet("view/{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ViewDocument(Guid id)
    {
        try
        {
            // Récupérer l'entité Document complète (avec FileData)
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                _logger.LogWarning("ViewDocument 404: Document {DocumentId} introuvable en base", id);
                return NotFound(new { message = "Document non trouvé" });
            }

            byte[] fileBytes;

            // Priorité 1: FileData (stockage Base64 en DB)
            if (!string.IsNullOrEmpty(document.FileData))
            {
                _logger.LogInformation("ViewDocument: Lecture depuis FileData (Base64) pour {DocumentId}", id);
                try
                {
                    fileBytes = Convert.FromBase64String(document.FileData);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur décodage Base64 pour document {DocumentId}", id);
                    return StatusCode(500, new { message = "Erreur lors du décodage du fichier" });
                }
            }
            // Priorité 2: Fichier physique (fallback)
            else
            {
                var filePath = GetAbsoluteFilePath(document.CheminFichier);
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning(
                        "ViewDocument 404: Ni FileData ni fichier physique pour document {DocumentId}. Chemin='{CheminResolu}'", 
                        id, filePath);
                    return NotFound(new { message = "Fichier non trouvé sur le serveur" });
                }
                _logger.LogInformation("ViewDocument: Lecture depuis fichier physique pour {DocumentId}", id);
                fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            }

            // Enregistrer la visualisation
            await LogDocumentVisualisation(id, "view");

            _logger.LogInformation(
                "Utilisateur {UserId} a visualisé le document {DocumentId} ({FileName})",
                GetCurrentUserId(), id, document.NomFichier);

            // Forcer l'affichage en ligne (pas de téléchargement)
            Response.Headers.Append("Content-Disposition", $"inline; filename=\"{document.NomFichier}\"");
            
            return File(fileBytes, document.MimeType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la visualisation du document {DocumentId}", id);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Obtient l'historique de visualisation d'un document
    /// </summary>
    [HttpGet("{id}/visualisations")]
    [ProducesResponseType(typeof(List<DocumentVisualisationLogDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<DocumentVisualisationLogDto>>> GetDocumentVisualisations(Guid id)
    {
        try
        {
            var document = await _documentService.GetByIdAsync(id);
            if (document == null)
                return NotFound(new { message = "Document non trouvé" });

            var logs = await _context.DocumentVisualisationLogs
                .Include(v => v.User)
                .Include(v => v.Document)
                .Where(v => v.DocumentId == id)
                .OrderByDescending(v => v.DateVisualisation)
                .Take(100) // Limiter aux 100 dernières
                .Select(v => new DocumentVisualisationLogDto
                {
                    Id = v.Id,
                    DocumentId = v.DocumentId,
                    DocumentNom = v.Document.NomFichier,
                    UserId = v.UserId,
                    UserNomComplet = v.User.NomComplet ?? v.User.Username,
                    DateVisualisation = v.DateVisualisation,
                    TypeVisualisation = v.TypeVisualisation,
                    IpAddress = v.IpAddress
                })
                .ToListAsync();

            return Ok(logs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de l'historique du document {DocumentId}", id);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Obtient l'historique de visualisation pour un dossier
    /// </summary>
    [HttpGet("dossier/{dossierId}/visualisations")]
    [ProducesResponseType(typeof(List<DocumentVisualisationLogDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<DocumentVisualisationLogDto>>> GetDossierDocumentVisualisations(Guid dossierId)
    {
        try
        {
            var dossier = await _dossierRepository.GetByIdAsync(dossierId);
            if (dossier == null)
                return NotFound(new { message = "Dossier non trouvé" });

            var logs = await _context.DocumentVisualisationLogs
                .Include(v => v.User)
                .Include(v => v.Document)
                .Where(v => v.Document.DossierId == dossierId)
                .OrderByDescending(v => v.DateVisualisation)
                .Take(200) // Limiter aux 200 dernières
                .Select(v => new DocumentVisualisationLogDto
                {
                    Id = v.Id,
                    DocumentId = v.DocumentId,
                    DocumentNom = v.Document.NomFichier,
                    UserId = v.UserId,
                    UserNomComplet = v.User.NomComplet ?? v.User.Username,
                    DateVisualisation = v.DateVisualisation,
                    TypeVisualisation = v.TypeVisualisation,
                    IpAddress = v.IpAddress
                })
                .ToListAsync();

            return Ok(logs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de l'historique du dossier {DossierId}", dossierId);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Assigne un document à un dossier différent
    /// </summary>
    [HttpPut("{id}/assign")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DocumentDto>> AssignDocumentToDossier(Guid id, [FromBody] AssignDocumentDto dto)
    {
        try
        {
            if (dto == null || dto.DossierId == Guid.Empty)
                return BadRequest(new { message = "DossierId est requis" });

            var document = await _documentService.GetByIdAsync(id);
            if (document == null)
                return NotFound(new { message = "Document non trouvé" });

            // Vérifier que le dossier existe
            var dossier = await _dossierRepository.GetByIdAsync(dto.DossierId);
            if (dossier == null)
                return NotFound(new { message = "Dossier cible non trouvé" });

            var userId = GetCurrentUserId();

            // Assigner le document au nouveau dossier
            var assignedDocument = await _documentService.AssignToDossierAsync(id, dto.DossierId, userId);

            if (assignedDocument == null)
                return NotFound(new { message = "Document non trouvé" });

            _logger.LogInformation(
                "Utilisateur {UserId} a assigné le document {DocumentId} au dossier {DossierId}",
                userId, id, dto.DossierId);

            return Ok(assignedDocument);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de l'assignation du document {DocumentId}", id);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

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
                var filePath = GetAbsoluteFilePath(document.CheminFichier);
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
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> GetStorageStats()
    {
        try
        {
            // Statistiques sur l'ensemble du répertoire racine (toutes années/mois)
            var uploadDir = GetBaseUploadDirectory();
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

    private string GetBaseUploadDirectory()
    {
        return _configuration["FileStorage:BasePath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads");
    }

    private string GetCurrentUploadSubdirectory() => DateTime.Now.ToString("yyyy/MM");

    private string GetAbsoluteFilePath(string cheminFichier)
    {
        var baseDir = GetBaseUploadDirectory();
        if (string.IsNullOrWhiteSpace(cheminFichier)) return baseDir;
        var normalized = cheminFichier.Replace("\\", "/").TrimStart('/', ' ');
        if (normalized.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
        {
            normalized = normalized.Substring("uploads/".Length);
        }
        return Path.Combine(baseDir, normalized.Replace('/', Path.DirectorySeparatorChar));
    }

    private async Task<string> CalculateSHA256HashAsync(IFormFile file)
    {
        using var sha256 = SHA256.Create();
        using var stream = file.OpenReadStream();
        var hash = await Task.Run(() => sha256.ComputeHash(stream));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }

    private async Task LogDocumentVisualisation(Guid documentId, string typeVisualisation)
    {
        try
        {
            var userId = GetCurrentUserId();
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

            // 1. Log spécifique aux visualisations de documents
            var log = new DocumentVisualisationLog
            {
                Id = Guid.NewGuid(),
                DocumentId = documentId,
                UserId = userId,
                DateVisualisation = DateTime.UtcNow,
                TypeVisualisation = typeVisualisation,
                IpAddress = ipAddress,
                UserAgent = userAgent?.Length > 500 ? userAgent.Substring(0, 500) : userAgent
            };

            _context.DocumentVisualisationLogs.Add(log);
            await _context.SaveChangesAsync();

            // 2. Log dans AuditLog pour traçabilité centralisée
            var document = await _documentService.GetByIdAsync(documentId);
            var logDetails = new
            {
                DocumentId = documentId,
                DocumentNom = document?.NomFichier ?? "Unknown",
                TypeVisualisation = typeVisualisation,
                IpAddress = ipAddress,
                DateVisualisation = DateTime.UtcNow
            };

            await _auditLogRepository.LogActionAsync(
                userId,
                typeVisualisation == "download" ? "DOWNLOAD_DOCUMENT" : "VIEW_DOCUMENT",
                "Document",
                documentId.ToString(),
                null, // oldValues
                System.Text.Json.JsonSerializer.Serialize(logDetails),
                ipAddress,
                userAgent
            );

            _logger.LogInformation(
                "Document {DocumentId} ({TypeVisualisation}) consulté par utilisateur {UserId} depuis {IpAddress}",
                documentId, typeVisualisation, userId, ipAddress);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erreur lors de l'enregistrement de la visualisation du document {DocumentId}", documentId);
            // Ne pas faire échouer la requête si le log échoue
        }
    }

    /// <summary>
    /// Recherche les scanners disponibles sur le réseau local
    /// </summary>
    [HttpGet("scanners/network-search")]
    public async Task<IActionResult> SearchNetworkScanners([FromQuery] string? subnet = null)
    {
        try
        {
            _logger.LogInformation("Recherche des scanners réseau - Subnet: {subnet}", subnet ?? "auto");
            var scanners = await ScanForNetworkScanners(subnet);
            return Ok(new
            {
                success = true,
                scannersFound = scanners.Count,
                scanners = scanners,
                message = $"{scanners.Count} scanner(s) trouvé(s) sur le réseau"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la recherche de scanners réseau");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Teste la connexion à un scanner spécifique
    /// </summary>
    [HttpPost("scanners/test-connection")]
    public async Task<IActionResult> TestScannerConnection([FromBody] TestScannerRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Ip))
                return BadRequest(new { success = false, message = "IP requise" });

            _logger.LogInformation("Test connexion scanner - IP: {ip}, Port: {port}", request.Ip, request.Port ?? 9100);
            
            var result = await TestScannerConnectionAsync(request.Ip, request.Port ?? 9100);
            return Ok(new
            {
                success = result,
                ip = request.Ip,
                port = request.Port ?? 9100,
                message = result ? "✅ Scanner accessible" : "❌ Scanner non accessible"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors du test de connexion au scanner");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    #region Scanner Network Helpers

    private async Task<List<ScannerInfo>> ScanForNetworkScanners(string? subnet = null)
    {
        var scanners = new List<ScannerInfo>();
        
        try
        {
            // Déterminer le subnet local si non fourni
            if (string.IsNullOrWhiteSpace(subnet))
            {
                subnet = GetLocalSubnet();
            }

            if (string.IsNullOrWhiteSpace(subnet))
                return scanners; // Aucun subnet trouvé, retourner liste vide

            _logger.LogInformation("Scanning subnet: {subnet}", subnet);

            // Scanner les ports courants des scanners
            var commonPorts = new[] { 9100, 8008, 8080, 80, 161 }; // Port 161 pour SNMP
            var baseIp = subnet.Substring(0, subnet.LastIndexOf('.') + 1);

            // Scanner les 50 dernières adresses du subnet
            var tasks = new List<Task>();
            for (int i = 2; i <= 50; i++)
            {
                var testIp = baseIp + i;
                foreach (var port in commonPorts)
                {
                    tasks.Add(Task.Run(async () =>
                    {
                        try
                        {
                            if (await TestScannerConnectionAsync(testIp, port))
                            {
                                var info = new ScannerInfo
                                {
                                    Ip = testIp,
                                    Port = port,
                                    Status = "online",
                                    Timestamp = DateTime.UtcNow
                                };

                                // Essayer de récupérer le nom du scanner
                                try
                                {
                                    var name = await GetScannerNameAsync(testIp, port);
                                    info.Name = name;
                                }
                                catch { /* Ignore si on ne peut pas récupérer le nom */ }

                                lock (scanners)
                                {
                                    if (!scanners.Any(s => s.Ip == testIp && s.Port == port))
                                        scanners.Add(info);
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogDebug(ex, "Erreur test {ip}:{port}", testIp, port);
                        }
                    }));
                }
            }

            // Attendre avec timeout
            var completedTask = await Task.WhenAny(
                Task.WhenAll(tasks),
                Task.Delay(TimeSpan.FromSeconds(15)) // Timeout de 15 secondes
            );

            _logger.LogInformation("Recherche scanners terminée. Trouvés: {count}", scanners.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erreur lors du scanning réseau");
        }

        return scanners.OrderBy(s => s.Ip).ToList();
    }

    private async Task<bool> TestScannerConnectionAsync(string ip, int port)
    {
        try
        {
            using var client = new System.Net.Sockets.TcpClient();
            client.ReceiveTimeout = 2000;
            client.SendTimeout = 2000;

            var connectTask = client.ConnectAsync(ip, port);
            var completed = await Task.WhenAny(connectTask, Task.Delay(2000));

            if (completed == connectTask && client.Connected)
            {
                client.Close();
                return true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Connexion échouée {ip}:{port}", ip, port);
        }

        return false;
    }

    private async Task<string> GetScannerNameAsync(string ip, int port)
    {
        try
        {
            // Essayer via HTTP
            using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
            var url = $"http://{ip}:{port}/";
            
            var response = await httpClient.GetAsync(url);
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                // Extraire le nom depuis le HTML (simple)
                if (content.Contains("<title>"))
                {
                    var startIdx = content.IndexOf("<title>") + 7;
                    var endIdx = content.IndexOf("</title>");
                    if (startIdx > 6 && endIdx > startIdx)
                    {
                        return content.Substring(startIdx, endIdx - startIdx).Trim();
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Impossible de récupérer le nom du scanner {ip}:{port}", ip, port);
        }

        return $"Scanner ({ip}:{port})";
    }

    private string GetLocalSubnet()
    {
        try
        {
            var host = System.Net.Dns.GetHostEntry(System.Net.Dns.GetHostName());
            foreach (var ip in host.AddressList)
            {
                if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                {
                    return ip.ToString();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erreur lors de la détermination du subnet local");
        }

        return null!;
    }

    #endregion

    #endregion

    /// <summary>
    /// Vérifie et applique les migrations de la base de données si nécessaire
    /// </summary>
    [HttpPost("apply-migrations")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ApplyMigrations()
    {
        try
        {
            var pendingMigrations = await _context.Database.GetPendingMigrationsAsync();
            var pendingList = pendingMigrations.ToList();
            
            if (pendingList.Any())
            {
                _logger.LogInformation("Applying {Count} pending migrations: {Migrations}", 
                    pendingList.Count, string.Join(", ", pendingList));
                
                await _context.Database.MigrateAsync();
                
                return Ok(new { 
                    message = "Migrations applied successfully",
                    applied = pendingList
                });
            }
            
            var appliedMigrations = await _context.Database.GetAppliedMigrationsAsync();
            return Ok(new { 
                message = "No pending migrations",
                applied = appliedMigrations.ToList()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying migrations");
            return StatusCode(500, new { 
                message = "Error applying migrations",
                error = ex.Message 
            });
        }
    }

    /// <summary>
    /// Vérifie si la colonne FileData existe dans la table Documents
    /// </summary>
    [HttpGet("check-schema")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckSchema()
    {
        try
        {
            var sql = @"
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'Documents'
                ORDER BY ordinal_position";
            
            var columns = new List<object>();
            await using var conn = _context.Database.GetDbConnection();
            await conn.OpenAsync();
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = sql;
            
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                columns.Add(new {
                    columnName = reader.GetString(0),
                    dataType = reader.GetString(1),
                    isNullable = reader.GetString(2)
                });
            }
            
            var hasFileData = columns.Any(c => ((dynamic)c).columnName == "FileData");
            
            return Ok(new {
                hasFileDataColumn = hasFileData,
                columns = columns
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking schema");
            return StatusCode(500, new { 
                message = "Error checking schema",
                error = ex.Message 
            });
        }
    }
}

public class TestScannerRequest
{
    public string? Ip { get; set; }
    public int? Port { get; set; }
}

public class ScannerInfo
{
    public string Ip { get; set; } = string.Empty;
    public int Port { get; set; }
    public string Status { get; set; } = "unknown";
    public string Name { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
