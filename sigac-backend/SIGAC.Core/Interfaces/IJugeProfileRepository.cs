using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces;

public interface IJugeProfileRepository
{
    Task<JugeProfile?> GetByUserIdAsync(Guid userId);
    Task<JugeProfile?> GetByIdAsync(Guid id);
    Task<List<JugeProfile>> GetAllAsync();
    Task AddAsync(JugeProfile entity);
    Task UpdateAsync(JugeProfile entity);
    Task DeleteAsync(JugeProfile entity);
    Task SaveChangesAsync();
}
