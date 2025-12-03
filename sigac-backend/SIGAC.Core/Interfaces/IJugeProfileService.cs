using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces;

public interface IJugeProfileService
{
    Task<JugeProfileDto?> GetByUserIdAsync(Guid userId);
    Task<List<JugeProfileDto>> GetAllAsync();
    Task<JugeProfileDto> CreateAsync(CreateJugeProfileDto dto, Guid actorUserId);
    Task<JugeProfileDto> UpdateAsync(Guid id, UpdateJugeProfileDto dto, Guid actorUserId);
    Task DeleteAsync(Guid id, Guid actorUserId);
}
