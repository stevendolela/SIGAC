using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using AutoMapper;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;

namespace SIGAC.Core.Services;

/// <summary>
/// Service pour importer des documents depuis des sources externes (FTP, HTTP, S3, etc.)
/// Orchestration du flux : récupération → validation → ingesttion → traçabilité
/// </summary>
public class ExternalDocumentImportService : IExternalDocumentImportService
{
    private readonly IDossierRepository _dossierRepository;
    private readonly IDocumentRepository _documentRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IMapper _mapper;

    public ExternalDocumentImportService(
        IDossierRepository dossierRepository,
        IDocumentRepository documentRepository,
        IAuditLogRepository auditLogRepository,
        IMapper mapper)
    {
        _dossierRepository = dossierRepository ?? throw new ArgumentNullException(nameof(dossierRepository));
        _documentRepository = documentRepository ?? throw new ArgumentNullException(nameof(documentRepository));
        _auditLogRepository = auditLogRepository ?? throw new ArgumentNullException(nameof(auditLogRepository));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }

    /// <summary>
    /// Importe des documents depuis une source externe
    /// Workflow:
    /// 1. Liste les fichiers depuis la source
    /// 2. Pour chaque fichier: télécharge, valide, associe au dossier
    /// 3. Sauvegarde en DB et enregistre audit
    /// </summary>
    public async Task<ExternalImportResultDto> ImportFromSourceAsync(
        IExternalDocumentSourceProvider source,
        ExternalDocumentImportConfigDto config,
        Guid userId,
        UserRole userRole,
        CancellationToken cancellationToken = default)
    {
        // Validations RBAC
        if (userRole != UserRole.Admin && userRole != UserRole.Manager)
            throw new UnauthorizedAccessException("Seuls les Admin et Manager peuvent importer des documents externes");

        var result = new ExternalImportResultDto
        {
            ImportId = Guid.NewGuid(),
            SourceType = source.SourceType,
            StartTime = DateTime.UtcNow,
            DocumentsFound = 0,
            DocumentsImported = 0,
            DocumentsFailed = 0,
            TotalSize = 0,
            SuccessfulDocuments = new List<string>(),
            FailedDocuments = new List<ImportErrorDto>()
        };

        try
        {
            // Étape 1: Test de connexion
            var isConnected = await source.TestConnectionAsync(cancellationToken);
            if (!isConnected)
            {
                throw new InvalidOperationException($"Impossible de se connecter à la source {source.SourceType}");
            }

            // Étape 2: Liste les fichiers
            var remoteFiles = await source.ListFilesAsync(config.SourcePath, cancellationToken);
            result.DocumentsFound = remoteFiles.Count;

            if (!remoteFiles.Any())
            {
                result.Message = "Aucun fichier trouvé sur la source";
                return result;
            }

            // Étape 3: Filtre selon les critères
            var filesToImport = FilterFiles(remoteFiles, config);

            if (!filesToImport.Any())
            {
                result.Message = "Aucun fichier ne correspond aux critères de filtre";
                return result;
            }

            // Étape 4: Importe chaque fichier
            foreach (var remoteFile in filesToImport)
            {
                try
                {
                    await ImportSingleFileAsync(
                        remoteFile, source, config, userId, result, cancellationToken);

                    result.DocumentsImported++;
                    result.SuccessfulDocuments.Add(remoteFile.FileName);
                }
                catch (Exception ex)
                {
                    result.DocumentsFailed++;
                    result.FailedDocuments.Add(new ImportErrorDto
                    {
                        FileName = remoteFile.FileName,
                        ErrorMessage = ex.Message,
                        FilePath = remoteFile.FilePath
                    });
                }
            }

            result.EndTime = DateTime.UtcNow;
            result.DurationSeconds = (result.EndTime.Value - result.StartTime).TotalSeconds;
            result.Message = $"Import complété: {result.DocumentsImported} documents importés, " +
                           $"{result.DocumentsFailed} erreurs";

            // Audit global de l'import
            await _auditLogRepository.LogActionAsync(
                userId,
                "IMPORT_EXTERNAL_DOCUMENTS",
                "Document",
                result.ImportId.ToString(),
                null,
                $"Import depuis {source.SourceType}: {result.DocumentsImported} documents, {result.DocumentsFailed} erreurs");

            return result;
        }
        catch (OperationCanceledException)
        {
            result.Message = "Import annulé par l'utilisateur";
            result.EndTime = DateTime.UtcNow;
            throw;
        }
        catch (Exception ex)
        {
            result.Message = $"Erreur lors de l'import: {ex.Message}";
            result.EndTime = DateTime.UtcNow;
            throw;
        }
    }

