namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour importer des dossiers en masse
/// </summary>
public class ImportDossierDto
{
    public string NumeroDossier { get; set; } = string.Empty;
    public string Titre { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TypeAffaire { get; set; } = string.Empty;
    public string Priorite { get; set; } = "Normale";
    public string Responsable { get; set; } = string.Empty;
    public string Status { get; set; } = "Nouveau";
    public string Documents { get; set; } = string.Empty; // URLs séparées par des points-virgules
}

/// <summary>
/// Payload pour l'import en masse
/// </summary>
public class BulkImportDossiersDto
{
    public List<ImportDossierDto> Dossiers { get; set; } = new();
}

/// <summary>
/// Résultat de l'import en masse
/// </summary>
public class BulkImportResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int DossiersCreated { get; set; }
    public int DocumentsCreated { get; set; }
    public List<string> TypeAffairesCreated { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}
