namespace SIGAC.Core.DTOs;

public class CalendarEventDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "General";
    public string Titre { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime Debut { get; set; }
    public DateTime Fin { get; set; }
    public Guid? DossierId { get; set; }
    public Guid? SalleId { get; set; }
    public bool TouteLaJournee { get; set; }
}

public class CreateCalendarEventDto
{
    public string Type { get; set; } = "General";
    public string Titre { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime Debut { get; set; }
    public DateTime Fin { get; set; }
    public Guid? DossierId { get; set; }
    public Guid? SalleId { get; set; }
    public bool TouteLaJournee { get; set; }
}
