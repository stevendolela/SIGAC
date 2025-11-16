using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;

namespace SIGAC.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Authentifie un utilisateur et retourne un JWT token
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto loginDto)
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

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

            var result = await _authService.LoginAsync(loginDto, ipAddress, userAgent);

            if (result == null)
            {
                _logger.LogWarning("Tentative de connexion échouée pour l'utilisateur {Username}", loginDto.Username);
                return Unauthorized(new 
                { 
                    error = "Unauthorized", 
                    message = "Nom d'utilisateur ou mot de passe incorrect" 
                });
            }

            _logger.LogInformation("Utilisateur {Username} connecté avec succès", loginDto.Username);

            // Debug: log token preview to help tests/debugging if empty
            try
            {
                var tok = result.Token ?? string.Empty;
                _logger.LogInformation("[AuthController] Token length: {Len}", tok.Length);
                _logger.LogInformation("[AuthController] Token preview: {Preview}", tok.Length > 50 ? tok.Substring(0, 50) : tok);
            }
            catch { }

            // Add a debug response header with token length (helps tests capture if token is empty)
            try
            {
                Response.Headers["X-Debug-Token-Length"] = (result.Token ?? string.Empty).Length.ToString();
            }
            catch { }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la connexion de l'utilisateur {Username}", loginDto.Username);
            // Écrire la pile d'exception sur la sortie standard pour faciliter le debugging dans les tests
            try { Console.Error.WriteLine(ex.ToString()); } catch { }
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }

    /// <summary>
    /// Renouvelle un token JWT expiré en utilisant un refresh token
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(RefreshTokenResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<RefreshTokenResponseDto>> RefreshToken([FromBody] RefreshTokenDto refreshDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new 
                { 
                    error = "ValidationError", 
                    message = "Token de rafraîchissement requis" 
                });
            }

            var result = await _authService.RefreshTokenAsync(refreshDto.RefreshToken);

            if (result == null)
            {
                _logger.LogWarning("Tentative de rafraîchissement avec un token invalide");
                return Unauthorized(new 
                { 
                    error = "Unauthorized", 
                    message = "Token de rafraîchissement invalide ou expiré" 
                });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors du rafraîchissement du token");
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }

    /// <summary>
    /// Déconnecte un utilisateur et invalide son refresh token
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenDto refreshDto)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                ?? throw new UnauthorizedAccessException());

            await _authService.LogoutAsync(userId, refreshDto.RefreshToken);

            _logger.LogInformation("Utilisateur {UserId} déconnecté", userId);

            return Ok(new { message = "Déconnexion réussie" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la déconnexion");
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }

    /// <summary>
    /// Change le mot de passe d'un utilisateur
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
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

            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                ?? throw new UnauthorizedAccessException());

            var result = await _authService.ChangePasswordAsync(
                userId, 
                changePasswordDto.OldPassword, 
                changePasswordDto.NewPassword
            );

            if (!result)
            {
                return BadRequest(new 
                { 
                    error = "ValidationError", 
                    message = "Mot de passe actuel incorrect" 
                });
            }

            _logger.LogInformation("Mot de passe changé pour l'utilisateur {UserId}", userId);

            return Ok(new { message = "Mot de passe modifié avec succès" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = "ValidationError", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors du changement de mot de passe");
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }

    /// <summary>
    /// Récupère les informations de l'utilisateur connecté
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                ?? throw new UnauthorizedAccessException());

            var user = await _authService.GetUserByIdAsync(userId);

            if (user == null)
            {
                return NotFound(new { error = "NotFound", message = "Utilisateur non trouvé" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des informations utilisateur");
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }

    /// <summary>
    /// Demande de réinitialisation de mot de passe (envoie un email)
    /// </summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto forgotPasswordDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new 
                { 
                    error = "ValidationError", 
                    message = "Email requis" 
                });
            }

            await _authService.ForgotPasswordAsync(forgotPasswordDto.Email);

            // Toujours retourner succès pour des raisons de sécurité
            // (ne pas révéler si l'email existe)
            return Ok(new 
            { 
                message = "Si cet email existe, un lien de réinitialisation a été envoyé" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la demande de réinitialisation de mot de passe");
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }

    /// <summary>
    /// Réinitialise le mot de passe avec un token
    /// </summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto resetPasswordDto)
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

            var result = await _authService.ResetPasswordAsync(
                resetPasswordDto.Token, 
                resetPasswordDto.NewPassword
            );

            if (!result)
            {
                return BadRequest(new 
                { 
                    error = "ValidationError", 
                    message = "Token invalide ou expiré" 
                });
            }

            _logger.LogInformation("Mot de passe réinitialisé avec succès");

            return Ok(new { message = "Mot de passe réinitialisé avec succès" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la réinitialisation du mot de passe");
            return StatusCode(500, new { error = "InternalServerError", message = "Une erreur est survenue" });
        }
    }
}