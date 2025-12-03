namespace SIGAC.Core.Entities;

public class FormationParticipation
{
    public Guid Id { get; set; }
    public Guid FormationId { get; set; }
    public Guid UserId { get; set; }
    public bool EstCompletee { get; set; }
    public DateTime? DateCompletion { get; set; }
    public string? CertificatUrl { get; set; }

    // Audit
    public DateTime InscritLe { get; set; } = DateTime.UtcNow;

    // Relations
    public Formation Formation { get; set; } = null!;
    public User User { get; set; } = null!;
}
