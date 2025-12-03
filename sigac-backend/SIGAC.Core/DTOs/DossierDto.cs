namespace SIGAC.Core.DTOs;

public class DossierDto
{
    public Guid Id { get; set; }
    public string NumeroDossier { get; set; } = string.Empty;
    public string Titre { get; set; } = string.Empty;
    public Guid? TypeAffaireId { get; set; }
    public string? TypeAffaireNom { get; set; }
    public string Demandeur { get; set; } = string.Empty;
    public string? Defendeur { get; set; }
    public DateTime DateDepot { get; set; }
    public DateTime? DateAudience { get; set; }
    public DateTime? DateDecision { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Priorite { get; set; } = string.Empty;
    public string? Resume { get; set; }
    public string? Observations { get; set; }
    public Guid? RapporteurId { get; set; }
    public string? RapporteurNom { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? ModifiedBy { get; set; }
    public DateTime? ModifiedAt { get; set; }
}
