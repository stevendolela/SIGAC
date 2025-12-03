using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces;

public interface ISalleRepository
{
    Task<List<Salle>> GetAllAsync(bool? activeOnly = null);
    Task<Salle?> GetByIdAsync(Guid id);
    Task<Salle?> GetByNomAsync(string nom);
    Task AddAsync(Salle salle);
    Task UpdateAsync(Salle salle);
    Task DeleteAsync(Salle salle);
    Task<bool> SaveChangesAsync();
}
