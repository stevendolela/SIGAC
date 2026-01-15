using System;
using System.Collections.Generic;

namespace SIGAC.Core.DTOs;

/// <summary>
/// Configuration de connexion FTP
/// </summary>
public class FtpConnectionConfigDto
{
    /// <summary>Adresse IP ou domaine du serveur FTP</summary>
    public string Host { get; set; } = string.Empty;

    /// <summary>Port du serveur (21 pour FTP, 22 pour SFTP)</summary>
    public int Port { get; set; } = 21;

    /// <summary>Nom d'utilisateur</summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>Mot de passe</summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>Utiliser SFTP à la place de FTP standard</summary>
    public bool UseSftp { get; set; } = false;

    /// <summary>Chemin de base sur le serveur</summary>
    public string BasePath { get; set; } = "/";

    /// <summary>Timeout de connexion en secondes</summary>
    public int TimeoutSeconds { get; set; } = 30;
}

/// <summary>
/// Configuration de connexion HTTP/HTTPS
/// </summary>
public class HttpConnectionConfigDto
{
    /// <summary>URL de base du serveur HTTP</summary>
    public string BaseUrl { get; set; } = string.Empty;

    /// <summary>Headers HTTP personnalisés (ex: Authorization, API-Key)</summary>
    public Dictionary<string, string>? Headers { get; set; }

    /// <summary>Timeout de requête en millisecondes</summary>
    public int? Timeout { get; set; }

    /// <summary>Authentification Bearer token</summary>
    public string? BearerToken { get; set; }

    /// <summary>Clé API personnalisée</summary>
    public string? ApiKey { get; set; }

    /// <summary>Nom du header pour la clé API (ex: X-API-Key)</summary>
    public string? ApiKeyHeaderName { get; set; }
}

/// <summary>
/// Réponse du test de connexion
/// </summary>
public class TestConnectionResponseDto
{
    /// <summary>Connexion établie avec succès</summary>
    public bool IsConnected { get; set; }

    /// <summary>Type de source (FTP, SFTP, HTTP, HTTPS)</summary>
    public string SourceType { get; set; } = string.Empty;

    /// <summary>Message descriptif</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Détails additionnels (ex: version du serveur)</summary>
    public string? Details { get; set; }
}

/// <summary>
/// Énumération pour les stratégies d'association des fichiers aux dossiers
/// </summary>
public enum DossierMappingStrategy
{
    /// <summary>Associer tous les fichiers au même dossier par défaut</summary>
    DefaultDossier = 0,
    
    /// <summary>Extraire le numéro du dossier depuis le nom du dossier parent (ex: /uploads/2024-001/)</summary>
    FolderName = 1,
    
    /// <summary>Extraire le numéro du dossier depuis un pattern dans le nom du fichier (ex: [2024-001]_document.pdf)</summary>
    FileNamePattern = 2,
    
    /// <summary>Créer un nouveau dossier pour chaque lot d'import</summary>
    CreateNewDossier = 3
}

/// <summary>
/// Configuration pour l'import de documents depuis une source externe
/// </summary>
public class ExternalDocumentImportConfigDto
{
    /// <summary>
    /// Chemin ou pattern sur la source (ex: /uploads/dossiers, *.pdf)
    /// </summary>
    public string SourcePath { get; set; } = "/";

    /// <summary>
    /// Pattern regex pour filtrer les fichiers à importer
    /// </summary>
    public string? FilePattern { get; set; }

    /// <summary>
    /// Extensions autorisées (ex: .pdf, .docx)
    /// Vide = toutes les extensions acceptées
    /// </summary>
    public List<string> AllowedExtensions { get; set; } = new();

    /// <summary>
    /// Patterns de fichiers à exclure (ex: "temp", "backup", ".tmp")
    /// </summary>
    public List<string> ExclusionPatterns { get; set; } = new();

    /// <summary>
    /// Taille maximale des fichiers en MB
    /// </summary>
    public int MaxFileSizeMB { get; set; } = 500;

    /// <summary>
    /// Importer récursivement les sous-dossiers
    /// </summary>
    public bool RecursiveImport { get; set; } = true;

    /// <summary>
    /// Ignorer les fichiers cachés/système
    /// </summary>
    public bool IgnoreHiddenFiles { get; set; } = true;

    /// <summary>
    /// Stratégie d'association fichier → dossier
    /// </summary>
    public DossierMappingStrategy DossierMappingStrategy { get; set; } = DossierMappingStrategy.DefaultDossier;

    /// <summary>
    /// Dossier par défaut pour DefaultDossier strategy
    /// </summary>
    public Guid? DefaultDossierId { get; set; }

