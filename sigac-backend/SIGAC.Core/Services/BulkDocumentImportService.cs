using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SIGAC.Core.Services;

/// <summary>
/// Service pour importer en masse des documents
/// </summary>
public class BulkDocumentImportService : IBulkDocumentImportService
{
    private readonly IDossierRepository _dossierRepository;
    private readonly IDocumentRepository _documentRepository;
    private readonly IAuditLogRepository _auditLogRepository;

    public BulkDocumentImportService(
        IDossierRepository dossierRepository,
        IDocumentRepository documentRepository,
        IAuditLogRepository auditLogRepository)
    {
        _dossierRepository = dossierRepository;
        _documentRepository = documentRepository;
        _auditLogRepository = auditLogRepository;
    }

    /// <summary>
    /// Importe en masse des documents depuis un DTO
    /// </summary>
    public async Task<BulkImportDocumentsResultDto> ImportDocumentsAsync(
        BulkImportDocumentsDto importData,
        Guid userId,
        UserRole userRole)
    {
        var result = new BulkImportDocumentsResultDto { Success = true };
        var errors = new List<string>();
        var documentsCreatedNames = new List<string>();
        int documentsCreated = 0;
        int documentsFailed = 0;

        if (userRole != UserRole.Admin && userRole != UserRole.Manager)
        {
            return new BulkImportDocumentsResultDto
            {
                Success = false,
                Message = "Seuls les admins peuvent importer en masse",
                Errors = new List<string> { "Accès non autorisé" }
            };
        }

        if (!importData.Documents.Any())
        {
            return new BulkImportDocumentsResultDto
            {
                Success = false,
                Message = "Aucun document à importer",
                Errors = new List<string> { "La liste des documents est vide" }
            };
        }

        // Précharge les dossiers (au fur et à mesure, ne pas tous charger)
        // On utilisera GetByNumeroDossierAsync pour chaque document

        foreach (var row in importData.Documents)
        {
            try
            {
                // Validation
                if (string.IsNullOrWhiteSpace(row.NomFichier))
                {
                    errors.Add($"Ligne ignorée: NomFichier vide");
                    documentsFailed++;
                    continue;
                }

                if (string.IsNullOrWhiteSpace(row.NumeroDossier))
                {
                    errors.Add($"Fichier {row.NomFichier}: NumeroDossier vide");
                    documentsFailed++;
                    continue;
                }

                // Cherche le dossier
                var dossier = await _dossierRepository.GetByNumeroDossierAsync(row.NumeroDossier);
                if (dossier == null)
                {
                    errors.Add($"Fichier {row.NomFichier}: Dossier '{row.NumeroDossier}' non trouvé");
                    documentsFailed++;
                    continue;
                }

                // Détermine le type de document par défaut si vide
                var typeDocument = string.IsNullOrWhiteSpace(row.TypeDocument)
                    ? "Document non classé"
                    : row.TypeDocument;

                // Crée le document
                var document = new Document
                {
                    DossierId = dossier.Id,
                    NomFichier = row.NomFichier,
                    CheminFichier = $"/uploads/{DateTime.UtcNow.Year}/{DateTime.UtcNow.Month}/{Guid.NewGuid()}_{row.NomFichier}",
                    TypeDocument = typeDocument,
                    TailleFichier = CalculateSizeFromContent(row),
                    MimeType = DetermineMimeType(row.NomFichier),
                    NumeroVersion = 1,
                    EstConfidentiel = row.EstConfidentiel,
                    HashSHA256 = CalculateSHA256(row),
                    UploadedBy = userId,
                    UploadedAt = DateTime.UtcNow
                };

                await _documentRepository.AddAsync(document);
                await _documentRepository.SaveChangesAsync();
                documentsCreated++;
                documentsCreatedNames.Add(row.NomFichier);

                // Log d'audit
                await _auditLogRepository.LogActionAsync(
                    userId,
                    "BULK_IMPORT",
                    "Document",
                    document.Id.ToString(),
                    null,
                    System.Text.Json.JsonSerializer.Serialize(document)
                );
            }
            catch (Exception ex)
            {
                documentsFailed++;
                errors.Add($"Erreur lors du traitement de {row.NomFichier}: {ex.Message}");
            }
        }

        result.DocumentsCreated = documentsCreated;
        result.DocumentsFailed = documentsFailed;
        result.DocumentsCreatedNames = documentsCreatedNames;
        result.Errors = errors;

        var message = $"Import terminé: {documentsCreated} documents créés";
        if (documentsFailed > 0)
        {
            message += $", {documentsFailed} erreurs";
        }
        result.Message = message;
        result.Success = documentsCreated > 0;

        return result;
    }

    /// <summary>
    /// Calcule la taille du fichier à partir du contenu
    /// </summary>
    private long CalculateSizeFromContent(ImportDocumentDto row)
    {
        if (!string.IsNullOrEmpty(row.Base64Content))
        {
            try
            {
                var bytes = Convert.FromBase64String(row.Base64Content);
                return bytes.Length;
            }
            catch
            {
                return 0;
            }
        }
        return 0;
    }

    /// <summary>
    /// Détermine le type MIME du fichier
    /// </summary>
    private string DetermineMimeType(string nomFichier)
    {
        var extension = Path.GetExtension(nomFichier).ToLower();
        
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
            ".zip" => "application/zip",
            ".txt" => "text/plain",
            ".csv" => "text/csv",
            _ => "application/octet-stream"
        };
    }

    /// <summary>
    /// Calcule le hash SHA256 du contenu
    /// </summary>
    private string CalculateSHA256(ImportDocumentDto row)
    {
        if (!string.IsNullOrEmpty(row.Base64Content))
        {
            try
            {
                var bytes = Convert.FromBase64String(row.Base64Content);
                using (var sha256 = System.Security.Cryptography.SHA256.Create())
                {
                    var hash = sha256.ComputeHash(bytes);
                    return Convert.ToHexString(hash);
                }
            }
            catch
            {
                return string.Empty;
            }
        }
        return string.Empty;
    }
}
