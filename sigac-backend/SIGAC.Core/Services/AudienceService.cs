using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;

namespace SIGAC.Core.Services;

public class AudienceService : IAudienceService
{
    private readonly IAudienceRepository _audienceRepository;
    private readonly IDossierRepository _dossierRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IMapper _mapper;

    public AudienceService(
        IAudienceRepository audienceRepository,
        IDossierRepository dossierRepository,
        IAuditLogRepository auditLogRepository,
        IMapper mapper)
    {
        _audienceRepository = audienceRepository;
        _dossierRepository = dossierRepository;
        _auditLogRepository = auditLogRepository;
        _mapper = mapper;
    }

    public async Task<List<AudienceListDto>> GetAllAudiencesAsync(Guid userId, UserRole userRole)
    {
        var audiences = await _audienceRepository.GetAllAsync();
        
        // Si juge, filtrer uniquement les audiences des dossiers dont il est rapporteur
        if (userRole == UserRole.JugeConstitutionnel)
        {
            var (dossiers, _) = await _dossierRepository.GetDossiersAsync(1, int.MaxValue, null, null, null, null, null, null, userId, null);
            var dossierIds = dossiers.Select(d => d.Id).ToHashSet();
            audiences = audiences.Where(a => dossierIds.Contains(a.DossierId)).ToList();
        }

        return audiences.Select(a => new AudienceListDto
        {
            Id = a.Id,
            DossierId = a.DossierId,
            DossierNumero = a.Dossier.NumeroDossier,
            DossierTitre = a.Dossier.Titre,
            DateAudience = a.DateAudience,
            Lieu = a.Lieu,
            TypeAudience = a.TypeAudience,
            Statut = a.Statut,
            Observations = a.Observations,
            CreatedAt = a.CreatedAt
        }).ToList();
    }

    public async Task<List<AudienceListDto>> GetAudiencesByDossierAsync(Guid dossierId, Guid userId, UserRole userRole)
    {
        // Vérifier accès au dossier
        var dossier = await _dossierRepository.GetByIdAsync(dossierId);
        if (dossier == null)
            throw new KeyNotFoundException($"Dossier {dossierId} non trouvé");

        if (userRole == UserRole.JugeConstitutionnel && dossier.RapporteurId != userId)
            throw new UnauthorizedAccessException("Accès refusé à ce dossier");

        var audiences = await _audienceRepository.GetByDossierIdAsync(dossierId);
        
        return audiences.Select(a => new AudienceListDto
        {
            Id = a.Id,
            DossierId = a.DossierId,
            DossierNumero = a.Dossier.NumeroDossier,
            DossierTitre = a.Dossier.Titre,
            DateAudience = a.DateAudience,
            Lieu = a.Lieu,
            TypeAudience = a.TypeAudience,
            Statut = a.Statut,
            Observations = a.Observations,
            CreatedAt = a.CreatedAt
        }).ToList();
    }

    public async Task<List<AudienceListDto>> GetAudiencesByDateRangeAsync(
        DateTime dateDebut, 
        DateTime dateFin, 
        Guid userId, 
        UserRole userRole)
    {
        var audiences = await _audienceRepository.GetByDateRangeAsync(dateDebut, dateFin);
        
        // Si juge, filtrer uniquement les audiences des dossiers dont il est rapporteur
        if (userRole == UserRole.JugeConstitutionnel)
        {
            var (dossiers, _) = await _dossierRepository.GetDossiersAsync(1, int.MaxValue, null, null, null, null, null, null, userId, null);
            var dossierIds = dossiers.Select(d => d.Id).ToHashSet();
            audiences = audiences.Where(a => dossierIds.Contains(a.DossierId)).ToList();
        }

        return audiences.Select(a => new AudienceListDto
        {
            Id = a.Id,
            DossierId = a.DossierId,
            DossierNumero = a.Dossier.NumeroDossier,
            DossierTitre = a.Dossier.Titre,
            DateAudience = a.DateAudience,
            Lieu = a.Lieu,
            TypeAudience = a.TypeAudience,
            Statut = a.Statut,
            Observations = a.Observations,
            CreatedAt = a.CreatedAt
        }).ToList();
    }

    public async Task<AudienceDetailDto?> GetAudienceByIdAsync(Guid id, Guid userId, UserRole userRole)
    {
        var audience = await _audienceRepository.GetByIdAsync(id);
        if (audience == null)
            return null;

        // Vérifier accès
        if (userRole == UserRole.JugeConstitutionnel)
        {
            var dossier = await _dossierRepository.GetByIdAsync(audience.DossierId);
            if (dossier?.RapporteurId != userId)
                throw new UnauthorizedAccessException("Accès refusé à cette audience");
        }

        return new AudienceDetailDto
        {
            Id = audience.Id,
            DossierId = audience.DossierId,
            DossierNumero = audience.Dossier.NumeroDossier,
            DossierTitre = audience.Dossier.Titre,
            DateAudience = audience.DateAudience,
            Lieu = audience.Lieu,
            TypeAudience = audience.TypeAudience,
            Statut = audience.Statut,
            Observations = audience.Observations,
            CompteRendu = audience.CompteRendu,
            CreatedBy = audience.CreatedBy,
            CreatedByName = audience.CreatedByUser.NomComplet ?? audience.CreatedByUser.Username,
            CreatedAt = audience.CreatedAt,
            UpdatedAt = audience.UpdatedAt
        };
    }

