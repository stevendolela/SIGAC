using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces;

public interface IDossierRepository
{
    Task<(List<Dossier> dossiers, int totalCount)> GetDossiersAsync(
        int page, int pageSize, string? search, Guid? typeAffaireId,
        StatusDossier? status, PrioriteDossier? priorite,
        DateTime? dateDebutMin, DateTime? dateDebutMax, Guid? rapporteurId, Guid? workspaceId, bool includeAllForAdmin = false);
    
    Task<Dossier?> GetByIdAsync(Guid id);
    Task<Dossier?> GetByIdWithoutHistoriquesAsync(Guid id);
    Task<Dossier?> GetByNumeroDossierAsync(string numeroDossier);
    Task<int> GetLastDossierNumberForYearAsync(int year);
    Task<DossierStatistics> GetStatisticsAsync(Guid? rapporteurId = null);
    
    // === Méthodes pour Dashboard ===
    /// <summary>Récupère les dossiers créés depuis une date</summary>
    Task<List<Dossier>> GetDossiersCreatedSinceAsync(DateTime dateDebut, Guid? rapporteurId = null);
    
    /// <summary>Récupère les dossiers complétés depuis une date</summary>
    Task<List<Dossier>> GetDossiersCompletedSinceAsync(DateTime dateDebut, Guid? rapporteurId = null);

    /// <summary>Récupère les dossiers modifiés depuis une date (incluant tous les statuts)</summary>
    Task<List<Dossier>> GetDossiersModifiedSinceAsync(DateTime dateDebut, Guid? rapporteurId = null);
    
    Task AddAsync(Dossier dossier);
    Task UpdateAsync(Dossier dossier);
    Task DeleteAsync(Guid id);
    Task AddHistoriqueAsync(Historique historique);
    Task<int> SaveChangesAsync();
}