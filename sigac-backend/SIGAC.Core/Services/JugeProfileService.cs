using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;

namespace SIGAC.Core.Services;

public class JugeProfileService : IJugeProfileService
{
    private readonly IJugeProfileRepository _repo;
    private readonly IAuditLogRepository _audit;
    private readonly IMapper _mapper;

    public JugeProfileService(IJugeProfileRepository repo, IAuditLogRepository audit, IMapper mapper)
    {
        _repo = repo;
        _audit = audit;
        _mapper = mapper;
    }

    public async Task<JugeProfileDto> CreateAsync(CreateJugeProfileDto dto, Guid actorUserId)
    {
        var existing = await _repo.GetByUserIdAsync(dto.UserId);
        if (existing != null) throw new ArgumentException("Profil existe déjà pour cet utilisateur");

        var entity = new JugeProfile
        {
            Id = Guid.NewGuid(),
            UserId = dto.UserId,
            Grade = dto.Grade,
            Specialisations = dto.Specialisations,
            Biographie = dto.Biographie,
            DateNomination = dto.DateNomination,
            Telephone = dto.Telephone,
            Adresse = dto.Adresse
        };

        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();
        await _audit.LogActionAsync(actorUserId, "CREATE", nameof(JugeProfile), entity.Id.ToString(), null, System.Text.Json.JsonSerializer.Serialize(entity));
        return _mapper.Map<JugeProfileDto>(entity);
    }

    public async Task DeleteAsync(Guid id, Guid actorUserId)
    {
        var entity = await _repo.GetByIdAsync(id) ?? throw new KeyNotFoundException("Profil introuvable");
        var old = System.Text.Json.JsonSerializer.Serialize(entity);
        await _repo.DeleteAsync(entity);
        await _repo.SaveChangesAsync();
        await _audit.LogActionAsync(actorUserId, "DELETE", nameof(JugeProfile), id.ToString(), old, null);
    }

    public async Task<List<JugeProfileDto>> GetAllAsync()
    {
        var items = await _repo.GetAllAsync();
        return items.Select(_mapper.Map<JugeProfileDto>).ToList();
    }

    public async Task<JugeProfileDto?> GetByUserIdAsync(Guid userId)
    {
        var item = await _repo.GetByUserIdAsync(userId);
        return item == null ? null : _mapper.Map<JugeProfileDto>(item);
    }

    public async Task<JugeProfileDto> UpdateAsync(Guid id, UpdateJugeProfileDto dto, Guid actorUserId)
    {
        var entity = await _repo.GetByIdAsync(id) ?? throw new KeyNotFoundException("Profil introuvable");
        var old = System.Text.Json.JsonSerializer.Serialize(entity);
        entity.Grade = dto.Grade;
        entity.Specialisations = dto.Specialisations;
        entity.Biographie = dto.Biographie;
        entity.DateNomination = dto.DateNomination;
        entity.Telephone = dto.Telephone;
        entity.Adresse = dto.Adresse;
        entity.ModifiedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(entity);
        await _repo.SaveChangesAsync();
        await _audit.LogActionAsync(actorUserId, "UPDATE", nameof(JugeProfile), id.ToString(), old, System.Text.Json.JsonSerializer.Serialize(entity));
        return _mapper.Map<JugeProfileDto>(entity);
    }
}
