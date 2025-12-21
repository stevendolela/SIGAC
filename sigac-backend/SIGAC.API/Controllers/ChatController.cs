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

    /// <summary>
    /// Upload une pièce jointe dans une conversation
    /// </summary>
    [HttpPost("conversations/{conversationId}/attachments")]
    public async Task<ActionResult<ChatAttachmentDto>> UploadAttachment(
        [FromRoute] Guid conversationId,
        [FromForm] IFormFile file,
        [FromForm] bool isVoiceNote = false,
        [FromForm] int? durationSeconds = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            var attachment = await _chatService.UploadAttachmentAsync(conversationId, file, isVoiceNote, durationSeconds, parsedUserId);
            return Ok(new { success = true, data = attachment });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
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
    /// Upload une pièce jointe dans un groupe
    /// </summary>
    [HttpPost("groups/{chatGroupId}/attachments")]
    public async Task<ActionResult<ChatAttachmentDto>> UploadGroupAttachment(
        [FromRoute] Guid chatGroupId,
        [FromForm] IFormFile file,
        [FromForm] bool isVoiceNote = false,
        [FromForm] int? durationSeconds = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            var attachment = await _chatService.UploadGroupAttachmentAsync(chatGroupId, file, isVoiceNote, durationSeconds, parsedUserId);
            return Ok(new { success = true, data = attachment });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
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
    /// Télécharge une pièce jointe
    /// </summary>
    [HttpGet("attachments/{attachmentId}/download")]
    public async Task<IActionResult> DownloadAttachment([FromRoute] Guid attachmentId)
    {
        try
        {
            Console.WriteLine($"[DOWNLOAD] Tentative téléchargement attachment: {attachmentId}");
            
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
            {
                Console.WriteLine($"[DOWNLOAD] Échec parse userId: {userId}");
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });
            }

            Console.WriteLine($"[DOWNLOAD] UserId: {parsedUserId}, AttachmentId: {attachmentId}");
            var (fileData, fileName, mimeType) = await _chatService.DownloadAttachmentAsync(attachmentId, parsedUserId);
            Console.WriteLine($"[DOWNLOAD] Succès! File: {fileName}, Size: {fileData.Length} bytes, MimeType: {mimeType}");
            return File(fileData, mimeType, fileName);
        }
        catch (KeyNotFoundException ex)
        {
            Console.WriteLine($"[DOWNLOAD] KeyNotFoundException: {ex.Message}");
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            Console.WriteLine($"[DOWNLOAD] UnauthorizedAccessException: {ex.Message}");
            return Forbid();
        }
        catch (FileNotFoundException ex)
        {
            Console.WriteLine($"[DOWNLOAD] FileNotFoundException: {ex.Message}");
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Supprime une pièce jointe
    /// </summary>
    [HttpDelete("attachments/{attachmentId}")]
    public async Task<ActionResult> DeleteAttachment([FromRoute] Guid attachmentId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userId, out var parsedUserId))
                return Unauthorized(new { success = false, message = "Utilisateur invalide" });

            await _chatService.DeleteAttachmentAsync(attachmentId, parsedUserId);
            return Ok(new { success = true, message = "Pièce jointe supprimée avec succès" });
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
