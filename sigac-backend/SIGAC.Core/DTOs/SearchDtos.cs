namespace SIGAC.Core.DTOs;

public class SearchResultDto
{
    public string Entity { get; set; } = string.Empty; // Dossier | Document
    public Guid Id { get; set; }
    public string Titre { get; set; } = string.Empty;
    public string? Extrait { get; set; }
    public Guid? DossierId { get; set; }
}
