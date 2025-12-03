using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

[ApiController]
[Route("api/system")]
[Authorize(Roles = nameof(UserRole.Administrateur))]
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
}
