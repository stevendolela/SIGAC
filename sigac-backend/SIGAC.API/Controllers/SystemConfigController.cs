using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

[ApiController]
[Route("api/system")]
[Authorize(Roles = nameof(UserRole.Admin))]
public class SystemConfigController : ControllerBase
{
    private readonly ISystemConfigService _systemConfigService;
    private readonly ILogger<SystemConfigController> _logger;

    public SystemConfigController(
        ISystemConfigService systemConfigService,
        ILogger<SystemConfigController> logger)
    {
        _systemConfigService = systemConfigService;
        _logger = logger;
    }

    /// <summary>
    /// Récupère la configuration SMTP actuelle
    /// </summary>
    [HttpGet("smtp-config")]
    [ProducesResponseType(typeof(SmtpConfigurationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSmtpConfiguration()
    {
        try
        {
            var config = await _systemConfigService.GetSmtpConfigurationAsync();
            
            if (config == null)
                return NotFound(new { message = "Aucune configuration SMTP trouvée" });

            return Ok(config);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de la configuration SMTP");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Met à jour la configuration SMTP
    /// </summary>
    [HttpPut("smtp-config")]
    [ProducesResponseType(typeof(SmtpConfigurationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateSmtpConfiguration([FromBody] UpdateSmtpConfigurationDto dto)
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr))
                return Unauthorized();

            var userId = Guid.Parse(userIdStr);

            var config = await _systemConfigService.UpdateSmtpConfigurationAsync(dto, userId);

            _logger.LogInformation(
                "Configuration SMTP mise à jour par l'utilisateur {UserId}",
                userId);

            return Ok(config);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la mise à jour de la configuration SMTP");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Teste la connexion SMTP avec les paramètres fournis
    /// </summary>
    [HttpPost("smtp-config/test")]
    [ProducesResponseType(typeof(SmtpTestResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> TestSmtpConnection([FromBody] TestSmtpConnectionDto dto)
    {
        try
        {
            var result = await _systemConfigService.TestSmtpConnectionAsync(dto);

            _logger.LogInformation(
                "Test de connexion SMTP effectué: {Success} pour {Host}:{Port}",
                result.Success, dto.Host, dto.Port);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors du test de connexion SMTP");
            return Ok(new SmtpTestResultDto
            {
                Success = false,
                Message = "Erreur lors du test",
                ErrorDetails = ex.Message,
                TestedAt = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Récupère les informations système et de l'API
    /// Endpoint ADMIN ONLY
    /// </summary>
    [HttpGet("info")]
    [ProducesResponseType(typeof(SystemInfoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetSystemInfo()
    {
        try
        {
            var info = await _systemConfigService.GetSystemInfoAsync();
            
            _logger.LogInformation("Admin a accédé aux informations système");
            
            return Ok(info);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des infos système");
            return StatusCode(500, new { message = "Erreur lors de la récupération des informations système" });
        }
    }

    /// <summary>
    /// Vérifie le statut de la base de données
    /// Endpoint ADMIN ONLY
    /// </summary>
    [HttpGet("database-status")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDatabaseStatus()
    {
        try
        {
            var status = await _systemConfigService.GetDatabaseStatusAsync();
            return Ok(new { status });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la vérification du statut de la BD");
            return StatusCode(500, new { message = "Erreur lors de la vérification du statut" });
        }
    }

    /// <summary>
    /// Récupère le logo système actuel
    /// </summary>
    [HttpGet("logo")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSystemLogo()
    {
        try
        {
            var logo = await _systemConfigService.GetSystemLogoAsync();
            return Ok(new { logoBase64 = logo });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération du logo système");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Met à jour le logo système
    /// Endpoint ADMIN ONLY
    /// </summary>
    [HttpPut("logo")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateSystemLogo([FromBody] UpdateLogoDto dto)
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr))
                return Unauthorized();

            var userId = Guid.Parse(userIdStr);

            if (string.IsNullOrWhiteSpace(dto.LogoBase64))
                return BadRequest(new { message = "Le logo ne peut pas être vide" });

            var logo = await _systemConfigService.UpdateSystemLogoAsync(dto.LogoBase64, userId);

            _logger.LogInformation(
                "Logo système mis à jour par l'utilisateur {UserId}",
                userId);

            return Ok(new { logoBase64 = logo });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la mise à jour du logo système");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Supprime le logo système (retour au logo par défaut)
    /// Endpoint ADMIN ONLY
    /// </summary>
    [HttpDelete("logo")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteSystemLogo()
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr))
                return Unauthorized();

            var userId = Guid.Parse(userIdStr);

            await _systemConfigService.DeleteSystemLogoAsync(userId);

            _logger.LogInformation(
                "Logo système supprimé par l'utilisateur {UserId}",
                userId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la suppression du logo système");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }
}
