namespace SIGAC.Core.DTOs;

public class DocumentDto
{
    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public Guid Id { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("dossierId")]
    public Guid DossierId { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("nomFichier")]
    public string NomFichier { get; set; } = string.Empty;
    
    [System.Text.Json.Serialization.JsonPropertyName("cheminFichier")]
    public string CheminFichier { get; set; } = string.Empty;
    
    [System.Text.Json.Serialization.JsonPropertyName("typeDocument")]
    public string TypeDocument { get; set; } = string.Empty;
    
    [System.Text.Json.Serialization.JsonPropertyName("tailleFichier")]
    public long TailleFichier { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("mimeType")]
    public string MimeType { get; set; } = string.Empty;
    
    [System.Text.Json.Serialization.JsonPropertyName("numeroVersion")]
    public int NumeroVersion { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("estConfidentiel")]
    public bool EstConfidentiel { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("hashSHA256")]
    public string HashSHA256 { get; set; } = string.Empty;
    
    [System.Text.Json.Serialization.JsonPropertyName("uploadedBy")]
    public Guid UploadedBy { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("uploadedAt")]
    public DateTime UploadedAt { get; set; }
}

/// <summary>
/// DTO pour assigner un document à un dossier différent
/// </summary>
public class AssignDocumentDto
{
    /// <summary>
    /// ID du dossier cible
    /// </summary>
    public Guid DossierId { get; set; }
}

