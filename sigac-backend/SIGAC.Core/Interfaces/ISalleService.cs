using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces;

public interface ISalleService
{
    Task<List<SalleListDto>> GetSallesAsync(bool? activeOnly = null);
    Task<SalleDetailDto> GetSalleByIdAsync(Guid id);
    Task<SalleDetailDto> CreateSalleAsync(CreateSalleDto dto, Guid userId);
    Task<SalleDetailDto> UpdateSalleAsync(Guid id, UpdateSalleDto dto, Guid userId);
    Task DeleteSalleAsync(Guid id, Guid userId);
}
