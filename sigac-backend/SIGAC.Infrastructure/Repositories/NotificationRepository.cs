using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly ApplicationDbContext _context;
    public NotificationRepository(ApplicationDbContext context) => _context = context;

    public async Task AddAsync(Notification entity)
    {
        await _context.Notifications.AddAsync(entity);
    }

    public async Task<Notification?> GetByIdAsync(Guid id)
    {
        return await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id);
    }

    public async Task<List<Notification>> GetForUserAsync(Guid userId, int top = 50)
    {
        return await _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId || n.UserId == null)
            .OrderByDescending(n => n.CreeLe)
            .Take(top)
            .ToListAsync();
    }

    public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();

    public async Task UpdateAsync(Notification entity)
    {
        _context.Notifications.Update(entity);
        await Task.CompletedTask;
    }
}
