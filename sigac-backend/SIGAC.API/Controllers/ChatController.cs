using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;

namespace SIGAC.API.Controllers;

/// <summary>
/// API pour gérer les conversations et messages de chat 1-to-1
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    /// <summary>
    /// Obtient toutes les conversations de l'utilisateur connecté
    /// </summary>
    [HttpGet("conversations")]
    public async Task<ActionResult<IEnumerable<ChatConversationDto>>> GetConversations()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            var conversations = await _chatService.GetConversationsAsync(parsedUserId);
            return Ok(new { success = true, data = conversations });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Obtient une conversation spécifique avec tous ses messages
    /// </summary>
    [HttpGet("conversations/{conversationId}")]
    public async Task<ActionResult<ChatConversationDetailDto>> GetConversation([FromRoute] Guid conversationId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            var conversation = await _chatService.GetConversationAsync(conversationId, parsedUserId);
            if (conversation == null)
                return NotFound(new { success = false, message = "Conversation non trouvée" });

            return Ok(new { success = true, data = conversation });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Crée ou récupère une conversation 1-to-1 avec un utilisateur
    /// </summary>
    [HttpPost("conversations")]
    public async Task<ActionResult<ChatConversationDto>> CreateConversation([FromBody] CreateChatConversationDto dto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            var conversation = await _chatService.GetOrCreateConversationAsync(dto.RecipientId, parsedUserId);
            return Ok(new { success = true, data = conversation });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Envoie un nouveau message dans une conversation
    /// </summary>
    [HttpPost("messages")]
    public async Task<ActionResult<MessageDto>> SendMessage([FromBody] CreateMessageDto dto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            var message = await _chatService.SendMessageAsync(dto, parsedUserId);
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
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Obtient le nombre total de messages non lus pour l'utilisateur
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            var count = await _chatService.GetUnreadCountAsync(parsedUserId);
            return Ok(new { success = true, data = count });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Supprime une conversation et tous ses messages
    /// </summary>
    [HttpDelete("conversations/{conversationId}")]
    public async Task<ActionResult> DeleteConversation([FromRoute] Guid conversationId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            await _chatService.DeleteConversationAsync(conversationId, parsedUserId);
            return Ok(new { success = true, message = "Conversation supprimée avec succès" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}
