using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;
    public NotificationsController(INotificationService service) { _service = service; }

    [HttpGet("me")]
    public async Task<ActionResult<List<NotificationDto>>> GetMine([FromQuery] int top = 50)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var items = await _service.GetMyNotificationsAsync(userId, top);
        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = "Administrateur,President,Greffier")]
    public async Task<ActionResult<NotificationDto>> Create([FromBody] CreateNotificationDto dto)
    {
        var actor = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var created = await _service.CreateAsync(dto, actor);
        return Ok(created);
    }

    [HttpPost("{id:guid}/lu")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _service.MarquerCommeLueAsync(id, userId);
        return NoContent();
    }
}
