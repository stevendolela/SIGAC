using Microsoft.EntityFrameworkCore;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Services;

public class SearchService : ISearchService
{
    private readonly ApplicationDbContext _context;
    public SearchService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SearchResultDto>> SearchDossiersAsync(string query, int limit = 50)
    {
        var q = (query ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(q)) return new List<SearchResultDto>();
        q = $"%{q.Replace(" ", "%")}%";
        return await _context.Dossiers
            .AsNoTracking()
            .Where(d => EF.Functions.ILike(d.NumeroDossier, q) || EF.Functions.ILike(d.Titre, q) || EF.Functions.ILike(d.Demandeur, q))
            .OrderByDescending(d => d.CreatedAt)
            .Take(limit)
            .Select(d => new SearchResultDto
            {
                Entity = "Dossier",
                Id = d.Id,
                DossierId = d.Id,
                Titre = d.Titre,
                Extrait = d.NumeroDossier
            })
            .ToListAsync();
    }

    public async Task<List<SearchResultDto>> SearchDocumentsAsync(string query, int limit = 50)
    {
        var q = (query ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(q)) return new List<SearchResultDto>();
        q = $"%{q.Replace(" ", "%")}%";
        return await _context.Documents
            .AsNoTracking()
            .Where(doc => EF.Functions.ILike(doc.NomFichier, q) || EF.Functions.ILike(doc.TypeDocument!, q))
            .OrderByDescending(doc => doc.UploadedAt)
            .Take(limit)
            .Select(doc => new SearchResultDto
            {
                Entity = "Document",
                Id = doc.Id,
                DossierId = doc.DossierId,
                Titre = doc.NomFichier,
                Extrait = doc.TypeDocument
            })
            .ToListAsync();
    }
}
