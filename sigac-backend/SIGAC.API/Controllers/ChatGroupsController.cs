using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;
using SIGAC.Core.Services;

namespace SIGAC.API.Controllers;

/// <summary>
/// API pour gérer les groupes de chat
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatGroupsController : ControllerBase
{
    private readonly IChatGroupService _groupService;

    public ChatGroupsController(IChatGroupService groupService)
    {
        _groupService = groupService;
    }

    /// <summary>
    /// Crée un nouveau groupe de chat
    /// </summary>
    [HttpPost("create")]
    public async Task<ActionResult<ChatGroupDto>> CreateGroup([FromBody] CreateChatGroupDto dto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            var group = await _groupService.CreateGroupAsync(dto, parsedUserId);
            return Ok(new { success = true, data = group, message = "Groupe créé avec succès" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Obtient tous les groupes de l'utilisateur connecté
    /// </summary>
    [HttpGet("my-groups")]
    public async Task<ActionResult<IEnumerable<ChatGroupDto>>> GetMyGroups()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            var groups = await _groupService.GetUserGroupsAsync(parsedUserId);
            return Ok(new { success = true, data = groups });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Obtient les détails d'un groupe de chat avec tous ses messages et membres
    /// </summary>
    [HttpGet("{groupId}")]
    public async Task<ActionResult<ChatGroupDetailDto>> GetGroupDetail([FromRoute] Guid groupId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            var group = await _groupService.GetGroupDetailAsync(groupId, parsedUserId);
            if (group == null)
                return NotFound(new { success = false, message = "Groupe non trouvé" });

            return Ok(new { success = true, data = group });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Ajoute un message à un groupe
    /// </summary>
    [HttpPost("messages")]
    public async Task<ActionResult<GroupMessageDto>> SendGroupMessage([FromBody] CreateGroupMessageDto dto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            var message = await _groupService.AddMessageAsync(dto, parsedUserId);
            return Ok(new { success = true, data = message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Ajoute un membre à un groupe
    /// </summary>
    [HttpPost("{groupId}/members")]
    public async Task<ActionResult> AddMember([FromRoute] Guid groupId, [FromBody] AddGroupMemberDto dto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            await _groupService.AddMemberAsync(groupId, dto.UserId, parsedUserId);
            return Ok(new { success = true, message = "Membre ajouté avec succès" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Supprime un membre d'un groupe
    /// </summary>
    [HttpDelete("{groupId}/members/{memberId}")]
    public async Task<ActionResult> RemoveMember([FromRoute] Guid groupId, [FromRoute] Guid memberId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            await _groupService.RemoveMemberAsync(groupId, memberId, parsedUserId);
            return Ok(new { success = true, message = "Membre supprimé avec succès" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Supprime un groupe de chat
    /// </summary>
    [HttpDelete("{groupId}")]
    public async Task<ActionResult> DeleteGroup([FromRoute] Guid groupId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            await _groupService.DeleteGroupAsync(groupId, parsedUserId);
            return Ok(new { success = true, message = "Groupe supprimé avec succès" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}