    /// <summary>
    /// Importe un fichier unique depuis la source externe
    /// </summary>
    private async Task ImportSingleFileAsync(
        RemoteFileDto remoteFile,
        IExternalDocumentSourceProvider source,
        ExternalDocumentImportConfigDto config,
        Guid userId,
        ExternalImportResultDto result,
        CancellationToken cancellationToken)
    {
        // Valide le fichier
        ValidateRemoteFile(remoteFile, config);

        // Associe le fichier à un dossier (selon la stratégie)
        var dossier = await ResolveDossierAsync(remoteFile, config);

        if (dossier == null)
        {
            throw new InvalidOperationException(
                $"Impossible d'associer le fichier à un dossier. Stratégie: {config.DossierMappingStrategy}");
        }

        // Télécharge le fichier
        byte[] fileContent;
        if (remoteFile.FileSize > config.MaxFileSizeMB * 1024 * 1024)
        {
            // Pour les gros fichiers, utilise Stream
            using (var stream = await source.DownloadFileAsStreamAsync(remoteFile.FilePath, cancellationToken))
            {
                using (var ms = new MemoryStream())
                {
                    await stream.CopyToAsync(ms, cancellationToken);
                    fileContent = ms.ToArray();
                }
            }
        }
        else
        {
            // Pour les petits fichiers, charge directement
            fileContent = await source.DownloadFileAsync(remoteFile.FilePath, cancellationToken);
        }

        if (fileContent.Length == 0)
        {
            throw new InvalidOperationException("Fichier vide après téléchargement");
        }

        // Calcule le SHA256 pour intégrité et dédoublonnage
        var sha256 = CalculateSHA256(fileContent);

        // NOTE: Duplicate detection via SHA256 can be implemented
        // by adding GetByHashAsync to IDocumentRepository if needed
        // For MVP, we proceed with all files

        // Prépare le chemin de stockage
        var storagePath = GenerateStoragePath(remoteFile.FileName);

        // Crée l'entité Document
        var document = new Document
        {
            Id = Guid.NewGuid(),
            DossierId = dossier.Id,
            NomFichier = remoteFile.FileName,
            CheminFichier = storagePath,
            TypeDocument = config.DefaultDocumentType ?? "Document Importé",
            TailleFichier = fileContent.LongLength,
            MimeType = remoteFile.MimeType,
            NumeroVersion = 1,
            EstConfidentiel = config.MarkAsConfidential ?? false,
            HashSHA256 = sha256,
            UploadedBy = userId,
            UploadedAt = DateTime.UtcNow,
            Dossier = dossier
        };

        // Sauvegarde le fichier (simule le stockage, à adapter selon votre implémentation)
        // await SaveFileToStorageAsync(fileContent, storagePath);

        // Sauvegarde l'entité en DB
        await _documentRepository.AddAsync(document);
        await _documentRepository.SaveChangesAsync();

        // Enregistre l'audit
        await _auditLogRepository.LogActionAsync(
            userId,
            "UPLOAD_EXTERNAL",
            "Document",
            document.Id.ToString(),
            null,
            $"Importé depuis {source.SourceType}: {remoteFile.FilePath}");

        result.TotalSize += remoteFile.FileSize;
    }

