using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces;

public interface INotificationService
{
    Task<List<NotificationDto>> GetMyNotificationsAsync(Guid userId, int top = 50);
    Task<NotificationDto> CreateAsync(CreateNotificationDto dto, Guid actorUserId);
    Task MarquerCommeLueAsync(Guid id, Guid userId);
}
