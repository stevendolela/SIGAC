using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces;

public interface IDocumentService
{
    Task<DocumentDto?> GetByIdAsync(Guid id);
    Task<List<DocumentDto>> GetByDossierIdAsync(Guid dossierId);
    Task<DocumentDto> UploadAsync(
        Guid dossierId,
        string nomFichier,
        string cheminFichier,
        string typeDocument,
        long tailleFichier,
        string mimeType,
        string hashSHA256,
        Guid userId);
    Task<DocumentDto> UploadWithDataAsync(
        Guid dossierId,
        string nomFichier,
        string cheminFichier,
        string typeDocument,
        long tailleFichier,
        string mimeType,
        string hashSHA256,
        string? fileDataBase64,
        Guid userId);
    Task<DocumentDto?> AssignToDossierAsync(Guid documentId, Guid newDossierId, Guid userId);
    Task<bool> DeleteAsync(Guid documentId, Guid userId);
}
