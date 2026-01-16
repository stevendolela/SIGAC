using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;

namespace SIGAC.Core.Services;

public class DocumentService : IDocumentService
{
    private readonly IDocumentRepository _documentRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IMapper _mapper;

    public DocumentService(
        IDocumentRepository documentRepository,
        IAuditLogRepository auditLogRepository,
        IMapper mapper)
    {
        _documentRepository = documentRepository;
        _auditLogRepository = auditLogRepository;
        _mapper = mapper;
    }

    public async Task<DocumentDto?> GetByIdAsync(Guid id)
    {
        var document = await _documentRepository.GetByIdAsync(id);
        return document != null ? _mapper.Map<DocumentDto>(document) : null;
    }

    public async Task<List<DocumentDto>> GetByDossierIdAsync(Guid dossierId)
    {
        var documents = await _documentRepository.GetByDossierIdAsync(dossierId);
        return _mapper.Map<List<DocumentDto>>(documents);
    }

    public async Task<DocumentDto> UploadAsync(
        Guid dossierId,
        string nomFichier,
        string cheminFichier,
        string typeDocument,
        long tailleFichier,
        string mimeType,
        string hashSHA256,
        Guid userId)
    {
        return await UploadWithDataAsync(dossierId, nomFichier, cheminFichier, typeDocument, 
            tailleFichier, mimeType, hashSHA256, null, userId);
    }

    public async Task<DocumentDto> UploadWithDataAsync(
        Guid dossierId,
        string nomFichier,
        string cheminFichier,
        string typeDocument,
        long tailleFichier,
        string mimeType,
        string hashSHA256,
        string? fileDataBase64,
        Guid userId)
    {
        var document = new Document
        {
            Id = Guid.NewGuid(),
            DossierId = dossierId,
            NomFichier = nomFichier,
            CheminFichier = cheminFichier,
            TypeDocument = typeDocument,
            TailleFichier = tailleFichier,
            MimeType = mimeType,
            NumeroVersion = 1,
            EstConfidentiel = false,
            HashSHA256 = hashSHA256,
            FileData = fileDataBase64,
            UploadedBy = userId,
            UploadedAt = DateTime.UtcNow
        };

        await _documentRepository.AddAsync(document);
        await _documentRepository.SaveChangesAsync();

        var documentDto = _mapper.Map<DocumentDto>(document);
        await _auditLogRepository.LogActionAsync(
            userId, "UPLOAD", "Document", document.Id.ToString(),
            null, System.Text.Json.JsonSerializer.Serialize(documentDto));

        return _mapper.Map<DocumentDto>(document);
    }

    public async Task<bool> DeleteAsync(Guid documentId, Guid userId)
    {
        var document = await _documentRepository.GetByIdAsync(documentId);
        if (document == null)
            return false;

        var oldValues = System.Text.Json.JsonSerializer.Serialize(document);

        _documentRepository.Delete(document);
        await _documentRepository.SaveChangesAsync();

        await _auditLogRepository.LogActionAsync(
            userId, "DELETE", "Document", documentId.ToString(),
            oldValues, null);

        return true;
    }

    public async Task<DocumentDto?> AssignToDossierAsync(Guid documentId, Guid newDossierId, Guid userId)
    {
        var document = await _documentRepository.GetByIdAsync(documentId);
        if (document == null)
            return null;

        var oldDossierId = document.DossierId;
        var oldValues = System.Text.Json.JsonSerializer.Serialize(new { document.DossierId, document.NomFichier });

        // Mettre à jour le DossierId
        document.DossierId = newDossierId;
        _documentRepository.Update(document);
        await _documentRepository.SaveChangesAsync();

        var newValues = System.Text.Json.JsonSerializer.Serialize(new { document.DossierId, document.NomFichier });
        await _auditLogRepository.LogActionAsync(
            userId, "UPDATE", "Document", documentId.ToString(),
            oldValues, newValues);

        return _mapper.Map<DocumentDto>(document);
    }
}
