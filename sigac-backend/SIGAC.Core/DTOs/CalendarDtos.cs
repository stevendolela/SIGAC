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
    public string Statut { get; set; } = "Planifie";
    public int RappelAvant { get; set; } = 30;
    public List<Guid> Participants { get; set; } = new();
    public Guid? CreatedBy { get; set; }
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
    public string Statut { get; set; } = "Planifie";
    public int RappelAvant { get; set; } = 30;
    public List<Guid>? Participants { get; set; }
}
