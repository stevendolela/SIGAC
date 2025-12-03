using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces;

public interface ICalendarService
{
    Task<List<CalendarEventDto>> GetBetweenAsync(DateTime start, DateTime end);
    Task<CalendarEventDto> CreateAsync(CreateCalendarEventDto dto, Guid actorUserId);
    Task<CalendarEventDto> UpdateAsync(Guid id, CreateCalendarEventDto dto, Guid actorUserId);
    Task DeleteAsync(Guid id, Guid actorUserId);
}
