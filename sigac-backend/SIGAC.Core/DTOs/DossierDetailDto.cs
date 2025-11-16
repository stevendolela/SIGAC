namespace SIGAC.Core.DTOs;

public class DossierDetailDto
{
    public Guid Id { get; set; }
    public string NumeroDossier { get; set; } = string.Empty;
    public string Titre { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Demandeur { get; set; } = string.Empty;
    public string? Defendeur { get; set; }
    public DateTime DateDepot { get; set; }
    public DateTime? DateAudience { get; set; }
    public DateTime? DateDecision { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Priorite { get; set; } = string.Empty;
    public string? Resume { get; set; }
    public string? Observations { get; set; }
    public UserDto? Rapporteur { get; set; }
    public List<DocumentDto> Documents { get; set; } = new();
    public List<HistoriqueDto> Historiques { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
}