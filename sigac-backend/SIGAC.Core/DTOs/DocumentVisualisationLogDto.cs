namespace SIGAC.Core.DTOs;

public class DocumentVisualisationLogDto
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public string DocumentNom { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string UserNomComplet { get; set; } = string.Empty;
    public DateTime DateVisualisation { get; set; }
    public string TypeVisualisation { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
}
