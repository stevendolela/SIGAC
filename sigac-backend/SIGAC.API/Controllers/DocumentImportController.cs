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
/// Contrôleur pour l'import en masse de documents
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentImportController : ControllerBase
{
    private readonly IBulkDocumentImportService _bulkDocumentImportService;

    public DocumentImportController(IBulkDocumentImportService bulkDocumentImportService)
    {
        _bulkDocumentImportService = bulkDocumentImportService;
    }

    /// <summary>
    /// Importe en masse des documents
    /// </summary>
    /// <param name="importData">Les documents à importer</param>
    /// <returns>Résultat de l'import</returns>
    [HttpPost("dossiers")]
    public async Task<ActionResult<BulkImportDocumentsResultDto>> ImportDocuments(
        [FromBody] BulkImportDocumentsDto importData)
    {
        try
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleStr = User.FindFirst(ClaimTypes.Role)?.Value;

            if (!Guid.TryParse(userIdStr, out var userId))
                return BadRequest("Identifiant utilisateur invalide");

            if (!Enum.TryParse<UserRole>(roleStr, out var userRole))
                return BadRequest("Rôle utilisateur invalide");

            var result = await _bulkDocumentImportService.ImportDocumentsAsync(importData, userId, userRole);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, error = ex.InnerException?.Message });
        }
    }
}
