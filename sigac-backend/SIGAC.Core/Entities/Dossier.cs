namespace SIGAC.Core.Entities;

using SIGAC.Core.Enums;

public class Dossier
{
    public Guid Id { get; set; }
    public string NumeroDossier { get; set; } = string.Empty;
    public string Titre { get; set; } = string.Empty;
    public TypeAffaire Type { get; set; }
    public string Demandeur { get; set; } = string.Empty;
    public string? Defendeur { get; set; }
    public DateTime DateDepot { get; set; } = DateTime.UtcNow;
    public DateTime? DateAudience { get; set; }
    public DateTime? DateDecision { get; set; }
    public StatusDossier Status { get; set; }
    public PrioriteDossier Priorite { get; set; }
    public string? Resume { get; set; }
    public string? Observations { get; set; }
    
    // Attribution
    public Guid? RapporteurId { get; set; }
    public User? Rapporteur { get; set; }
    
    // Audit
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? ModifiedBy { get; set; }
    public DateTime? ModifiedAt { get; set; }
    
    // Relations
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<Historique> Historiques { get; set; } = new List<Historique>();
}