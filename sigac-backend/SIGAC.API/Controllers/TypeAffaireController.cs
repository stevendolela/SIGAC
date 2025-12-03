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
        var userId = Guid.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "00000000-0000-0000-0000-000000000000");
        var result = await _service.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TypeAffaireDto>> Update(Guid id, TypeAffaireDto dto)
    {
        var userId = Guid.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "00000000-0000-0000-0000-000000000000");
        dto.Id = id;
        var result = await _service.UpdateAsync(dto, userId);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "00000000-0000-0000-0000-000000000000");
        var ok = await _service.DeleteAsync(id, userId);
        return ok ? NoContent() : NotFound();
    }
}
