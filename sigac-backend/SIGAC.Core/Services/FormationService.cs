using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;

namespace SIGAC.Core.Services;

public class FormationService : IFormationService
{
    private readonly IFormationRepository _repo;
    private readonly IAuditLogRepository _audit;
    private readonly IMapper _mapper;

    public FormationService(IFormationRepository repo, IAuditLogRepository audit, IMapper mapper)
    {
        _repo = repo; _audit = audit; _mapper = mapper;
    }

    public async Task<FormationDto> CreateAsync(CreateFormationDto dto, Guid actorUserId)
    {
        if (dto.DateFin < dto.DateDebut) throw new ArgumentException("Date fin < date début");
        var entity = new Formation
        {
            Id = Guid.NewGuid(),
            Titre = dto.Titre,
            Description = dto.Description,
            Organisateur = dto.Organisateur,
            DateDebut = dto.DateDebut,
            DateFin = dto.DateFin,
            Lieu = dto.Lieu,
            EstEnLigne = dto.EstEnLigne
        };
        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();
        await _audit.LogActionAsync(actorUserId, "CREATE", nameof(Formation), entity.Id.ToString(), null, System.Text.Json.JsonSerializer.Serialize(entity));
        return _mapper.Map<FormationDto>(entity);
    }

    public async Task DeleteAsync(Guid id, Guid actorUserId)
    {
        var entity = await _repo.GetByIdAsync(id) ?? throw new KeyNotFoundException("Formation introuvable");
        var old = System.Text.Json.JsonSerializer.Serialize(entity);
        await _repo.DeleteAsync(entity);
        await _repo.SaveChangesAsync();
        await _audit.LogActionAsync(actorUserId, "DELETE", nameof(Formation), id.ToString(), old, null);
    }

    public async Task<List<FormationDto>> GetAllAsync()
    {
        var items = await _repo.GetAllAsync();
        return items.Select(_mapper.Map<FormationDto>).ToList();
    }

    public async Task<FormationDto> UpdateAsync(Guid id, CreateFormationDto dto, Guid actorUserId)
    {
        var entity = await _repo.GetByIdAsync(id) ?? throw new KeyNotFoundException("Formation introuvable");
        var old = System.Text.Json.JsonSerializer.Serialize(entity);
        entity.Titre = dto.Titre;
        entity.Description = dto.Description;
        entity.Organisateur = dto.Organisateur;
        entity.DateDebut = dto.DateDebut;
        entity.DateFin = dto.DateFin;
        entity.Lieu = dto.Lieu;
        entity.EstEnLigne = dto.EstEnLigne;
        entity.ModifiedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(entity);
        await _repo.SaveChangesAsync();
        await _audit.LogActionAsync(actorUserId, "UPDATE", nameof(Formation), id.ToString(), old, System.Text.Json.JsonSerializer.Serialize(entity));
        return _mapper.Map<FormationDto>(entity);
    }

    public async Task<FormationParticipationDto> AddParticipantAsync(Guid formationId, CreateFormationParticipationDto dto, Guid actorUserId)
    {
        var existing = await _repo.GetParticipationAsync(formationId, dto.UserId);
        if (existing != null) throw new ArgumentException("Déjà inscrit");
        var entity = new FormationParticipation
        {
            Id = Guid.NewGuid(),
            FormationId = formationId,
            UserId = dto.UserId,
            EstCompletee = false
        };
        await _repo.AddParticipationAsync(entity);
        await _repo.SaveChangesAsync();
        await _audit.LogActionAsync(actorUserId, "CREATE", nameof(FormationParticipation), entity.Id.ToString(), null, System.Text.Json.JsonSerializer.Serialize(entity));
        return _mapper.Map<FormationParticipationDto>(entity);
    }

    public async Task<FormationParticipationDto> MarkCompletedAsync(Guid formationId, Guid userId, DateTime completionDate, string? certificatUrl, Guid actorUserId)
    {
        var entity = await _repo.GetParticipationAsync(formationId, userId) ?? throw new KeyNotFoundException("Participation introuvable");
        var old = System.Text.Json.JsonSerializer.Serialize(entity);
        entity.EstCompletee = true;
        entity.DateCompletion = completionDate;
        entity.CertificatUrl = certificatUrl;
        await _repo.UpdateParticipationAsync(entity);
        await _repo.SaveChangesAsync();
        await _audit.LogActionAsync(actorUserId, "UPDATE", nameof(FormationParticipation), entity.Id.ToString(), old, System.Text.Json.JsonSerializer.Serialize(entity));
        return _mapper.Map<FormationParticipationDto>(entity);
    }
}
