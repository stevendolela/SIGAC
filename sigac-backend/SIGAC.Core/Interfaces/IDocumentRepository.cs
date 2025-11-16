namespace SIGAC.Core.Interfaces;

using SIGAC.Core.Entities;
using SIGAC.Core.DTOs;

public interface IDocumentRepository
{
    Task<Document?> GetByIdAsync(Guid id);
    Task<List<Document>> GetByDossierIdAsync(Guid dossierId);
    Task AddAsync(Document document);
    void Update(Document document);
    void Delete(Document document);
    Task SaveChangesAsync();
}
