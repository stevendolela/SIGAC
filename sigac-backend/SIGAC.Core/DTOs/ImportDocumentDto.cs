namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour importer des documents en masse
/// </summary>
public class ImportDocumentDto
{
    public string NumeroDossier { get; set; } = string.Empty;      // Référence au dossier
    public string NomFichier { get; set; } = string.Empty;          // Nom du fichier
    public string TypeDocument { get; set; } = string.Empty;         // "Requête", "Pièces justificatives", etc.
    public string? UrlDocument { get; set; } = string.Empty;         // URL du document à télécharger
    public string? Base64Content { get; set; } = string.Empty;       // Ou contenu Base64 direct
    public string? Description { get; set; } = string.Empty;         // Metadata
    public bool EstConfidentiel { get; set; } = false;               // Accès restreint
}

/// <summary>
/// Payload pour l'import en masse de documents
/// </summary>
public class BulkImportDocumentsDto
{
    public List<ImportDocumentDto> Documents { get; set; } = new();
}

/// <summary>
/// Résultat de l'import en masse de documents
/// </summary>
public class BulkImportDocumentsResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int DocumentsCreated { get; set; }
    public int DocumentsFailed { get; set; }
    public List<string> DocumentsCreatedNames { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}
