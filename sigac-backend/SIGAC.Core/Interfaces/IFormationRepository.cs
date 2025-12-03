using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces;

public interface IFormationRepository
{
    Task<Formation?> GetByIdAsync(Guid id);
    Task<List<Formation>> GetAllAsync();
    Task AddAsync(Formation entity);
    Task UpdateAsync(Formation entity);
    Task DeleteAsync(Formation entity);
    Task SaveChangesAsync();

    // Participations
    Task<FormationParticipation?> GetParticipationAsync(Guid formationId, Guid userId);
    Task AddParticipationAsync(FormationParticipation entity);
    Task UpdateParticipationAsync(FormationParticipation entity);
}
