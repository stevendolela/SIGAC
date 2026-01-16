namespace SIGAC.Core.Entities;

public class Document
{
    public Guid Id { get; set; }
    public Guid DossierId { get; set; }
    public Dossier Dossier { get; set; } = null!;
    
    public string NomFichier { get; set; } = string.Empty;
    public string CheminFichier { get; set; } = string.Empty;
    public string TypeDocument { get; set; } = string.Empty;
    public long TailleFichier { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public int NumeroVersion { get; set; } = 1;
    
    /// <summary>
    /// Contenu du fichier encodé en Base64 (stockage DB pour Render)
    /// </summary>
    public string? FileData { get; set; }
    
    // Sécurité
    public bool EstConfidentiel { get; set; }
    public string HashSHA256 { get; set; } = string.Empty;
    
    // Audit
    public Guid UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}