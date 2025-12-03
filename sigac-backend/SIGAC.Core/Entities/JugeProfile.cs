namespace SIGAC.Core.Entities;

public class JugeProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Grade { get; set; } = string.Empty; // ex: Juge, Président
    public string? Specialisations { get; set; } // CSV de spécialisations pour simplicité initiale
    public string? Biographie { get; set; }
    public DateTime? DateNomination { get; set; }
    public string? Telephone { get; set; }
    public string? Adresse { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedAt { get; set; }

    // Relations
    public User User { get; set; } = null!;
}
