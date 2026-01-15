using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace SIGAC.Infrastructure.ExternalSources;

/// <summary>
/// Provider pour accéder aux documents via des URLs HTTP/HTTPS
/// Utile pour les serveurs web, les APIs, les CDN, etc.
/// </summary>
public class HttpDocumentSourceProvider : IExternalDocumentSourceProvider
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;
    private readonly Dictionary<string, string>? _headers;

    public string SourceType => "HTTP";

    /// <summary>
    /// Initialise le provider HTTP
    /// </summary>
    /// <param name="baseUrl">URL de base (ex: https://documents.example.com/archives)</param>
    /// <param name="headers">Headers HTTP personnalisés (ex: Authorization, User-Agent)</param>
    /// <param name="timeout">Timeout des requêtes en secondes</param>
    public HttpDocumentSourceProvider(
        string baseUrl,
        Dictionary<string, string>? headers = null,
        int timeout = 300)
    {
        _baseUrl = baseUrl?.TrimEnd('/') ?? throw new ArgumentNullException(nameof(baseUrl));
        _headers = headers;

        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(timeout)
        };

        // Ajoute les headers personnalisés
        if (headers != null)
        {
            foreach (var (key, value) in headers)
            {
                _httpClient.DefaultRequestHeaders.Add(key, value);
            }
        }

        // Headers par défaut
        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "SIGAC DocumentImporter/1.0");
        }
    }

    public async Task<bool> TestConnectionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.SendAsync(
                new HttpRequestMessage(HttpMethod.Head, _baseUrl),
                cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[HTTP] Test connexion échouée: {ex.Message}");
            return false;
        }
    }

    public async Task<List<RemoteFileDto>> ListFilesAsync(string sourcePath, CancellationToken cancellationToken = default)
    {
        try
        {
            var url = CombineUrls(_baseUrl, sourcePath);
            
            // Appelle l'URL qui doit retourner une liste JSON de fichiers
            // Format attendu: { "files": [ { "name": "...", "url": "...", "size": ... } ] }
            var response = await _httpClient.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var json = System.Text.Json.JsonDocument.Parse(content);
            var root = json.RootElement;

            var files = new List<RemoteFileDto>();

            if (root.TryGetProperty("files", out var filesArray))
            {
                foreach (var fileObj in filesArray.EnumerateArray())
                {
                    var fileName = fileObj.GetProperty("name").GetString() ?? "unknown";
                    var fileUrl = fileObj.GetProperty("url").GetString() ?? "";
                    var size = fileObj.TryGetProperty("size", out var sizeObj) ? sizeObj.GetInt64() : 0;
                    var modified = fileObj.TryGetProperty("modified", out var modObj) 
                        ? DateTime.Parse(modObj.GetString() ?? DateTime.UtcNow.ToString())
                        : DateTime.UtcNow;

                    files.Add(new RemoteFileDto
                    {
                        FileName = fileName,
                        FilePath = fileUrl,
                        FileSize = size,
                        ModifiedDate = modified,
                        MimeType = DetermineMimeType(fileName),
                        Metadata = new Dictionary<string, string>
                        {
                            { "HttpUrl", fileUrl }
                        }
                    });
                }
            }

            return files.OrderBy(f => f.FileName).ToList();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Erreur lors de la lecture HTTP: {ex.Message}", ex);
        }
    }

    public async Task<byte[]> DownloadFileAsync(string remoteFilePath, CancellationToken cancellationToken = default)
    {
        try
        {
            var url = remoteFilePath.StartsWith("http") ? remoteFilePath : CombineUrls(_baseUrl, remoteFilePath);
            var response = await _httpClient.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsByteArrayAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Erreur lors du téléchargement HTTP '{remoteFilePath}': {ex.Message}", ex);
        }
    }

    public async Task<Stream> DownloadFileAsStreamAsync(string remoteFilePath, CancellationToken cancellationToken = default)
    {
        try
        {
            var url = remoteFilePath.StartsWith("http") ? remoteFilePath : CombineUrls(_baseUrl, remoteFilePath);
            var response = await _httpClient.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();

            var stream = new MemoryStream(await response.Content.ReadAsByteArrayAsync(cancellationToken));
            stream.Position = 0;
            return stream;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Erreur lors du téléchargement HTTP '{remoteFilePath}': {ex.Message}", ex);
        }
    }

    // === Helpers privés ===

    private string CombineUrls(string baseUrl, string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            return baseUrl;

        var uri = new Uri(new Uri(baseUrl), relativePath);
        return uri.AbsoluteUri;
    }

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
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".txt" => "text/plain",
            ".csv" => "text/csv",
            ".zip" => "application/zip",
            _ => "application/octet-stream"
        };
    }

    public void Dispose()
    {
        _httpClient?.Dispose();
    }
}