    /// <summary>
    /// Regex pour extraire le numéro du dossier depuis le nom du fichier
    /// Utilisé pour FileNamePattern strategy
    /// Ex: \[([^\]]+)\] pour [2024-001]_document.pdf
    /// </summary>
    public string? DossierPatternRegex { get; set; }

    /// <summary>
    /// Type de document par défaut pour tous les fichiers importés
    /// </summary>
    public string? DefaultDocumentType { get; set; }

    /// <summary>
    /// Marquer tous les documents comme confidentiels
    /// </summary>
    public bool? MarkAsConfidential { get; set; }

    /// <summary>
    /// Empêcher l'import de fichiers dupliqués (via SHA256)
    /// </summary>
    public bool PreventDuplicates { get; set; } = true;

    /// <summary>
    /// Date minimale de modification pour importer
    /// </summary>
    public DateTime? MinModifiedDate { get; set; }

    /// <summary>
    /// Date maximale de modification pour importer
    /// </summary>
    public DateTime? MaxModifiedDate { get; set; }

    /// <summary>
    /// Nombre maximal de fichiers à importer (-1 = illimité)
    /// </summary>
    public int MaxFilesCount { get; set; } = -1;

    /// <summary>
    /// Garder la structure des dossiers du serveur
    /// </summary>
    public bool PreserveDirectoryStructure { get; set; } = false;

    /// <summary>
    /// Préfixe à ajouter aux noms des fichiers importés
    /// </summary>
    public string? FileNamePrefix { get; set; }

    /// <summary>
    /// Suffixe à ajouter aux noms des fichiers importés (avant l'extension)
    /// </summary>
    public string? FileNameSuffix { get; set; }
}

/// <summary>
/// Erreur lors de l'import
/// </summary>
public class ImportErrorDto
{
    /// <summary>Nom du fichier qui a échoué</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>Chemin du fichier</summary>
    public string FilePath { get; set; } = string.Empty;

    /// <summary>Message d'erreur détaillé</summary>
    public string ErrorMessage { get; set; } = string.Empty;

    /// <summary>Code d'erreur (optionnel)</summary>
    public string? ErrorCode { get; set; }
}

/// <summary>
/// Résultat complet d'un import depuis une source externe
/// </summary>
public class ExternalImportResultDto
{
    /// <summary>ID unique pour tracer cet import</summary>
    public Guid ImportId { get; set; }

    /// <summary>Type de source (FTP, HTTP, S3, etc.)</summary>
    public string SourceType { get; set; } = string.Empty;

    /// <summary>Message général du résultat</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Heure de démarrage</summary>
    public DateTime StartTime { get; set; }

    /// <summary>Heure de fin</summary>
    public DateTime? EndTime { get; set; }

    /// <summary>Durée totale en secondes</summary>
    public double DurationSeconds { get; set; }

    /// <summary>Nombre total de fichiers trouvés sur la source</summary>
    public int DocumentsFound { get; set; }

    /// <summary>Nombre de documents importés avec succès</summary>
    public int DocumentsImported { get; set; }

    /// <summary>Nombre de documents échoués</summary>
    public int DocumentsFailed { get; set; }

    /// <summary>Taille totale des fichiers importés (bytes)</summary>
    public long TotalSize { get; set; }

    /// <summary>Taille totale formatée (ex: 125.5 MB)</summary>
    public string FormattedSize => FormatBytes(TotalSize);

    /// <summary>Liste des noms de fichiers importés avec succès</summary>
    public List<string> SuccessfulDocuments { get; set; } = new();

    /// <summary>Liste détaillée des erreurs</summary>
    public List<ImportErrorDto> FailedDocuments { get; set; } = new();

    /// <summary>Taux de succès en pourcentage</summary>
    public double SuccessRate => DocumentsFound > 0 
        ? (DocumentsImported / (double)DocumentsFound) * 100 
        : 0;

    // Helper
    private static string FormatBytes(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB" };
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }
}
/// <summary>
/// Requête pour importer des documents depuis FTP
/// </summary>
public class FtpImportRequestDto
{
    /// <summary>Configuration FTP</summary>
    public FtpConnectionConfigDto FtpConfig { get; set; } = new();

    /// <summary>Configuration de l'import</summary>
    public ExternalDocumentImportConfigDto ImportConfig { get; set; } = new();
}

/// <summary>
/// Requête pour importer des documents depuis HTTP
/// </summary>
public class HttpImportRequestDto
{
    /// <summary>Configuration HTTP</summary>
    public HttpConnectionConfigDto HttpConfig { get; set; } = new();

    /// <summary>Configuration de l'import</summary>
    public ExternalDocumentImportConfigDto ImportConfig { get; set; } = new();
}