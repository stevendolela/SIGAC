using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;

namespace SIGAC.Core.Interfaces;

public interface IDossierService
{
    Task<PaginatedResult<DossierListDto>> GetDossiersAsync(
        int page, int pageSize, string? search, Guid? typeAffaireId,
        StatusDossier? status, PrioriteDossier? priorite,
        DateTime? dateDebutMin, DateTime? dateDebutMax,
        Guid? rapporteurId, Guid userId, UserRole userRole);
    
    Task<DossierDetailDto?> GetDossierByIdAsync(Guid id, Guid userId, UserRole userRole);
    Task<DossierDto> CreateDossierAsync(CreateDossierDto createDto, Guid userId);
    Task<DossierDto?> UpdateDossierAsync(Guid id, UpdateDossierDto updateDto, Guid userId);
    Task<bool> DeleteDossierAsync(Guid id, Guid userId);
    Task<bool> AttribuerRapporteurAsync(Guid dossierId, Guid rapporteurId, Guid userId);
    Task<bool> ChangerStatutAsync(Guid dossierId, StatusDossier nouveauStatut, 
        string? commentaire, Guid userId, UserRole userRole);
    Task<DossierStatisticsDto> GetStatisticsAsync(Guid userId, UserRole userRole);
}