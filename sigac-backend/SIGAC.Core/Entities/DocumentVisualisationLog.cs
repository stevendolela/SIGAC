namespace SIGAC.Core.Entities;

/// <summary>
/// Historique des visualisations de documents
/// </summary>
public class DocumentVisualisationLog
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;
    
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public DateTime DateVisualisation { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Type de visualisation: "download", "preview", "view"
    /// </summary>
    public string TypeVisualisation { get; set; } = "view";
    
    /// <summary>
    /// Adresse IP de l'utilisateur
    /// </summary>
    public string? IpAddress { get; set; }
    
    /// <summary>
    /// User Agent du navigateur
    /// </summary>
    public string? UserAgent { get; set; }
}
