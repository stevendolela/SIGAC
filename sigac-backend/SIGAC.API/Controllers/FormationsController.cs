using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FormationsController : ControllerBase
{
    private readonly IFormationService _service;

    public FormationsController(IFormationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<FormationDto>>> GetAll()
    {
        var items = await _service.GetAllAsync();
        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = "Administrateur,President")]
    public async Task<ActionResult<FormationDto>> Create([FromBody] CreateFormationDto dto)
    {
        var actor = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var created = await _service.CreateAsync(dto, actor);
        return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Administrateur,President")]
    public async Task<ActionResult<FormationDto>> Update(Guid id, [FromBody] CreateFormationDto dto)
    {
        var actor = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var updated = await _service.UpdateAsync(id, dto, actor);
        return Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Administrateur,President")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var actor = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _service.DeleteAsync(id, actor);
        return NoContent();
    }

    [HttpPost("{id:guid}/participants")]
    [Authorize(Roles = "Administrateur,President")]
    public async Task<ActionResult<FormationParticipationDto>> AddParticipant(Guid id, [FromBody] CreateFormationParticipationDto dto)
    {
        var actor = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var part = await _service.AddParticipantAsync(id, dto, actor);
        return Ok(part);
    }

    [HttpPost("{id:guid}/participants/{userId:guid}/complete")]
    [Authorize(Roles = "Administrateur,President")]
    public async Task<ActionResult<FormationParticipationDto>> MarkCompleted(Guid id, Guid userId, [FromQuery] DateTime date, [FromBody] string? certificatUrl)
    {
        var actor = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var part = await _service.MarkCompletedAsync(id, userId, date, certificatUrl, actor);
        return Ok(part);
    }
}
