using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

/// <summary>
/// Gestion des utilisateurs du système.
/// Endpoints pour créer, lire, modifier et supprimer des utilisateurs.
/// Nécessite l'authentification et les rôles appropriés.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IAuthService _authService;
    private readonly IUserRepository _userRepository;
    private readonly IEmailNotificationService _emailNotificationService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IUserService userService,
        IAuthService authService,
        IUserRepository userRepository,
        IEmailNotificationService emailNotificationService,
        ILogger<UsersController> logger)
    {
        _userService = userService;
        _authService = authService;
        _userRepository = userRepository;
        _emailNotificationService = emailNotificationService;
        _logger = logger;
    }

    /// <summary>
    /// Récupère la liste paginée des utilisateurs.
    /// Filtrage par recherche (username/email) optionnel.
    /// </summary>
    /// <param name="page">Numéro de page (défaut: 1)</param>
    /// <param name="pageSize">Taille de page (défaut: 10, max: 100)</param>
    /// <param name="search">Recherche par username ou email (optionnel)</param>
    /// <returns>Liste paginée des utilisateurs</returns>
    /// <response code="200">Liste récupérée avec succès</response>
    /// <response code="401">Non authentifié</response>
    /// <response code="403">Permission insuffisante</response>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PaginatedResult<UserDto>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        try
        {
            // Normaliser la pagination
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var result = await _userService.GetUsersAsync(page, pageSize, search);
            
            _logger.LogInformation(
                "Utilisateur {UserId} a consulté la liste des utilisateurs (page {Page}, pageSize {PageSize}, search: {Search})",
                GetCurrentUserId(), page, pageSize, search ?? "none");

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de la liste des utilisateurs");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Récupère les détails d'un utilisateur spécifique.
    /// </summary>
    /// <param name="id">ID de l'utilisateur</param>
    /// <returns>Détails de l'utilisateur</returns>
    /// <response code="200">Utilisateur trouvé</response>
    /// <response code="401">Non authentifié</response>
    /// <response code="404">Utilisateur non trouvé</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetUserById(Guid id)
    {
        try
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
            {
                _logger.LogWarning("Tentative d'accès à un utilisateur inexistant: {UserId}", id);
                return NotFound(new { message = "Utilisateur non trouvé" });
            }

            _logger.LogInformation(
                "Utilisateur {CurrentUserId} a consulté le profil de {UserId}",
                GetCurrentUserId(), id);

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de l'utilisateur {UserId}", id);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Récupère le profil de l'utilisateur actuellement authentifié.
    /// </summary>
    /// <returns>Profil de l'utilisateur courant</returns>
    /// <response code="200">Profil récupéré</response>
    /// <response code="401">Non authentifié</response>
    [HttpGet("profile/current")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        try
        {
            var userId = GetCurrentUserId();
            var user = await _userService.GetByIdAsync(userId);
            
            if (user == null)
            {
                _logger.LogWarning("Utilisateur courant {UserId} introuvable", userId);
                return StatusCode(500, new { message = "Erreur: utilisateur non trouvé" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération du profil courant");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Crée un nouvel utilisateur.
    /// Réservé aux administrateurs.
    /// </summary>
    /// <param name="createUserDto">Données de création d'utilisateur</param>
    /// <returns>Utilisateur créé</returns>
    /// <response code="201">Utilisateur créé avec succès</response>
    /// <response code="400">Données invalides (username/email déjà existant, etc.)</response>
    /// <response code="401">Non authentifié</response>
    /// <response code="403">Permission insuffisante (admin requis)</response>
    [HttpPost]
    [Authorize(Roles = "Administrateur")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto createUserDto)
    {
        try
        {
            // Validation basique
            if (string.IsNullOrWhiteSpace(createUserDto.Username))
                return BadRequest(new { message = "Username requis" });

            if (string.IsNullOrWhiteSpace(createUserDto.Email))
                return BadRequest(new { message = "Email requis" });

            if (string.IsNullOrWhiteSpace(createUserDto.Password))
                return BadRequest(new { message = "Password requis" });

            // Vérifier que l'username n'existe pas
            var existingUser = await _userService.GetByUsernameAsync(createUserDto.Username);
            if (existingUser != null)
                return BadRequest(new { message = "Cet username est déjà utilisé" });

            // Hash du password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password);

            var newUser = await _userService.CreateUserAsync(
                createUserDto.Username,
                createUserDto.Email,
                passwordHash,
                createUserDto.Role,
                GetCurrentUserId(),
                createUserDto.NomComplet,
                createUserDto.Matricule);

            // Envoi email de bienvenue avec le mot de passe temporaire
            var userEntity = await _userRepository.GetByIdAsync(newUser.Id);
            if (userEntity != null)
            {
                await _emailNotificationService.SendWelcomeEmailAsync(userEntity, createUserDto.Password);
            }

            _logger.LogInformation(
                "Utilisateur {AdminId} a créé un nouvel utilisateur: {NewUserId} ({Username})",
                GetCurrentUserId(), newUser.Id, newUser.Username);

            return CreatedAtAction(nameof(GetUserById), new { id = newUser.Id }, newUser);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la création d'utilisateur");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Modifie un utilisateur existant.
    /// Réservé aux administrateurs (sauf pour modifier son propre profil).
    /// </summary>
    /// <param name="id">ID de l'utilisateur à modifier</param>
    /// <param name="updateUserDto">Données de modification</param>
    /// <returns>Utilisateur modifié</returns>
    /// <response code="200">Utilisateur modifié avec succès</response>
    /// <response code="400">Données invalides</response>
    /// <response code="401">Non authentifié</response>
    /// <response code="403">Permission insuffisante</response>
    /// <response code="404">Utilisateur non trouvé</response>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> UpdateUser(
        Guid id,
        [FromBody] UpdateUserDto updateUserDto)
    {
        try
        {
            // Vérifier que l'utilisateur existe
            var existingUser = await _userService.GetByIdAsync(id);
            if (existingUser == null)
                return NotFound(new { message = "Utilisateur non trouvé" });

            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            // Vérifier les permissions: admin ou propriétaire du profil
            if (currentUserId != id && currentUserRole != UserRole.Administrateur)
                return Forbid();

            // Si non-admin, ne peut pas changer son propre rôle
            if (currentUserRole != UserRole.Administrateur && updateUserDto.Role.HasValue)
                return BadRequest(new { message = "Vous ne pouvez pas modifier votre propre rôle" });

            var updated = await _userService.UpdateUserAsync(
                id,
                updateUserDto.Email,
                updateUserDto.Role,
                updateUserDto.NomComplet,
                updateUserDto.IsActive,
                updateUserDto.Matricule,
                currentUserId);

            if (!updated)
                return StatusCode(500, new { message = "Erreur lors de la mise à jour" });

            var updatedUser = await _userService.GetByIdAsync(id);

            _logger.LogInformation(
                "Utilisateur {CurrentUserId} a modifié l'utilisateur {UserId}",
                currentUserId, id);

            return Ok(updatedUser);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la modification de l'utilisateur {UserId}", id);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Liste tous les juges constitutionnels actifs.
    /// </summary>
    /// <returns>Liste des juges</returns>
    /// <response code="200">Liste récupérée</response>
    /// <response code="401">Non authentifié</response>
    [HttpGet("juges")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<UserDto>>> GetJuges()
    {
        try
        {
            var juges = await _userService.GetJugesAsync();
            _logger.LogInformation("Utilisateur {UserId} a récupéré la liste des juges ({Count})", GetCurrentUserId(), juges.Count);
            return Ok(juges);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des juges");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Supprime un utilisateur.
    /// Réservé aux administrateurs.
    /// </summary>
    /// <param name="id">ID de l'utilisateur à supprimer</param>
    /// <returns>Pas de contenu</returns>
    /// <response code="204">Utilisateur supprimé avec succès</response>
    /// <response code="401">Non authentifié</response>
    /// <response code="403">Permission insuffisante (admin requis)</response>
    /// <response code="404">Utilisateur non trouvé</response>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrateur")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        try
        {
            // Vérifier que l'utilisateur existe
            var existingUser = await _userService.GetByIdAsync(id);
            if (existingUser == null)
                return NotFound(new { message = "Utilisateur non trouvé" });

            // Empêcher la suppression du propriétaire du compte
            var currentUserId = GetCurrentUserId();
            if (currentUserId == id)
                return BadRequest(new { message = "Vous ne pouvez pas supprimer votre propre compte" });

            var deleted = await _userService.DeleteUserAsync(id, currentUserId);

            if (!deleted)
                return StatusCode(500, new { message = "Erreur lors de la suppression" });

            _logger.LogInformation(
                "Utilisateur {AdminId} a supprimé l'utilisateur {UserId}",
                currentUserId, id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la suppression de l'utilisateur {UserId}", id);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Change le password de l'utilisateur courant.
    /// </summary>
    /// <param name="changePasswordDto">Ancien et nouveau password</param>
    /// <returns>Message de succès</returns>
    /// <response code="200">Password modifié avec succès</response>
    /// <response code="400">Ancien password incorrect ou données invalides</response>
    /// <response code="401">Non authentifié</response>
    [HttpPost("change-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(changePasswordDto.OldPassword))
                return BadRequest(new { message = "Ancien password requis" });

            if (string.IsNullOrWhiteSpace(changePasswordDto.NewPassword))
                return BadRequest(new { message = "Nouveau password requis" });

            if (changePasswordDto.OldPassword == changePasswordDto.NewPassword)
                return BadRequest(new { message = "Le nouveau password doit être différent de l'ancien" });

            if (changePasswordDto.NewPassword != changePasswordDto.ConfirmPassword)
                return BadRequest(new { message = "Les passwords ne correspondent pas" });

            if (changePasswordDto.NewPassword.Length < 8)
                return BadRequest(new { message = "Le password doit contenir au minimum 8 caractères" });

            var userId = GetCurrentUserId();

            var changed = await _userService.ChangePasswordAsync(
                userId,
                changePasswordDto.OldPassword,
                changePasswordDto.NewPassword,
                userId);

            if (!changed)
                return BadRequest(new { message = "Ancien password incorrect" });

            _logger.LogInformation("Utilisateur {UserId} a changé son password", userId);

            return Ok(new { message = "Password modifié avec succès" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors du changement de password");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Désactive un utilisateur (soft delete).
    /// Réservé aux administrateurs.
    /// </summary>
    /// <param name="id">ID de l'utilisateur à désactiver</param>
    /// <returns>Utilisateur désactivé</returns>
    /// <response code="200">Utilisateur désactivé avec succès</response>
    /// <response code="401">Non authentifié</response>
    /// <response code="403">Permission insuffisante (admin requis)</response>
    /// <response code="404">Utilisateur non trouvé</response>
    [HttpPost("{id}/deactivate")]
    [Authorize(Roles = "Administrateur")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> DeactivateUser(Guid id)
    {
        try
        {
            var existingUser = await _userService.GetByIdAsync(id);
            if (existingUser == null)
                return NotFound(new { message = "Utilisateur non trouvé" });

            var currentUserId = GetCurrentUserId();
            if (currentUserId == id)
                return BadRequest(new { message = "Vous ne pouvez pas désactiver votre propre compte" });

            // Désactiver via le service dédié
            var deactivated = await _userService.DeactivateUserAsync(id, currentUserId);

            if (!deactivated)
                return StatusCode(500, new { message = "Erreur lors de la désactivation" });

            var deactivatedUser = await _userService.GetByIdAsync(id);

            _logger.LogInformation(
                "Utilisateur {AdminId} a désactivé l'utilisateur {UserId}",
                currentUserId, id);

            return Ok(deactivatedUser);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la désactivation de l'utilisateur {UserId}", id);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Réactive un utilisateur désactivé.
    /// Réservé aux administrateurs.
    /// </summary>
    /// <param name="id">ID de l'utilisateur à réactiver</param>
    /// <returns>Utilisateur réactivé</returns>
    /// <response code="200">Utilisateur réactivé avec succès</response>
    /// <response code="401">Non authentifié</response>
    /// <response code="403">Permission insuffisante (admin requis)</response>
    /// <response code="404">Utilisateur non trouvé</response>
    [HttpPost("{id}/activate")]
    [Authorize(Roles = "Administrateur")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> ActivateUser(Guid id)
    {
        try
        {
            var existingUser = await _userService.GetByIdAsync(id);
            if (existingUser == null)
                return NotFound(new { message = "Utilisateur non trouvé" });

            var currentUserId = GetCurrentUserId();

            var activated = await _userService.ActivateUserAsync(id, currentUserId);

            if (!activated)
                return StatusCode(500, new { message = "Erreur lors de la réactivation" });

            var activatedUser = await _userService.GetByIdAsync(id);

            _logger.LogInformation(
                "Utilisateur {AdminId} a réactivé l'utilisateur {UserId}",
                currentUserId, id);

            return Ok(activatedUser);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la réactivation de l'utilisateur {UserId}", id);
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Obtient les statistiques de l'API (admin seulement).
    /// Nombre d'utilisateurs, de dossiers, etc.
    /// </summary>
    /// <returns>Statistiques système</returns>
    /// <response code="200">Statistiques récupérées</response>
    /// <response code="401">Non authentifié</response>
    /// <response code="403">Permission insuffisante (admin requis)</response>
    [HttpGet("admin/stats")]
    [Authorize(Roles = "Administrateur")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<object>> GetSystemStats()
    {
        try
        {
            var allUsers = await _userService.GetUsersAsync(1, 1000);
            var activeUsers = allUsers.Data.Count(u => u.IsActive);
            var inactiveUsers = allUsers.Data.Count(u => !u.IsActive);

            var stats = new
            {
                timestamp = DateTime.UtcNow,
                totalUsers = allUsers.Data.Count,
                activeUsers,
                inactiveUsers,
                usersByRole = allUsers.Data
                    .GroupBy(u => u.Role)
                    .Select(g => new { role = g.Key, count = g.Count() })
                    .ToList()
            };

            _logger.LogInformation("Utilisateur {AdminId} a consulté les statistiques système", GetCurrentUserId());

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des statistiques");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Upload d'avatar pour l'utilisateur connecté.
    /// </summary>
    /// <param name="file">Fichier image (max 2MB, formats: jpg, png, gif)</param>
    /// <returns>URL de l'avatar uploadé</returns>
    [HttpPost("avatar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<object>> UploadAvatar(IFormFile file)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            // Validation
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Aucun fichier fourni" });

            if (file.Length > 2 * 1024 * 1024) // 2MB
                return BadRequest(new { message = "Le fichier ne doit pas dépasser 2 MB" });

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest(new { message = "Format non autorisé. Utilisez jpg, png ou gif" });

            // Créer le répertoire si nécessaire
            var uploadsPath = Path.Combine("uploads", "avatars");
            Directory.CreateDirectory(uploadsPath);

            // Générer un nom unique
            var fileName = $"{userId}_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Sauvegarder le fichier
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Mettre à jour l'utilisateur
            var avatarUrl = $"/uploads/avatars/{fileName}";
            await _userService.UpdateAvatarAsync(userId, avatarUrl);

            _logger.LogInformation("Avatar uploadé pour l'utilisateur {UserId}: {AvatarUrl}", userId, avatarUrl);

            return Ok(new { avatarUrl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de l'upload de l'avatar");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    /// <summary>
    /// Mise à jour du profil de l'utilisateur connecté.
    /// </summary>
    /// <param name="dto">Données à mettre à jour</param>
    /// <returns>Profil utilisateur mis à jour</returns>
    [HttpPut("profile")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var updatedUser = await _userService.UpdateProfileAsync(userId, dto);

            _logger.LogInformation("Profil mis à jour pour l'utilisateur {UserId}", userId);

            return Ok(updatedUser);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la mise à jour du profil");
            return StatusCode(500, new { message = "Erreur interne du serveur" });
        }
    }

    // ===== Password management endpoints =====

    /// <summary>
    /// Admin: réinitialise le mot de passe d'un utilisateur.
    /// </summary>
    [HttpPost("admin/{id:guid}/reset-password")]
    [Authorize(Roles = nameof(UserRole.Administrateur))]
    public async Task<IActionResult> AdminResetPassword([FromRoute] Guid id, [FromBody] AdminResetPasswordDto dto)
    {
        var adminIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(adminIdStr)) return Unauthorized();
        var adminId = Guid.Parse(adminIdStr);

        // Forcer le UserId du DTO à partir de la route
        dto.UserId = id;
        await _userService.AdminResetPasswordAsync(dto, adminId);
        return NoContent();
    }

    /// <summary>
    /// Utilisateur: demande un changement de mot de passe (envoi d'un code 2FA).
    /// </summary>
    [HttpPost("password-change/request")]
    [Authorize]
    public async Task<IActionResult> RequestPasswordChange([FromBody] RequestPasswordChangeDto dto)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
        var userId = Guid.Parse(userIdStr);

        var result = await _userService.RequestPasswordChangeAsync(dto, userId);
        return Ok(result);
    }

    /// <summary>
    /// Utilisateur: vérifie le code 2FA et applique le nouveau mot de passe.
    /// </summary>
    [HttpPost("password-change/verify")]
    [Authorize]
    public async Task<IActionResult> VerifyPasswordChange([FromBody] VerifyPasswordChangeDto dto)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
        var userId = Guid.Parse(userIdStr);

        var ok = await _userService.VerifyPasswordChangeAsync(dto, userId);
        return ok ? NoContent() : BadRequest("Vérification du code échouée");
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
        return claim != null && Enum.TryParse<UserRole>(claim.Value, out var role) ? role : UserRole.Consultant;
    }

    #endregion
}
