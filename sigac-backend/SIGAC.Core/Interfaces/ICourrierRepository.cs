using SIGAC.Core.Entities;
using SIGAC.Core.Enums;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Interface pour le repository des courriers
/// </summary>
public interface ICourrierRepository
{
    IQueryable<Courrier> GetQueryable();
    Task<Courrier?> GetByIdAsync(Guid id);
    Task<Courrier?> GetByIdWithDetailsAsync(Guid id);
    Task<Courrier?> GetByReferenceAsync(string reference);
    Task AddAsync(Courrier courrier);
    Task UpdateAsync(Courrier courrier);
    Task UpdateStatutAsync(Guid id, StatutCourrier nouveauStatut, Guid modifiedBy);
    Task AddHistoriqueAsync(CourrierHistorique historique);
    Task DeleteAsync(Guid id);
    Task SaveChangesAsync();
}
