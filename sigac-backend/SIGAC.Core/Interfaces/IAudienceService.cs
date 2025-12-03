using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;

namespace SIGAC.Core.Interfaces;

public interface IAudienceService
{
    Task<List<AudienceListDto>> GetAllAudiencesAsync(Guid userId, UserRole userRole);
    Task<List<AudienceListDto>> GetAudiencesByDossierAsync(Guid dossierId, Guid userId, UserRole userRole);
    Task<List<AudienceListDto>> GetAudiencesByDateRangeAsync(DateTime dateDebut, DateTime dateFin, Guid userId, UserRole userRole);
    Task<AudienceDetailDto?> GetAudienceByIdAsync(Guid id, Guid userId, UserRole userRole);
    Task<AudienceDetailDto> CreateAudienceAsync(CreateAudienceDto dto, Guid userId, UserRole userRole);
    Task<AudienceDetailDto> UpdateAudienceAsync(Guid id, UpdateAudienceDto dto, Guid userId, UserRole userRole);
    Task<bool> DeleteAudienceAsync(Guid id, Guid userId, UserRole userRole);
}
