using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Interface pour le service de gestion des courriers
/// </summary>
public interface ICourrierService
{
    // CRUD de base
    Task<PaginatedResult<CourrierListDto>> GetCourriersAsync(
        int page, int pageSize,
        string? search = null,
        TypeCourrier? type = null,
        StatutCourrier? statut = null,
        UrgenceCourrier? urgence = null,
        DateTime? dateDebut = null,
        DateTime? dateFin = null,
        Guid? workspaceId = null,
        Guid? assigneAId = null,
        Guid userId = default,
        UserRole userRole = UserRole.Admin);
    
    Task<CourrierDetailDto?> GetCourrierByIdAsync(Guid id, Guid userId, UserRole userRole);
    
    Task<CourrierDetailDto> CreateCourrierAsync(CreateCourrierDto dto, Guid userId);
    
    Task<CourrierDetailDto> UpdateCourrierAsync(Guid id, UpdateCourrierDto dto, Guid userId, UserRole userRole);
    
    Task DeleteCourrierAsync(Guid id, Guid userId, UserRole userRole);
    
    // Réception avec OCR
    Task<CourrierDetailDto> ReceptionnerAvecOcrAsync(
        Stream fileStream, 
        string fileName,
        string mimeType,
        ReceptionCourrierOcrDto dto,
        Guid userId);
    
    // Analyse OCR d'un document existant
    Task<OcrResultDto> AnalyserDocumentAsync(Guid courrierId, Guid userId, UserRole userRole);
    
    // Télécharger le document d'un courrier
    Task<(byte[] Data, string FileName, string MimeType)?> GetDocumentAsync(Guid courrierId, Guid userId, UserRole userRole);
    
    // Créer un dossier à partir d'un courrier
    Task<DossierDto> CreateDossierFromCourrierAsync(CreateDossierFromCourrierDto dto, Guid userId);
    
    // Changer le statut
    Task<CourrierDetailDto> ChangerStatutAsync(Guid id, StatutCourrier nouveauStatut, string? commentaire, Guid userId, UserRole userRole);
    
    // Assigner un courrier
    Task<CourrierDetailDto> AssignerCourrierAsync(Guid id, Guid assigneAId, Guid userId, UserRole userRole);
    
    // Lier à un dossier existant
    Task<CourrierDetailDto> LierAuDossierAsync(Guid courrierId, Guid dossierId, Guid userId, UserRole userRole);
    
    // Statistiques
    Task<CourrierStatsDto> GetStatistiquesAsync(Guid? workspaceId, Guid userId, UserRole userRole);
    
    // Générer la prochaine référence
    Task<string> GenererReferenceAsync(TypeCourrier type);
}
