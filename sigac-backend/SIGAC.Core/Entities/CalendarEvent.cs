namespace SIGAC.Core.Entities;

public class CalendarEvent
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "General"; // Audience, Formation, Maintenance, etc.
    public string Titre { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime Debut { get; set; }
    public DateTime Fin { get; set; }
    public Guid? DossierId { get; set; }
    public Guid? SalleId { get; set; }
    public bool TouteLaJournee { get; set; }
    public string Statut { get; set; } = "Planifie"; // Planifie, EnCours, Termine, Reporte
    public int RappelAvant { get; set; } = 30; // Minutes avant l'événement
    public List<Guid> Participants { get; set; } = new(); // User IDs
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedAt { get; set; }

    public Dossier? Dossier { get; set; }
    public Salle? Salle { get; set; }
    public User CreatedByUser { get; set; } = null!;
}