    public async Task<AudienceDetailDto> CreateAudienceAsync(CreateAudienceDto dto, Guid userId, UserRole userRole)
    {
        // Validation
        if (dto.DateAudience < DateTime.UtcNow)
            throw new ArgumentException("La date de l'audience ne peut pas être dans le passé");

        if (string.IsNullOrWhiteSpace(dto.Lieu))
            throw new ArgumentException("Le lieu de l'audience est requis");

        // Vérifier existence du dossier et accès
        var dossier = await _dossierRepository.GetByIdAsync(dto.DossierId);
        if (dossier == null)
            throw new KeyNotFoundException($"Dossier {dto.DossierId} non trouvé");

        if (userRole == UserRole.JugeConstitutionnel && dossier.RapporteurId != userId)
            throw new UnauthorizedAccessException("Accès refusé à ce dossier");

        var audience = new Audience
        {
            Id = Guid.NewGuid(),
            DossierId = dto.DossierId,
            DateAudience = dto.DateAudience,
            Lieu = dto.Lieu,
            TypeAudience = dto.TypeAudience,
            Statut = StatutAudience.Planifiee,
            Observations = dto.Observations,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        await _audienceRepository.AddAsync(audience);
        await _audienceRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "CREATE",
            "Audience",
            audience.Id.ToString(),
            null,
            System.Text.Json.JsonSerializer.Serialize(dto));

        // Recharger pour avoir les relations
        var created = await _audienceRepository.GetByIdAsync(audience.Id);
        
        return new AudienceDetailDto
        {
            Id = created!.Id,
            DossierId = created.DossierId,
            DossierNumero = created.Dossier.NumeroDossier,
            DossierTitre = created.Dossier.Titre,
            DateAudience = created.DateAudience,
            Lieu = created.Lieu,
            TypeAudience = created.TypeAudience,
            Statut = created.Statut,
            Observations = created.Observations,
            CompteRendu = created.CompteRendu,
            CreatedBy = created.CreatedBy,
            CreatedByName = created.CreatedByUser.NomComplet ?? created.CreatedByUser.Username,
            CreatedAt = created.CreatedAt,
            UpdatedAt = created.UpdatedAt
        };
    }

    public async Task<AudienceDetailDto> UpdateAudienceAsync(Guid id, UpdateAudienceDto dto, Guid userId, UserRole userRole)
    {
        var audience = await _audienceRepository.GetByIdAsync(id);
        if (audience == null)
            throw new KeyNotFoundException($"Audience {id} non trouvée");

        // Vérifier accès
        if (userRole == UserRole.JugeConstitutionnel)
        {
            var dossier = await _dossierRepository.GetByIdAsync(audience.DossierId);
            if (dossier?.RapporteurId != userId)
                throw new UnauthorizedAccessException("Accès refusé à cette audience");
        }

        var oldValues = System.Text.Json.JsonSerializer.Serialize(audience);

        // Mise à jour
        if (dto.DateAudience.HasValue)
        {
            if (dto.DateAudience.Value < DateTime.UtcNow)
                throw new ArgumentException("La date de l'audience ne peut pas être dans le passé");
            audience.DateAudience = dto.DateAudience.Value;
        }

        if (!string.IsNullOrWhiteSpace(dto.Lieu))
            audience.Lieu = dto.Lieu;

        if (dto.TypeAudience.HasValue)
            audience.TypeAudience = dto.TypeAudience.Value;

        if (dto.Statut.HasValue)
            audience.Statut = dto.Statut.Value;

        if (dto.Observations != null)
            audience.Observations = dto.Observations;

        if (dto.CompteRendu != null)
            audience.CompteRendu = dto.CompteRendu;

        audience.UpdatedAt = DateTime.UtcNow;

        await _audienceRepository.UpdateAsync(audience);
        await _audienceRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "UPDATE",
            "Audience",
            audience.Id.ToString(),
            oldValues,
            System.Text.Json.JsonSerializer.Serialize(dto));

        // Recharger
        var updated = await _audienceRepository.GetByIdAsync(id);
        
        return new AudienceDetailDto
        {
            Id = updated!.Id,
            DossierId = updated.DossierId,
            DossierNumero = updated.Dossier.NumeroDossier,
            DossierTitre = updated.Dossier.Titre,
            DateAudience = updated.DateAudience,
            Lieu = updated.Lieu,
            TypeAudience = updated.TypeAudience,
            Statut = updated.Statut,
            Observations = updated.Observations,
            CompteRendu = updated.CompteRendu,
            CreatedBy = updated.CreatedBy,
            CreatedByName = updated.CreatedByUser.NomComplet ?? updated.CreatedByUser.Username,
            CreatedAt = updated.CreatedAt,
            UpdatedAt = updated.UpdatedAt
        };
    }

    public async Task<bool> DeleteAudienceAsync(Guid id, Guid userId, UserRole userRole)
    {
        var audience = await _audienceRepository.GetByIdAsync(id);
        if (audience == null)
            return false;

        // Vérifier accès
        if (userRole == UserRole.JugeConstitutionnel)
        {
            var dossier = await _dossierRepository.GetByIdAsync(audience.DossierId);
            if (dossier?.RapporteurId != userId)
                throw new UnauthorizedAccessException("Accès refusé à cette audience");
        }

        // Seules les audiences planifiées peuvent être supprimées
        if (audience.Statut == StatutAudience.Tenue)
            throw new InvalidOperationException("Impossible de supprimer une audience déjà tenue");

        var oldValues = System.Text.Json.JsonSerializer.Serialize(audience);

        await _audienceRepository.DeleteAsync(id);
        await _audienceRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "DELETE",
            "Audience",
            id.ToString(),
            oldValues,
            null);

        return true;
    }
}
