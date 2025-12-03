using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces;

public interface INotificationRepository
{
    Task<List<Notification>> GetForUserAsync(Guid userId, int top = 50);
    Task<Notification?> GetByIdAsync(Guid id);
    Task AddAsync(Notification entity);
    Task UpdateAsync(Notification entity);
    Task<int> SaveChangesAsync();
}
