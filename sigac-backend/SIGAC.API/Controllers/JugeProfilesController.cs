using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JugeProfilesController : ControllerBase
{
    private readonly IJugeProfileService _service;

    public JugeProfilesController(IJugeProfileService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<JugeProfileDto>>> GetAll()
    {
        var items = await _service.GetAllAsync();
        return Ok(items);
    }

    [HttpGet("me")]
    public async Task<ActionResult<JugeProfileDto?>> GetMine()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var item = await _service.GetByUserIdAsync(userId);
        return Ok(item);
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<JugeProfileDto>> UpdateMine([FromBody] UpdateJugeProfileDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var profile = await _service.GetByUserIdAsync(userId);
        
        if (profile == null)
        {
            return NotFound(new { message = "Profil non trouvé pour cet utilisateur" });
        }
        
        var updated = await _service.UpdateAsync(profile.Id, dto, userId);
        return Ok(updated);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<JugeProfileDto>> Create([FromBody] CreateJugeProfileDto dto)
    {
        var actor = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var created = await _service.CreateAsync(dto, actor);
        return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<JugeProfileDto>> Update(Guid id, [FromBody] UpdateJugeProfileDto dto)
    {
        var actor = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var updated = await _service.UpdateAsync(id, dto, actor);
        return Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var actor = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _service.DeleteAsync(id, actor);
        return NoContent();
    }
}
