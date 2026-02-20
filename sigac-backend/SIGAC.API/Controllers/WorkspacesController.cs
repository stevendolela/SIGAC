using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

/// <summary>
/// Controller pour la gestion des workspaces (organisations)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkspacesController : ControllerBase
{
    private readonly IWorkspaceService _workspaceService;

    public WorkspacesController(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    /// <summary>
    /// Créer un nouveau workspace
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<WorkspaceDto>> CreateWorkspace([FromBody] CreateWorkspaceDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var workspace = await _workspaceService.CreateWorkspaceAsync(dto, userId);
        return CreatedAtAction(nameof(GetWorkspace), new { id = workspace.Id }, workspace);
    }

    /// <summary>
    /// Récupérer tous les workspaces de l'utilisateur connecté
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<WorkspaceDto>>> GetUserWorkspaces()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var workspaces = await _workspaceService.GetUserWorkspacesAsync(userId);
        return Ok(workspaces);
    }

    /// <summary>
    /// Récupérer un workspace par ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<WorkspaceDto>> GetWorkspace(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        try
        {
            var workspace = await _workspaceService.GetWorkspaceByIdAsync(id, userId);
            return Ok(workspace);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Récupérer un workspace par slug
    /// </summary>
    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<WorkspaceDto>> GetWorkspaceBySlug(string slug)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        try
        {
            var workspace = await _workspaceService.GetWorkspaceBySlugAsync(slug, userId);
            return Ok(workspace);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Mettre à jour un workspace
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<WorkspaceDto>> UpdateWorkspace(Guid id, [FromBody] UpdateWorkspaceDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        try
        {
            var workspace = await _workspaceService.UpdateWorkspaceAsync(id, dto, userId);
            return Ok(workspace);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Supprimer un workspace (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWorkspace(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        try
        {
            await _workspaceService.DeleteWorkspaceAsync(id, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Récupérer tous les membres d'un workspace
    /// </summary>
    [HttpGet("{id}/members")]
    public async Task<ActionResult<List<WorkspaceMemberDto>>> GetMembers(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        try
        {
            var members = await _workspaceService.GetWorkspaceMembersAsync(id, userId);
            return Ok(members);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Ajouter un membre au workspace
    /// </summary>
    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddWorkspaceMemberDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var userRoleStr = User.FindFirst(ClaimTypes.Role)?.Value;
        var userRole = Enum.TryParse<UserRole>(userRoleStr, out var role) ? role : (UserRole?)null;
        
        try
        {
            await _workspaceService.AddMemberAsync(id, dto, userId, userRole);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            // Log l'erreur pour debug
            Console.WriteLine($"[AddMember] Exception: {ex.GetType().Name}: {ex.Message}");
            Console.WriteLine($"[AddMember] StackTrace: {ex.StackTrace}");
            var innerMessage = ex.InnerException?.Message ?? "No inner exception";
            var innerInner = ex.InnerException?.InnerException?.Message ?? "No inner-inner exception";
            Console.WriteLine($"[AddMember] InnerException: {innerMessage}");
            Console.WriteLine($"[AddMember] InnerInnerException: {innerInner}");
            return StatusCode(500, new { 
                message = "Erreur serveur lors de l'ajout du membre", 
                detail = ex.Message,
                inner = innerMessage,
                innerInner = innerInner
            });
        }
    }

    /// <summary>
    /// Mettre à jour le rôle d'un membre
    /// </summary>
    [HttpPut("{id}/members/{memberId}/role")]
    public async Task<IActionResult> UpdateMemberRole(Guid id, Guid memberId, [FromBody] UpdateMemberRoleDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        try
        {
            await _workspaceService.UpdateMemberRoleAsync(id, memberId, dto.Role, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retirer un membre du workspace
    /// </summary>
    [HttpDelete("{id}/members/{memberId}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid memberId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        try
        {
            await _workspaceService.RemoveMemberAsync(id, memberId, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Vérifier si l'utilisateur a les permissions requises
    /// </summary>
    [HttpGet("{id}/permissions/{role}")]
    public async Task<ActionResult<bool>> CheckPermission(Guid id, WorkspaceRole role)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var hasPermission = await _workspaceService.HasPermissionAsync(id, userId, role);
        return Ok(new { hasPermission });
    }

    /// <summary>
    /// Récupérer le rôle de l'utilisateur dans un workspace
    /// </summary>
    [HttpGet("{id}/my-role")]
    public async Task<ActionResult<WorkspaceRole?>> GetMyRole(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var role = await _workspaceService.GetUserRoleAsync(id, userId);
        
        if (role == null)
        {
            return NotFound(new { message = "Vous n'êtes pas membre de ce workspace" });
        }
        
        return Ok(new { role });
    }
}
