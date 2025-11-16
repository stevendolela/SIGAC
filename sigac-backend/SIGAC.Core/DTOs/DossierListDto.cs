namespace SIGAC.Core.DTOs;

public class DossierListDto
{
    public Guid Id { get; set; }
    public string NumeroDossier { get; set; } = string.Empty;
    public string Titre { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Demandeur { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priorite { get; set; } = string.Empty;
    public DateTime DateDepot { get; set; }
    public UserDto? Rapporteur { get; set; }
    public int NombreDocuments { get; set; }
}