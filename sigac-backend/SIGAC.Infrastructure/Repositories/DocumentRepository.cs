using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

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
}
