using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;

namespace SIGAC.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly ISearchService _service;
    public SearchController(ISearchService service) { _service = service; }

    [HttpGet("dossiers")]
    public async Task<ActionResult<List<SearchResultDto>>> SearchDossiers([FromQuery] string q, [FromQuery] int limit = 50)
    {
        var results = await _service.SearchDossiersAsync(q, limit);
        return Ok(results);
    }

    [HttpGet("documents")]
    public async Task<ActionResult<List<SearchResultDto>>> SearchDocuments([FromQuery] string q, [FromQuery] int limit = 50)
    {
        var results = await _service.SearchDocumentsAsync(q, limit);
        return Ok(results);
    }
}
