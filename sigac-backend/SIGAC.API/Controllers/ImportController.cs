using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SIGAC.API.Controllers;

/// <summary>
/// Contrôleur pour l'import en masse de dossiers
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImportController : ControllerBase
{
    private readonly IBulkImportService _bulkImportService;

    public ImportController(IBulkImportService bulkImportService)
    {
        _bulkImportService = bulkImportService;
    }

    /// <summary>
    /// Importe en masse des dossiers depuis un CSV
    /// </summary>
    /// <param name="importData">Les données à importer</param>
    /// <returns>Résultat de l'import</returns>
    [HttpPost("dossiers")]
    public async Task<ActionResult<BulkImportResultDto>> ImportDossiers(
        [FromBody] BulkImportDossiersDto importData)
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleStr = User.FindFirst(ClaimTypes.Role)?.Value;

            if (!Guid.TryParse(userIdStr, out var userId))
                return BadRequest("Identifiant utilisateur invalide");

            if (!Enum.TryParse<UserRole>(roleStr, out var userRole))
                return BadRequest("Rôle utilisateur invalide");

            var result = await _bulkImportService.ImportDossiersAsync(importData, userId, userRole);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Erreur lors de l'import",
                error = ex.Message
            });
        }
    }
}
