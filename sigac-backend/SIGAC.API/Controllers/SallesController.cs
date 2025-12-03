using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System.Security.Claims;

namespace SIGAC.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SallesController : ControllerBase
{
    private readonly ISalleService _salleService;
    private readonly ILogger<SallesController> _logger;

    public SallesController(ISalleService salleService, ILogger<SallesController> logger)
    {
        _salleService = salleService;
        _logger = logger;
    }

    /// <summary>
    /// Récupérer toutes les salles
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<SalleListDto>>> GetSalles([FromQuery] bool? activeOnly = true)
    {
        try
        {
            var salles = await _salleService.GetSallesAsync(activeOnly);
            return Ok(salles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des salles");
            return StatusCode(500, "Erreur lors de la récupération des salles");
        }
    }

    /// <summary>
    /// Récupérer une salle par ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SalleDetailDto>> GetSalle(Guid id)
    {
        try
        {
            var salle = await _salleService.GetSalleByIdAsync(id);
            return Ok(salle);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération de la salle {SalleId}", id);
            return StatusCode(500, "Erreur lors de la récupération de la salle");
        }
    }

    /// <summary>
    /// Créer une nouvelle salle (Admin seulement)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Administrateur")]
    public async Task<ActionResult<SalleDetailDto>> CreateSalle([FromBody] CreateSalleDto dto)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var salle = await _salleService.CreateSalleAsync(dto, userId);
            return CreatedAtAction(nameof(GetSalle), new { id = salle.Id }, salle);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la création de la salle");
            return StatusCode(500, $"Erreur lors de la création de la salle: {ex.GetType().Name} - {ex.Message}");
        }
    }

    /// <summary>
    /// Mettre à jour une salle (Admin seulement)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Administrateur")]
    public async Task<ActionResult<SalleDetailDto>> UpdateSalle(Guid id, [FromBody] UpdateSalleDto dto)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var salle = await _salleService.UpdateSalleAsync(id, dto, userId);
            return Ok(salle);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la mise à jour de la salle {SalleId}", id);
            return StatusCode(500, "Erreur lors de la mise à jour de la salle");
        }
    }

    /// <summary>
    /// Supprimer une salle (Admin seulement)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrateur")]
    public async Task<ActionResult> DeleteSalle(Guid id)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _salleService.DeleteSalleAsync(id, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la suppression de la salle {SalleId}", id);
            return StatusCode(500, "Erreur lors de la suppression de la salle");
        }
    }
}
