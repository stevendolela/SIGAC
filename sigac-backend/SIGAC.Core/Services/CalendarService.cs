using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;

namespace SIGAC.Core.Services;

public class CalendarService : ICalendarService
{
    private readonly ICalendarRepository _repo;
    private readonly IAuditLogRepository _audit;
    private readonly IMapper _mapper;

    public CalendarService(ICalendarRepository repo, IAuditLogRepository audit, IMapper mapper)
    {
        _repo = repo; _audit = audit; _mapper = mapper;
    }

    public async Task<CalendarEventDto> CreateAsync(CreateCalendarEventDto dto, Guid actorUserId)
    {
        if (dto.Fin < dto.Debut) throw new ArgumentException("Fin < Début");
        var entity = new CalendarEvent
        {
            Id = Guid.NewGuid(),
            Type = dto.Type,
            Titre = dto.Titre,
            Description = dto.Description,
            Debut = dto.Debut,
            Fin = dto.Fin,
            DossierId = dto.DossierId,
            SalleId = dto.SalleId,
            TouteLaJournee = dto.TouteLaJournee,
            CreatedBy = actorUserId
        };
        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();
        var auditData = new { entity.Id, entity.Type, entity.Titre, entity.Description, entity.Debut, entity.Fin, entity.DossierId, entity.SalleId, entity.TouteLaJournee, entity.CreatedBy };
        await _audit.LogActionAsync(actorUserId, "CREATE", nameof(CalendarEvent), entity.Id.ToString(), null, System.Text.Json.JsonSerializer.Serialize(auditData));
        return _mapper.Map<CalendarEventDto>(entity);
    }

    public async Task DeleteAsync(Guid id, Guid actorUserId)
    {
        var entity = await _repo.GetByIdAsync(id) ?? throw new KeyNotFoundException("Événement introuvable");
        var auditData = new { entity.Id, entity.Type, entity.Titre, entity.Description, entity.Debut, entity.Fin, entity.DossierId, entity.SalleId, entity.TouteLaJournee, entity.CreatedBy };
        var old = System.Text.Json.JsonSerializer.Serialize(auditData);
        await _repo.DeleteAsync(entity);
        await _repo.SaveChangesAsync();
        await _audit.LogActionAsync(actorUserId, "DELETE", nameof(CalendarEvent), id.ToString(), old, null);
    }

    public async Task<List<CalendarEventDto>> GetBetweenAsync(DateTime start, DateTime end)
    {
        var items = await _repo.GetBetweenAsync(start, end);
        return items.Select(_mapper.Map<CalendarEventDto>).ToList();
    }

    public async Task<CalendarEventDto> UpdateAsync(Guid id, CreateCalendarEventDto dto, Guid actorUserId)
    {
        var entity = await _repo.GetByIdAsync(id) ?? throw new KeyNotFoundException("Événement introuvable");
        var oldData = new { entity.Id, entity.Type, entity.Titre, entity.Description, entity.Debut, entity.Fin, entity.DossierId, entity.SalleId, entity.TouteLaJournee, entity.CreatedBy };
        var old = System.Text.Json.JsonSerializer.Serialize(oldData);
        entity.Type = dto.Type;
        entity.Titre = dto.Titre;
        entity.Description = dto.Description;
        entity.Debut = dto.Debut;
        entity.Fin = dto.Fin;
        entity.DossierId = dto.DossierId;
        entity.SalleId = dto.SalleId;
        entity.TouteLaJournee = dto.TouteLaJournee;
        entity.ModifiedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(entity);
        await _repo.SaveChangesAsync();
        var newData = new { entity.Id, entity.Type, entity.Titre, entity.Description, entity.Debut, entity.Fin, entity.DossierId, entity.SalleId, entity.TouteLaJournee, entity.CreatedBy, entity.ModifiedAt };
        await _audit.LogActionAsync(actorUserId, "UPDATE", nameof(CalendarEvent), id.ToString(), old, System.Text.Json.JsonSerializer.Serialize(newData));
        return _mapper.Map<CalendarEventDto>(entity);
    }
}
