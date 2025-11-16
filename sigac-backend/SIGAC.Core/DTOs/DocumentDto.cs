namespace SIGAC.Core.DTOs;

public class DocumentDto
{
    public Guid Id { get; set; }
    public Guid DossierId { get; set; }
    public string NomFichier { get; set; } = string.Empty;
    public string CheminFichier { get; set; } = string.Empty;
    public string TypeDocument { get; set; } = string.Empty;
    public long TailleFichier { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public int NumeroVersion { get; set; }
    public bool EstConfidentiel { get; set; }
    public string HashSHA256 { get; set; } = string.Empty;
    public Guid UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; }
}
