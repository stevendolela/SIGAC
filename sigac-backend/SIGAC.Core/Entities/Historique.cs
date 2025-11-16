namespace SIGAC.Core.Entities;

public class Historique
{
    public Guid Id { get; set; }
    public Guid DossierId { get; set; }
    public Dossier Dossier { get; set; } = null!;
    
    public DateTime DateAction { get; set; } = DateTime.UtcNow;
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}