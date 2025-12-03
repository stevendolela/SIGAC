namespace SIGAC.Core.Entities;

public class Formation
{
    public Guid Id { get; set; }
    public string Titre { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Organisateur { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
    public string? Lieu { get; set; }
    public bool EstEnLigne { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedAt { get; set; }

    public ICollection<FormationParticipation> Participations { get; set; } = new List<FormationParticipation>();
}