    /// <summary>
    /// Valide un fichier distant selon les critères
    /// </summary>
    private void ValidateRemoteFile(RemoteFileDto remoteFile, ExternalDocumentImportConfigDto config)
    {
        // Taille
        if (remoteFile.FileSize > config.MaxFileSizeMB * 1024 * 1024)
        {
            throw new InvalidOperationException(
                $"Fichier trop volumineux: {remoteFile.FileSize / 1024 / 1024}MB (max: {config.MaxFileSizeMB}MB)");
        }

        if (remoteFile.FileSize == 0)
        {
            throw new InvalidOperationException("Fichier vide");
        }

        // Extension
        if (config.AllowedExtensions.Any())
        {
            var ext = Path.GetExtension(remoteFile.FileName).ToLower();
            if (!config.AllowedExtensions.Contains(ext))
            {
                throw new InvalidOperationException(
                    $"Extension non autorisée: {ext}. Autorisées: {string.Join(", ", config.AllowedExtensions)}");
            }
        }

        // Patterns d'exclusion
        if (config.ExclusionPatterns.Any())
        {
            foreach (var pattern in config.ExclusionPatterns)
            {
                if (remoteFile.FileName.Contains(pattern, StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException($"Fichier exclu par pattern: {pattern}");
                }
            }
        }
    }

    /// <summary>
    /// Résout le dossier auquel associer le fichier
    /// </summary>
    private async Task<Dossier?> ResolveDossierAsync(
        RemoteFileDto remoteFile,
        ExternalDocumentImportConfigDto config)
    {
        if (config.DossierMappingStrategy == DossierMappingStrategy.DefaultDossier)
        {
            if (!config.DefaultDossierId.HasValue)
                return null;

            return await _dossierRepository.GetByIdAsync(config.DefaultDossierId.Value);
        }

        if (config.DossierMappingStrategy == DossierMappingStrategy.FolderName)
        {
            // Extrait le numéro de dossier du nom du dossier parent
            // Ex: /uploads/2024-001/document.pdf → 2024-001
            var folderName = Path.GetDirectoryName(remoteFile.FilePath)?
                .Split('/')
                .LastOrDefault();

            if (string.IsNullOrEmpty(folderName))
                return null;

            return await _dossierRepository.GetByNumeroDossierAsync(folderName);
        }

        if (config.DossierMappingStrategy == DossierMappingStrategy.FileNamePattern)
        {
            // Extrait le numéro du nom du fichier
            // Ex: [2024-001]_document.pdf → 2024-001
            var match = System.Text.RegularExpressions.Regex.Match(
                remoteFile.FileName,
                config.DossierPatternRegex ?? @"\[([^\]]+)\]");

            if (match.Success && match.Groups.Count > 1)
            {
                var dossierNumber = match.Groups[1].Value;
                return await _dossierRepository.GetByNumeroDossierAsync(dossierNumber);
            }
        }

        return null;
    }

    /// <summary>
    /// Filtre les fichiers selon les critères
    /// </summary>
    private List<RemoteFileDto> FilterFiles(
        List<RemoteFileDto> files,
        ExternalDocumentImportConfigDto config)
    {
        var filtered = files.AsEnumerable();

        // Filtre par pattern
        if (!string.IsNullOrEmpty(config.FilePattern))
        {
            var regex = new System.Text.RegularExpressions.Regex(config.FilePattern);
            filtered = filtered.Where(f => regex.IsMatch(f.FileName));
        }

        // Filtre par extensions
        if (config.AllowedExtensions.Any())
        {
            filtered = filtered.Where(f =>
            {
                var ext = Path.GetExtension(f.FileName).ToLower();
                return config.AllowedExtensions.Contains(ext);
            });
        }

        // Filtre par date
        if (config.MinModifiedDate.HasValue)
        {
            filtered = filtered.Where(f => f.ModifiedDate >= config.MinModifiedDate.Value);
        }

        if (config.MaxModifiedDate.HasValue)
        {
            filtered = filtered.Where(f => f.ModifiedDate <= config.MaxModifiedDate.Value);
        }

        return filtered.ToList();
    }

    /// <summary>
    /// Calcule le SHA256 d'un fichier
    /// </summary>
    private string CalculateSHA256(byte[] fileContent)
    {
        using (var sha256 = SHA256.Create())
        {
            var hash = sha256.ComputeHash(fileContent);
            return Convert.ToHexString(hash);
        }
    }

    /// <summary>
    /// Génère le chemin de stockage pour un fichier
    /// </summary>
    private string GenerateStoragePath(string originalFileName)
    {
        var now = DateTime.UtcNow;
        return $"uploads/external/{now.Year}/{now.Month:D2}/{Guid.NewGuid()}_{originalFileName}";
    }
}
