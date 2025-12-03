using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;

namespace SIGAC.Core.Services;

public class TypeAffaireService : ITypeAffaireService
{
    private readonly ITypeAffaireRepository _repo;
    private readonly IAuditLogRepository _audit;
    private readonly IMapper _mapper;

    public TypeAffaireService(ITypeAffaireRepository repo, IAuditLogRepository audit, IMapper mapper)
    {
        _repo = repo; _audit = audit; _mapper = mapper;
    }

    public async Task<List<TypeAffaireDto>> GetAllAsync()
        => _mapper.Map<List<TypeAffaireDto>>(await _repo.GetAllAsync());

    public async Task<TypeAffaireDto?> GetByIdAsync(Guid id)
        => _mapper.Map<TypeAffaireDto>(await _repo.GetByIdAsync(id));

    public async Task<TypeAffaireDto> CreateAsync(TypeAffaireDto dto, Guid userId)
    {
        var entity = _mapper.Map<TypeAffaire>(dto);
        entity.Id = Guid.NewGuid();
        entity.CreatedAt = DateTime.UtcNow;
        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();
        await _audit.LogActionAsync(userId, "CREATE", nameof(TypeAffaire), entity.Id.ToString(), null, System.Text.Json.JsonSerializer.Serialize(new { entity.Id, entity.Nom, entity.Description, entity.CreatedAt }));
        return _mapper.Map<TypeAffaireDto>(entity);
    }

    public async Task<TypeAffaireDto> UpdateAsync(TypeAffaireDto dto, Guid userId)
    {
        var entity = await _repo.GetByIdAsync(dto.Id) ?? throw new KeyNotFoundException("Type d'affaire introuvable");
        entity.Nom = dto.Nom;
        entity.Description = dto.Description;
        entity.ModifiedAt = DateTime.UtcNow;
        _repo.Update(entity);
        await _repo.SaveChangesAsync();
        await _audit.LogActionAsync(userId, "UPDATE", nameof(TypeAffaire), entity.Id.ToString(), null, System.Text.Json.JsonSerializer.Serialize(new { entity.Id, entity.Nom, entity.Description, entity.ModifiedAt }));
        return _mapper.Map<TypeAffaireDto>(entity);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) return false;
        _repo.Remove(entity);
        await _repo.SaveChangesAsync();
        await _audit.LogActionAsync(userId, "DELETE", nameof(TypeAffaire), id.ToString(), System.Text.Json.JsonSerializer.Serialize(new { entity.Id, entity.Nom }), null);
        return true;
    }
}
