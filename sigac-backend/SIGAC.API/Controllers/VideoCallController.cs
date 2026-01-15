using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VideoCallController : ControllerBase
{
    private readonly IVideoCallService _videoCallService;

    public VideoCallController(IVideoCallService videoCallService)
    {
        _videoCallService = videoCallService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }

    /// <summary>
    /// Initier un appel vidéo
    /// </summary>
    [HttpPost("initiate")]
    public async Task<ActionResult<VideoCallDto>> InitiateCall([FromBody] InitiateVideoCallDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _videoCallService.InitiateCallAsync(dto, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Répondre à un appel vidéo (accepter)
    /// </summary>
    [HttpPost("{callId}/answer")]
    public async Task<ActionResult<VideoCallDto>> AnswerCall(Guid callId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _videoCallService.AnswerCallAsync(callId, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Rejeter un appel vidéo
    /// </summary>
    [HttpPost("{callId}/reject")]
    public async Task<ActionResult<VideoCallDto>> RejectCall(Guid callId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _videoCallService.RejectCallAsync(callId, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Terminer un appel vidéo en cours
    /// </summary>
    [HttpPost("{callId}/end")]
    public async Task<ActionResult<VideoCallDto>> EndCall(Guid callId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _videoCallService.EndCallAsync(callId, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Annuler un appel vidéo (avant réponse)
    /// </summary>
    [HttpPost("{callId}/cancel")]
    public async Task<ActionResult<VideoCallDto>> CancelCall(Guid callId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _videoCallService.CancelCallAsync(callId, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Obtenir les détails d'un appel
    /// </summary>
    [HttpGet("{callId}")]
    public async Task<ActionResult<VideoCallDto>> GetCallById(Guid callId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _videoCallService.GetCallByIdAsync(callId, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    /// <summary>
    /// Obtenir l'historique des appels de l'utilisateur
    /// </summary>
    [HttpGet("history")]
    public async Task<ActionResult<List<VideoCallDto>>> GetCallHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _videoCallService.GetUserCallHistoryAsync(userId, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Enregistrer des données de signalisation WebRTC
    /// </summary>
    [HttpPost("signaling")]
    public async Task<ActionResult> SaveSignalingData([FromBody] VideoCallSignalingDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _videoCallService.SaveSignalingDataAsync(dto, userId);
            return Ok(new { message = "Données de signalisation enregistrées" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    /// <summary>
    /// Récupérer les données de signalisation pour un appel
    /// </summary>
    [HttpGet("{callId}/signaling")]
    public async Task<ActionResult<string>> GetSignalingData(Guid callId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _videoCallService.GetSignalingDataAsync(callId, userId);
            return Ok(new { data = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }
}
