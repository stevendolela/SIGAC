using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

public class CalendarRepository : ICalendarRepository
{
    private readonly ApplicationDbContext _context;
    public CalendarRepository(ApplicationDbContext context) => _context = context;

    public async Task AddAsync(CalendarEvent entity)
    {
        await _context.CalendarEvents.AddAsync(entity);
    }

    public async Task DeleteAsync(CalendarEvent entity)
    {
        _context.CalendarEvents.Remove(entity);
        await Task.CompletedTask;
    }

    public async Task<List<CalendarEvent>> GetBetweenAsync(DateTime start, DateTime end)
    {
        return await _context.CalendarEvents
            .AsNoTracking()
            .Include(c => c.Salle)
            .Include(c => c.Dossier)
            .Where(c => c.Debut <= end && c.Fin >= start)
            .OrderBy(c => c.Debut)
            .ToListAsync();
    }

    public async Task<CalendarEvent?> GetByIdAsync(Guid id)
    {
        return await _context.CalendarEvents.Include(c => c.Salle).Include(c => c.Dossier).FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();

    public async Task UpdateAsync(CalendarEvent entity)
    {
        _context.CalendarEvents.Update(entity);
        await Task.CompletedTask;
    }
}
