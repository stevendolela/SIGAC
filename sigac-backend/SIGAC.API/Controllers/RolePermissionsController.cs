using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

/// <summary>
/// API Controller pour gérer les permissions d'accès aux modules par rôle
/// Accessible uniquement aux administrateurs
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RolePermissionsController : ControllerBase
{
    private readonly IRoleModulePermissionService _service;
    private readonly ILogger<RolePermissionsController> _logger;

    public RolePermissionsController(
        IRoleModulePermissionService service,
        ILogger<RolePermissionsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Récupère la matrice complète des permissions (tous les rôles x tous les modules)
    /// </summary>
    [HttpGet("matrix")]
    [ProducesResponseType(typeof(PermissionsMatrixDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PermissionsMatrixDto>> GetPermissionsMatrix([FromQuery] Guid? workspaceId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            // Vérifier que l'utilisateur est admin
            if (userRole != UserRole.Admin)
            {
                return Forbid("Accès administrateur requis");
            }

            var matrix = await _service.GetPermissionsMatrixAsync(workspaceId);
            return Ok(matrix);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de la matrice des permissions");
            return StatusCode(500, new { error = "InternalServerError", message = ex.Message });
        }
    }

    /// <summary>
    /// Récupère les permissions pour un rôle spécifique
    /// </summary>
    [HttpGet("roles/{role}")]
    [ProducesResponseType(typeof(List<RoleModulePermissionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<RoleModulePermissionDto>>> GetByRole(
        string role,
        [FromQuery] Guid? workspaceId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            if (userRole != UserRole.Admin)
                return Forbid("Accès administrateur requis");

            if (!Enum.TryParse<UserRole>(role, out var roleEnum))
                return BadRequest($"Rôle invalide: {role}");

            var permissions = await _service.GetByRoleAsync(roleEnum, workspaceId);
            return Ok(permissions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des permissions du rôle {Role}", role);
            return StatusCode(500, new { error = "InternalServerError", message = ex.Message });
        }
    }

    /// <summary>
    /// Récupère la permission pour un rôle-module spécifique
    /// </summary>
    [HttpGet("roles/{role}/modules/{moduleKey}")]
    [ProducesResponseType(typeof(RoleModulePermissionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleModulePermissionDto>> GetPermission(
        string role,
        string moduleKey,
        [FromQuery] Guid? workspaceId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            if (userRole != UserRole.Admin)
                return Forbid("Accès administrateur requis");

            if (!Enum.TryParse<UserRole>(role, out var roleEnum))
                return BadRequest($"Rôle invalide: {role}");

            var permission = await _service.GetPermissionAsync(roleEnum, moduleKey, workspaceId);
            if (permission == null)
                return NotFound();

            return Ok(permission);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de la permission");
            return StatusCode(500, new { error = "InternalServerError", message = ex.Message });
        }
    }

    /// <summary>
    /// Vérifie si un rôle a accès à un module
    /// </summary>
    [HttpGet("check-access")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> CheckAccess(
        [FromQuery] string role,
        [FromQuery] string moduleKey,
        [FromQuery] Guid? workspaceId = null)
    {
        try
        {
            if (!Enum.TryParse<UserRole>(role, out var roleEnum))
                return BadRequest($"Rôle invalide: {role}");

            var hasAccess = await _service.HasAccessAsync(roleEnum, moduleKey, workspaceId);
            return Ok(hasAccess);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la vérification d'accès");
            return StatusCode(500, new { error = "InternalServerError", message = ex.Message });
        }
    }

    /// <summary>
    /// Met à jour la permission pour un rôle-module spécifique
    /// </summary>
    [HttpPut("roles/{role}/modules/{moduleKey}")]
    [ProducesResponseType(typeof(RoleModulePermissionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<RoleModulePermissionDto>> UpdatePermission(
        string role,
        string moduleKey,
        [FromBody] UpdateRoleModulePermissionDto dto,
        [FromQuery] Guid? workspaceId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            if (userRole != UserRole.Admin)
                return Forbid("Accès administrateur requis");

            if (!Enum.TryParse<UserRole>(role, out var roleEnum))
                return BadRequest($"Rôle invalide: {role}");

            var updated = await _service.UpdatePermissionAsync(roleEnum, moduleKey, dto, userId, workspaceId);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la mise à jour de la permission");
            return StatusCode(500, new { error = "InternalServerError", message = ex.Message });
        }
    }

    /// <summary>
    /// Met à jour plusieurs permissions en batch
    /// </summary>
    [HttpPut("batch")]
    [ProducesResponseType(typeof(List<RoleModulePermissionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<RoleModulePermissionDto>>> UpdateBatch(
        [FromBody] UpdatePermissionsBatchDto dto,
        [FromQuery] Guid? workspaceId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            if (userRole != UserRole.Admin)
                return Forbid("Accès administrateur requis");

            var updates = new List<(UserRole, string, UpdateRoleModulePermissionDto)>();
            foreach (var item in dto.Updates)
            {
                if (Enum.TryParse<UserRole>(item.Role, out var roleEnum))
                {
                    updates.Add((roleEnum, item.ModuleKey, item.Permission));
                }
            }

            var results = await _service.UpdateBatchAsync(updates, userId, workspaceId);
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la mise à jour batch des permissions");
            return StatusCode(500, new { error = "InternalServerError", message = ex.Message });
        }
    }

    /// <summary>
    /// Initialise les permissions par défaut pour tous les rôles
    /// </summary>
    [HttpPost("initialize-defaults")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> InitializeDefaults([FromQuery] Guid? workspaceId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            if (userRole != UserRole.Admin)
                return Forbid("Accès administrateur requis");

            await _service.InitializeDefaultPermissionsAsync(workspaceId);
            return Ok(new { message = "Permissions par défaut initialisées avec succès" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de l'initialisation des permissions par défaut");
            return StatusCode(500, new { error = "InternalServerError", message = ex.Message });
        }
    }

    /// <summary>
    /// Exporte la matrice des permissions en JSON
    /// </summary>
    [HttpGet("export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<string>> ExportMatrix([FromQuery] Guid? workspaceId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            if (userRole != UserRole.Admin)
                return Forbid("Accès administrateur requis");

            var json = await _service.ExportMatrixAsJsonAsync(workspaceId);
            return Ok(new { json });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de l'export de la matrice");
            return StatusCode(500, new { error = "InternalServerError", message = ex.Message });
        }
    }

    /// <summary>
    /// Importe les permissions depuis un JSON (backup/restore)
    /// </summary>
    [HttpPost("import")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> ImportMatrix(
        [FromBody] ImportMatrixDto dto,
        [FromQuery] Guid? workspaceId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            if (userRole != UserRole.Admin)
                return Forbid("Accès administrateur requis");

            await _service.ImportMatrixFromJsonAsync(dto.Json, userId, workspaceId);
            return Ok(new { message = "Matrice de permissions importée avec succès" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de l'import de la matrice");
            return StatusCode(500, new { error = "InternalServerError", message = ex.Message });
        }
    }

    // Helpers
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    private UserRole GetCurrentUserRole()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        return Enum.TryParse<UserRole>(roleClaim, out var role) ? role : UserRole.Consultant;
    }
}

// DTOs pour les requests
public class UpdatePermissionsBatchDto
{
    public List<BatchUpdateItem> Updates { get; set; } = new();
}

public class BatchUpdateItem
{
    public string Role { get; set; } = string.Empty;
    public string ModuleKey { get; set; } = string.Empty;
    public UpdateRoleModulePermissionDto Permission { get; set; } = new();
}

public class ImportMatrixDto
{
    public string Json { get; set; } = string.Empty;
}
