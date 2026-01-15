using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;
using FluentFTP;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SIGAC.Infrastructure.ExternalSources;

/// <summary>
/// Provider pour accéder aux documents stockés sur un serveur FTP/SFTP
/// </summary>
public class FtpDocumentSourceProvider : IExternalDocumentSourceProvider
{
    private readonly string _host;
    private readonly int _port;
    private readonly string _username;
    private readonly string _password;
    private readonly bool _useSftp;
    private readonly string _basePath;

    public string SourceType => "FTP";

    /// <summary>
    /// Initialise le provider FTP/SFTP
    /// </summary>
    /// <param name="host">Serveur FTP/SFTP (ex: ftp.example.com)</param>
    /// <param name="port">Port FTP (21) ou SFTP (22)</param>
    /// <param name="username">Identifiant</param>
    /// <param name="password">Mot de passe</param>
    /// <param name="useSftp">Utiliser SFTP (true) ou FTP classique (false)</param>
    /// <param name="basePath">Chemin de base sur le serveur</param>
    public FtpDocumentSourceProvider(
        string host,
        int port = 21,
        string username = "anonymous",
        string password = "",
        bool useSftp = false,
        string basePath = "/")
    {
        _host = host ?? throw new ArgumentNullException(nameof(host));
        _port = port;
        _username = username;
        _password = password;
        _useSftp = useSftp;
        _basePath = basePath.TrimEnd('/');
    }

    public async Task<bool> TestConnectionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var client = new AsyncFtpClient(_host, _username, _password, _port);
            await client.AutoConnect(cancellationToken);
            await client.Disconnect(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[FTP] Test connexion échouée: {ex.Message}");
            return false;
        }
    }

    public async Task<List<RemoteFileDto>> ListFilesAsync(string sourcePath, CancellationToken cancellationToken = default)
    {
        var files = new List<RemoteFileDto>();
        var fullPath = $"{_basePath}/{sourcePath.TrimStart('/')}".TrimEnd('/');

        try
        {
            var client = new AsyncFtpClient(_host, _username, _password, _port);
            await client.AutoConnect(cancellationToken);

            try
            {
                var items = await client.GetListing(fullPath, FtpListOption.Recursive, cancellationToken);

                foreach (var item in items)
                {
                    if (item.Type == FtpObjectType.File)
                    {
                        files.Add(new RemoteFileDto
                        {
                            FileName = Path.GetFileName(item.FullName),
                            FilePath = item.FullName,
                            FileSize = item.Size,
                            ModifiedDate = item.Modified,
                            MimeType = DetermineMimeType(item.FullName),
                            Metadata = new Dictionary<string, string>
                            {
                                { "FtpPath", item.FullName }
                            }
                        });
                    }
                }
            }
            finally
            {
                await client.Disconnect(cancellationToken);
            }

            return files.OrderBy(f => f.FileName).ToList();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Erreur lors de la lecture FTP: {ex.Message}", ex);
        }
    }

    public async Task<byte[]> DownloadFileAsync(string remoteFilePath, CancellationToken cancellationToken = default)
    {
        try
        {
            var client = new AsyncFtpClient(_host, _username, _password, _port);
            await client.AutoConnect(cancellationToken);

            try
            {
                using (var ms = new MemoryStream())
                {
                    var result = await client.DownloadStream(ms, remoteFilePath);
                    if (!result)
                        throw new InvalidOperationException($"Échec du téléchargement: {remoteFilePath}");
                    return ms.ToArray();
                }
            }
            finally
            {
                await client.Disconnect(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Erreur lors du téléchargement du fichier FTP '{remoteFilePath}': {ex.Message}", ex);
        }
    }

    public async Task<Stream> DownloadFileAsStreamAsync(string remoteFilePath, CancellationToken cancellationToken = default)
    {
        try
        {
            var client = new AsyncFtpClient(_host, _username, _password, _port);
            await client.AutoConnect(cancellationToken);

            var stream = new MemoryStream();
            var result = await client.DownloadStream(stream, remoteFilePath);
            if (!result)
            {
                await client.Disconnect(cancellationToken);
                throw new InvalidOperationException($"Échec du téléchargement: {remoteFilePath}");
            }

            stream.Position = 0;
            await client.Disconnect(cancellationToken);
            return stream;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Erreur lors du téléchargement du fichier FTP '{remoteFilePath}': {ex.Message}", ex);
        }
    }

    // === Helpers privés ===

    private string DetermineMimeType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLower();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".ppt" => "application/vnd.ms-powerpoint",
            ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".txt" => "text/plain",
            ".csv" => "text/csv",
            ".zip" => "application/zip",
            _ => "application/octet-stream"
        };
    }
}
