using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces;

public interface ITypeAffaireRepository
{
    Task<List<TypeAffaire>> GetAllAsync();
    Task<TypeAffaire?> GetByIdAsync(Guid id);
    Task AddAsync(TypeAffaire entity);
    void Update(TypeAffaire entity);
    void Remove(TypeAffaire entity);
    Task SaveChangesAsync();
}
