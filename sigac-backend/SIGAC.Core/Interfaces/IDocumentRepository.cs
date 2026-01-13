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
    
    // === Méthodes pour Dashboard ===
    /// <summary>Récupère les statistiques de stockage pour un workspace</summary>
    Task<StorageStatisticsDto> GetStorageStatisticsAsync(Guid workspaceId);
    
    /// <summary>Récupère les statistiques globales de documents</summary>
    Task<DocumentStatsDto> GetStatisticsAsync(Guid? rapporteurId = null);
}

/// <summary>DTO pour statistiques globales de documents</summary>
public class DocumentStatsDto
{
    public int TotalDocuments { get; set; }
    public int DocumentsThisMonth { get; set; }
    public long StorageUtilizedBytes { get; set; }
    public long StorageQuotaBytes { get; set; }
}
