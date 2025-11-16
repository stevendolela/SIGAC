using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces;

public interface IDossierRepository
{
    Task<(List<Dossier> dossiers, int totalCount)> GetDossiersAsync(
        int page, int pageSize, string? search, TypeAffaire? type, 
        StatusDossier? status, PrioriteDossier? priorite, 
        DateTime? dateDebutMin, DateTime? dateDebutMax, Guid? rapporteurId);
    
    Task<Dossier?> GetByIdAsync(Guid id);
    Task<Dossier?> GetByIdWithoutHistoriquesAsync(Guid id);
    Task<Dossier?> GetByNumeroDossierAsync(string numeroDossier);
    Task<int> GetLastDossierNumberForYearAsync(int year);
    Task<DossierStatistics> GetStatisticsAsync(Guid? rapporteurId = null);
    Task AddAsync(Dossier dossier);
    Task UpdateAsync(Dossier dossier);
    Task DeleteAsync(Guid id);
    Task AddHistoriqueAsync(Historique historique);
    Task<int> SaveChangesAsync();
}