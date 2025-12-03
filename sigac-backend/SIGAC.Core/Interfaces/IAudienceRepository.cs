using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;

namespace SIGAC.Core.Interfaces;

public interface IAudienceRepository
{
    Task<Audience?> GetByIdAsync(Guid id);
    Task<List<Audience>> GetAllAsync();
    Task<List<Audience>> GetByDossierIdAsync(Guid dossierId);
    Task<List<Audience>> GetByDateRangeAsync(DateTime dateDebut, DateTime dateFin);
    Task<List<Audience>> GetByStatutAsync(StatutAudience statut);
    Task AddAsync(Audience audience);
    Task UpdateAsync(Audience audience);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
    Task SaveChangesAsync();
}
