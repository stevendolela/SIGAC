using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces;

public interface ITypeAffaireService
{
    Task<List<TypeAffaireDto>> GetAllAsync();
    Task<TypeAffaireDto?> GetByIdAsync(Guid id);
    Task<TypeAffaireDto> CreateAsync(TypeAffaireDto dto, Guid userId);
    Task<TypeAffaireDto> UpdateAsync(TypeAffaireDto dto, Guid userId);
    Task<bool> DeleteAsync(Guid id, Guid userId);
}
