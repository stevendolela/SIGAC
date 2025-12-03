using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;

namespace SIGAC.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TypeAffaireController : ControllerBase
{
    private readonly ITypeAffaireService _service;
    public TypeAffaireController(ITypeAffaireService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<TypeAffaireDto>>> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<TypeAffaireDto>> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TypeAffaireDto>> Create(TypeAffaireDto dto)
    {
        // Extraction userId depuis les claims (à adapter selon auth)
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
        var userId = userIdClaim != null ? Guid.Parse(userIdClaim) : (Guid?)null;
        var result = await _service.CreateAsync(dto, userId ?? Guid.Empty);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TypeAffaireDto>> Update(Guid id, TypeAffaireDto dto)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
        var userId = userIdClaim != null ? Guid.Parse(userIdClaim) : (Guid?)null;
        dto.Id = id;
        var result = await _service.UpdateAsync(dto, userId ?? Guid.Empty);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
        var userId = userIdClaim != null ? Guid.Parse(userIdClaim) : (Guid?)null;
        var ok = await _service.DeleteAsync(id, userId ?? Guid.Empty);
        return ok ? NoContent() : NotFound();
    }
}
