using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CalendarController : ControllerBase
{
    private readonly ICalendarService _service;
    public CalendarController(ICalendarService service) { _service = service; }

    [HttpGet]
    public async Task<ActionResult<List<CalendarEventDto>>> Get([FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        var items = await _service.GetBetweenAsync(start, end);
        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = "Administrateur,President,Greffier")]
    public async Task<ActionResult<CalendarEventDto>> Create([FromBody] CreateCalendarEventDto dto)
    {
        var actor = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var created = await _service.CreateAsync(dto, actor);
        return Ok(created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Administrateur,President,Greffier")]
    public async Task<ActionResult<CalendarEventDto>> Update(Guid id, [FromBody] CreateCalendarEventDto dto)
    {
        var actor = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var updated = await _service.UpdateAsync(id, dto, actor);
        return Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Administrateur,President,Greffier")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var actor = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _service.DeleteAsync(id, actor);
        return NoContent();
    }
}
