using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces;

public interface ICalendarRepository
{
    Task<CalendarEvent?> GetByIdAsync(Guid id);
    Task<List<CalendarEvent>> GetBetweenAsync(DateTime start, DateTime end);
    Task AddAsync(CalendarEvent entity);
    Task UpdateAsync(CalendarEvent entity);
    Task DeleteAsync(CalendarEvent entity);
    Task SaveChangesAsync();
}
