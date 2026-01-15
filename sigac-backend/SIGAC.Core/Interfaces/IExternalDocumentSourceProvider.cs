using SIGAC.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Interface abstraite pour accéder à des sources de documents externes
/// Permet d'implémenter différents providers : FTP, S3, HTTP, SMB, etc.
/// </summary>
public interface IExternalDocumentSourceProvider
{
    /// <summary>
    /// Récupère la liste des fichiers disponibles depuis la source externe
    /// </summary>
    /// <param name="sourcePath">Chemin ou pattern sur la source externe (ex: /uploads/dossiers, *.pdf)</param>
    /// <param name="cancellationToken">Token d'annulation</param>
    /// <returns>Liste des fichiers avec métadonnées (nom, chemin, taille, date)</returns>
    Task<List<RemoteFileDto>> ListFilesAsync(string sourcePath, CancellationToken cancellationToken = default);

    /// <summary>
    /// Télécharge un fichier depuis la source externe
    /// </summary>
    /// <param name="remoteFilePath">Chemin complet du fichier sur la source</param>
    /// <param name="cancellationToken">Token d'annulation</param>
    /// <returns>Contenu du fichier en bytes</returns>
    Task<byte[]> DownloadFileAsync(string remoteFilePath, CancellationToken cancellationToken = default);

    /// <summary>
    /// Télécharge un fichier et retourne un stream
    /// Utile pour les gros fichiers pour éviter de charger en mémoire
    /// </summary>
    /// <param name="remoteFilePath">Chemin complet du fichier</param>
    /// <param name="cancellationToken">Token d'annulation</param>
    /// <returns>Stream du fichier</returns>
    Task<Stream> DownloadFileAsStreamAsync(string remoteFilePath, CancellationToken cancellationToken = default);

    /// <summary>
    /// Teste la connexion à la source externe
    /// </summary>
    /// <param name="cancellationToken">Token d'annulation</param>
    /// <returns>true si la connexion est établie, false sinon</returns>
    Task<bool> TestConnectionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Type de source (FTP, S3, HTTP, SMB, etc.)
    /// </summary>
    string SourceType { get; }
}

/// <summary>
/// DTO représentant un fichier distant
/// </summary>
public class RemoteFileDto
{
    /// <summary>
    /// Nom du fichier
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Chemin complet du fichier sur la source
    /// </summary>
    public string FilePath { get; set; } = string.Empty;

    /// <summary>
    /// Taille du fichier en bytes
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// Date de dernière modification sur la source
    /// </summary>
    public DateTime ModifiedDate { get; set; }

    /// <summary>
    /// Type MIME estimé
    /// </summary>
    public string MimeType { get; set; } = "application/octet-stream";

    /// <summary>
    /// Métadonnées optionnelles supplémentaires
    /// </summary>
    public Dictionary<string, string>? Metadata { get; set; }
}
