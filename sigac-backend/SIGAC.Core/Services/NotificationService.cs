using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;

namespace SIGAC.Core.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;
    private readonly IAuditLogRepository _audit;
    private readonly IMapper _mapper;

    public NotificationService(INotificationRepository repo, IAuditLogRepository audit, IMapper mapper)
    {
        _repo = repo; _audit = audit; _mapper = mapper;
    }

    public async Task<NotificationDto> CreateAsync(CreateNotificationDto dto, Guid actorUserId)
    {
        var entity = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = dto.UserId,
            Titre = dto.Titre,
            Message = dto.Message,
            Lien = dto.Lien,
            EstLue = false,
            CreeLe = DateTime.UtcNow
        };
        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();
        // Éviter les références circulaires en sérialisant uniquement les champs primitifs
        var newValues = System.Text.Json.JsonSerializer.Serialize(new
        {
            entity.Id,
            entity.UserId,
            entity.Titre,
            entity.Message,
            entity.Lien,
            entity.EstLue,
            entity.CreeLe,
            entity.LueLe
        });
        await _audit.LogActionAsync(actorUserId, "CREATE", nameof(Notification), entity.Id.ToString(), null, newValues);
        return _mapper.Map<NotificationDto>(entity);
    }

    public async Task<List<NotificationDto>> GetMyNotificationsAsync(Guid userId, int top = 50)
    {
        var items = await _repo.GetForUserAsync(userId, top);
        return items.Select(_mapper.Map<NotificationDto>).ToList();
    }

    public async Task MarquerCommeLueAsync(Guid id, Guid userId)
    {
        var entity = await _repo.GetByIdAsync(id) ?? throw new KeyNotFoundException("Notification introuvable");
        if (entity.UserId != null && entity.UserId != userId)
            throw new UnauthorizedAccessException("Accès refusé");
        entity.EstLue = true;
        entity.LueLe = DateTime.UtcNow;
        await _repo.UpdateAsync(entity);
        await _repo.SaveChangesAsync();
        // Éviter les références circulaires en sérialisant uniquement les champs primitifs
        var updatedValues = System.Text.Json.JsonSerializer.Serialize(new
        {
            entity.Id,
            entity.UserId,
            entity.Titre,
            entity.Message,
            entity.Lien,
            entity.EstLue,
            entity.CreeLe,
            entity.LueLe
        });
        await _audit.LogActionAsync(userId, "UPDATE", nameof(Notification), id.ToString(), null, updatedValues);
    }
}
