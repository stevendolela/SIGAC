using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces;

public interface IFormationService
{
    Task<List<FormationDto>> GetAllAsync();
    Task<FormationDto> CreateAsync(CreateFormationDto dto, Guid actorUserId);
    Task<FormationDto> UpdateAsync(Guid id, CreateFormationDto dto, Guid actorUserId);
    Task DeleteAsync(Guid id, Guid actorUserId);

    // Participations
    Task<FormationParticipationDto> AddParticipantAsync(Guid formationId, CreateFormationParticipationDto dto, Guid actorUserId);
    Task<FormationParticipationDto> MarkCompletedAsync(Guid formationId, Guid userId, DateTime completionDate, string? certificatUrl, Guid actorUserId);
}
