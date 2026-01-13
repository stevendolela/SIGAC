using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace SIGAC.Infrastructure.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly ApplicationDbContext _context;

    public DocumentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Document?> GetByIdAsync(Guid id)
    {
        return await _context.Documents.FindAsync(id);
    }

    public async Task<List<Document>> GetByDossierIdAsync(Guid dossierId)
    {
        return _context.Documents
            .Where(d => d.DossierId == dossierId)
            .OrderByDescending(d => d.UploadedAt)
            .ToList();
    }

    public async Task AddAsync(Document document)
    {
        _context.Documents.Add(document);
    }

    public void Update(Document document)
    {
        _context.Documents.Update(document);
    }

    public void Delete(Document document)
    {
        _context.Documents.Remove(document);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    // === Méthodes pour Dashboard ===

    public async Task<StorageStatisticsDto> GetStorageStatisticsAsync(Guid workspaceId)
    {
        var documents = await _context.Documents
            .Where(d => d.Dossier.WorkspaceId == workspaceId)
            .ToListAsync();

        var thisMonthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var docsThisMonth = documents.Count(d => d.UploadedAt >= thisMonthStart);
        var totalSize = documents.Sum(d => d.TailleFichier);

        return new StorageStatisticsDto
        {
            TotalUtilizedBytes = totalSize,
            QuotaBytes = 10_737_418_240, // 10 GB default
            TotalDocuments = documents.Count,
            DocumentsThisMonth = docsThisMonth,
            BytesByDocumentType = documents
                .GroupBy(d => d.TypeDocument ?? "Autre")
                .ToDictionary(g => g.Key, g => g.Sum(d => d.TailleFichier))
        };
    }

    public async Task<DocumentStatsDto> GetStatisticsAsync(Guid? rapporteurId = null)
    {
        var query = _context.Documents.AsQueryable();

        if (rapporteurId.HasValue)
        {
            query = query.Where(d => d.Dossier.RapporteurId == rapporteurId.Value);
        }

        var docs = await query.ToListAsync();
        var thisMonthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var docsThisMonth = docs.Count(d => d.UploadedAt >= thisMonthStart);

        return new DocumentStatsDto
        {
            TotalDocuments = docs.Count,
            DocumentsThisMonth = docsThisMonth,
            StorageUtilizedBytes = docs.Sum(d => d.TailleFichier),
            StorageQuotaBytes = 10_737_418_240
        };
    }
}
