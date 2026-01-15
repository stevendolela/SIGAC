using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.ExternalSources;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace SIGAC.API.Controllers;

/// <summary>
/// Contrôleur pour l'import de documents depuis des sources externes
/// FTP, HTTP, S3, SMB, etc.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExternalDocumentImportController : ControllerBase
{
    private readonly IExternalDocumentImportService _externalImportService;
    private readonly ILogger<ExternalDocumentImportController> _logger;

    public ExternalDocumentImportController(
        IExternalDocumentImportService externalImportService,
        ILogger<ExternalDocumentImportController> logger)
    {
        _externalImportService = externalImportService ?? throw new ArgumentNullException(nameof(externalImportService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Importe des documents depuis FTP
    /// </summary>
    /// <remarks>
    /// Exemple de requête:
    /// ```json
    /// {
    ///   "ftpConfig": {
    ///     "host": "ftp.example.com",
    ///     "port": 21,
    ///     "username": "user",
    ///     "password": "pass",
    ///     "useSsl": false,
    ///     "basePath": "/documents"
    ///   },
    ///   "importConfig": {
    ///     "sourcePath": "/dossiers",
    ///     "filePattern": ".*\\.pdf$",
    ///     "allowedExtensions": [".pdf", ".docx"],
    ///     "maxFileSizeMB": 100,
    ///     "dossierMappingStrategy": 1,
    ///     "defaultDocumentType": "Requête"
    ///   }
    /// }
    /// ```
    /// </remarks>
    [HttpPost("from-ftp")]
    [ProducesResponseType(typeof(ExternalImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ImportFromFtpAsync(
        [FromBody] FtpImportRequestDto request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
            var userRole = Enum.Parse<UserRole>(User.FindFirst(ClaimTypes.Role)?.Value ?? "Collaborateur");

            _logger.LogInformation($"[ExternalImport] Démarrage import FTP pour l'utilisateur {userId}");

            // Crée le provider FTP
            var ftpProvider = new FtpDocumentSourceProvider(
                request.FtpConfig.Host,
                request.FtpConfig.Port,
                request.FtpConfig.Username,
                request.FtpConfig.Password,
                request.FtpConfig.UseSftp,
                request.FtpConfig.BasePath);

            // Lance l'import
            var result = await _externalImportService.ImportFromSourceAsync(
                ftpProvider,
                request.ImportConfig,
                userId,
                userRole,
                cancellationToken);

            _logger.LogInformation(
                $"[ExternalImport] Import FTP complété: {result.DocumentsImported} documents, {result.DocumentsFailed} erreurs");

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning($"[ExternalImport] Accès refusé: {ex.Message}");
            return Forbid();
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("[ExternalImport] Import annulé");
            return BadRequest(new { message = "Import annulé par l'utilisateur" });
        }
        catch (Exception ex)
        {
            _logger.LogError($"[ExternalImport] Erreur FTP: {ex}");
            return StatusCode(500, new { message = $"Erreur lors de l'import: {ex.Message}" });
        }
    }

    /// <summary>
    /// Importe des documents depuis HTTP/HTTPS (URL)
    /// </summary>
    /// <remarks>
    /// Exemple pour un serveur web qui retourne une liste JSON:
    /// ```json
    /// {
    ///   "httpConfig": {
    ///     "baseUrl": "https://documents.example.com/api/files",
    ///     "headers": {
    ///       "Authorization": "Bearer token123"
    ///     },
    ///     "timeout": 300
    ///   },
    ///   "importConfig": {
    ///     "sourcePath": "/dossiers/2024",
    ///     "maxFileSizeMB": 250,
    ///     "dossierMappingStrategy": 2,
    ///     "dossierPatternRegex": "\\[([^\\]]+)\\]"
    ///   }
    /// }
    /// ```
    /// </remarks>
    [HttpPost("from-http")]
    [ProducesResponseType(typeof(ExternalImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ImportFromHttpAsync(
        [FromBody] HttpImportRequestDto request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
            var userRole = Enum.Parse<UserRole>(User.FindFirst(ClaimTypes.Role)?.Value ?? "Collaborateur");

            _logger.LogInformation($"[ExternalImport] Démarrage import HTTP pour l'utilisateur {userId}");

            // Convertir les millisecondes en secondes (par défaut 30 secondes)
            int timeoutSeconds = request.HttpConfig.Timeout.HasValue ? (request.HttpConfig.Timeout.Value / 1000) : 30;
            if (timeoutSeconds < 1) timeoutSeconds = 1;
            if (timeoutSeconds > 300) timeoutSeconds = 300; // Max 5 minutes

            // Crée le provider HTTP
            var httpProvider = new HttpDocumentSourceProvider(
                request.HttpConfig.BaseUrl,
                request.HttpConfig.Headers,
                timeoutSeconds);

            // Lance l'import
            var result = await _externalImportService.ImportFromSourceAsync(
                httpProvider,
                request.ImportConfig,
                userId,
                userRole,
                cancellationToken);

            _logger.LogInformation(
                $"[ExternalImport] Import HTTP complété: {result.DocumentsImported} documents, {result.DocumentsFailed} erreurs");

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning($"[ExternalImport] Accès refusé: {ex.Message}");
            return Forbid();
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("[ExternalImport] Import annulé");
            return BadRequest(new { message = "Import annulé par l'utilisateur" });
        }
        catch (Exception ex)
        {
            _logger.LogError($"[ExternalImport] Erreur HTTP: {ex}");
            return StatusCode(500, new { message = $"Erreur lors de l'import: {ex.Message}" });
        }
    }

    /// <summary>
    /// Teste la connexion à une source FTP
    /// </summary>
    [HttpPost("test-ftp-connection")]
    [ProducesResponseType(typeof(TestConnectionResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> TestFtpConnectionAsync(
        [FromBody] FtpConnectionConfigDto config,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var ftpProvider = new FtpDocumentSourceProvider(
                config.Host,
                config.Port,
                config.Username,
                config.Password,
                config.UseSftp,
                config.BasePath);

            var isConnected = await ftpProvider.TestConnectionAsync(cancellationToken);

            return Ok(new TestConnectionResponseDto
            {
                IsConnected = isConnected,
                SourceType = config.UseSftp ? "SFTP" : "FTP",
                Message = isConnected ? "Connexion réussie" : "Impossible de se connecter"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError($"[ExternalImport] Erreur test FTP: {ex}");
            return BadRequest(new { message = $"Erreur: {ex.Message}" });
        }
    }

    /// <summary>
    /// Teste la connexion à une source HTTP
    /// </summary>
    [HttpPost("test-http-connection")]
    [ProducesResponseType(typeof(TestConnectionResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> TestHttpConnectionAsync(
        [FromBody] HttpConnectionConfigDto config,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Convertir les millisecondes en secondes (par défaut 30 secondes)
            int timeoutSeconds = config.Timeout.HasValue ? (config.Timeout.Value / 1000) : 30;
            if (timeoutSeconds < 1) timeoutSeconds = 1;
            if (timeoutSeconds > 300) timeoutSeconds = 300; // Max 5 minutes

            var httpProvider = new HttpDocumentSourceProvider(
                config.BaseUrl,
                config.Headers,
                timeoutSeconds);

            var isConnected = await httpProvider.TestConnectionAsync(cancellationToken);

            return Ok(new TestConnectionResponseDto
            {
                IsConnected = isConnected,
                SourceType = "HTTP",
                Message = isConnected ? "Connexion réussie" : "Impossible de se connecter"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError($"[ExternalImport] Erreur test HTTP: {ex}");
            return BadRequest(new { message = $"Erreur: {ex.Message}" });
        }
    }
}

