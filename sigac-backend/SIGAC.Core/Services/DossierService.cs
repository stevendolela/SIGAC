using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;

namespace SIGAC.Core.Services;

public class DossierService : IDossierService
{
    private readonly IDossierRepository _dossierRepository;
    private readonly IUserRepository _userRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IMapper _mapper;

    public DossierService(
        IDossierRepository dossierRepository,
        IUserRepository userRepository,
        IAuditLogRepository auditLogRepository,
        IMapper mapper)
    {
        _dossierRepository = dossierRepository;
        _userRepository = userRepository;
        _auditLogRepository = auditLogRepository;
        _mapper = mapper;
    }

    public async Task<PaginatedResult<DossierListDto>> GetDossiersAsync(
        int page, int pageSize, string? search, TypeAffaire? type, StatusDossier? status,
        PrioriteDossier? priorite, DateTime? dateDebutMin, DateTime? dateDebutMax,
        Guid? rapporteurId, Guid userId, UserRole userRole)
    {
        // Validation
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        // Les juges ne voient que leurs dossiers assignés (sauf Admin et Président)
        Guid? filtreRapporteur = rapporteurId;
        if (userRole == UserRole.JugeConstitutionnel)
        {
            filtreRapporteur = userId;
        }

        var (dossiers, totalCount) = await _dossierRepository.GetDossiersAsync(
            page, pageSize, search, type, status, priorite,
            dateDebutMin, dateDebutMax, filtreRapporteur);

        // Manual projection to avoid AutoMapper runtime mapping issues in current runtime
        var dossierDtos = dossiers.Select(d => new DossierListDto
        {
            Id = d.Id,
            NumeroDossier = d.NumeroDossier,
            Titre = d.Titre,
            Type = d.Type.ToString(),
            Demandeur = d.Demandeur,
            Status = d.Status.ToString(),
            Priorite = d.Priorite.ToString(),
            DateDepot = d.DateDepot,
            NombreDocuments = d.Documents?.Count ?? 0,
            Rapporteur = d.Rapporteur == null ? null : new SIGAC.Core.DTOs.UserDto
            {
                Id = d.Rapporteur.Id,
                Username = d.Rapporteur.Username,
                Email = d.Rapporteur.Email,
                NomComplet = d.Rapporteur.NomComplet,
                Role = d.Rapporteur.Role.ToString(),
                IsActive = d.Rapporteur.IsActive
            }
        }).ToList();

        return new PaginatedResult<DossierListDto>
        {
            Data = dossierDtos,
            Pagination = new PaginationMetadata
            {
                CurrentPage = page,
                PageSize = pageSize,
                TotalItems = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            }
        };
    }

    public async Task<DossierDetailDto?> GetDossierByIdAsync(Guid id, Guid userId, UserRole userRole)
    {
        var dossier = await _dossierRepository.GetByIdAsync(id);

        if (dossier == null)
        {
            return null;
        }

        // Vérification des permissions
        if (userRole == UserRole.JugeConstitutionnel && dossier.RapporteurId != userId)
        {
            throw new UnauthorizedAccessException("Accès non autorisé à ce dossier");
        }

        return _mapper.Map<DossierDetailDto>(dossier);
    }

    public async Task<DossierDto> CreateDossierAsync(CreateDossierDto createDto, Guid userId)
    {
        // Validation métier
        ValidateCreateDossier(createDto);

        // Génération du numéro de dossier
        var numeroDossier = await GenerateNumeroDossierAsync();

        var dossier = new Dossier
        {
            Id = Guid.NewGuid(),
            NumeroDossier = numeroDossier,
            Titre = createDto.Titre.Trim(),
            Type = createDto.Type,
            Demandeur = createDto.Demandeur.Trim(),
            Defendeur = createDto.Defendeur?.Trim(),
            DateDepot = DateTime.UtcNow,
            Status = StatusDossier.Nouveau,
            Priorite = createDto.Priorite,
            Resume = createDto.Resume?.Trim(),
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            Documents = new List<Document>(),
            Historiques = new List<Historique>
            {
                new Historique
                {
                    Id = Guid.NewGuid(),
                    DateAction = DateTime.UtcNow,
                    Action = "Création du dossier",
                    Details = $"Dossier créé - Type: {createDto.Type}",
                    UserId = userId
                }
            }
        };

        await _dossierRepository.AddAsync(dossier);
        await _dossierRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId, "CREATE", "Dossier", dossier.Id.ToString(),
            null, System.Text.Json.JsonSerializer.Serialize(dossier));

        return _mapper.Map<DossierDto>(dossier);
    }

    public async Task<DossierDto?> UpdateDossierAsync(Guid id, UpdateDossierDto updateDto, Guid userId)
    {
        var dossier = await _dossierRepository.GetByIdAsync(id);

        if (dossier == null)
        {
            return null;
        }

        // Sauvegarde des anciennes valeurs pour l'audit
        var oldValues = System.Text.Json.JsonSerializer.Serialize(dossier);

        // Mise à jour des champs
        if (!string.IsNullOrWhiteSpace(updateDto.Titre))
            dossier.Titre = updateDto.Titre.Trim();

        if (updateDto.Type.HasValue)
            dossier.Type = updateDto.Type.Value;

        if (!string.IsNullOrWhiteSpace(updateDto.Demandeur))
            dossier.Demandeur = updateDto.Demandeur.Trim();

        if (updateDto.Defendeur != null)
            dossier.Defendeur = updateDto.Defendeur.Trim();

        if (updateDto.Priorite.HasValue)
            dossier.Priorite = updateDto.Priorite.Value;

        if (updateDto.Resume != null)
            dossier.Resume = updateDto.Resume.Trim();

        if (!string.IsNullOrWhiteSpace(updateDto.Observations))
            dossier.Observations = updateDto.Observations.Trim();

        if (updateDto.DateAudience.HasValue)
            dossier.DateAudience = updateDto.DateAudience.Value;

        dossier.ModifiedBy = userId;
        dossier.ModifiedAt = DateTime.UtcNow;

        // Ajout à l'historique
        dossier.Historiques.Add(new Historique
        {
            Id = Guid.NewGuid(),
            DossierId = dossier.Id,
            DateAction = DateTime.UtcNow,
            Action = "Modification du dossier",
            Details = "Mise à jour des informations",
            UserId = userId
        });

        await _dossierRepository.UpdateAsync(dossier);
        await _dossierRepository.SaveChangesAsync();

        // Audit log
        var newValues = System.Text.Json.JsonSerializer.Serialize(dossier);
        await _auditLogRepository.LogActionAsync(
            userId, "UPDATE", "Dossier", dossier.Id.ToString(), oldValues, newValues);

        return _mapper.Map<DossierDto>(dossier);
    }

    public async Task<bool> DeleteDossierAsync(Guid id, Guid userId)
    {
        var dossier = await _dossierRepository.GetByIdAsync(id);

        if (dossier == null)
        {
            return false;
        }

        // Suppression logique - on marque comme Classé
        dossier.Status = StatusDossier.Classe;
        dossier.ModifiedBy = userId;
        dossier.ModifiedAt = DateTime.UtcNow;

        dossier.Historiques.Add(new Historique
        {
            Id = Guid.NewGuid(),
            DossierId = dossier.Id,
            DateAction = DateTime.UtcNow,
            Action = "Dossier classé",
            Details = "Suppression logique du dossier",
            UserId = userId
        });

        await _dossierRepository.UpdateAsync(dossier);
        await _dossierRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId, "DELETE", "Dossier", dossier.Id.ToString(),
            System.Text.Json.JsonSerializer.Serialize(dossier), null);

        return true;
    }

    public async Task<bool> AttribuerRapporteurAsync(Guid dossierId, Guid rapporteurId, Guid userId)
    {
        var dossier = await _dossierRepository.GetByIdAsync(dossierId);
        if (dossier == null)
        {
            return false;
        }

        // Vérifier que le rapporteur est un juge
        var rapporteur = await _userRepository.GetByIdAsync(rapporteurId);
        if (rapporteur == null || rapporteur.Role != UserRole.JugeConstitutionnel)
        {
            throw new ArgumentException("Le rapporteur doit être un juge constitutionnel");
        }

        var ancienRapporteur = dossier.RapporteurId;
        dossier.RapporteurId = rapporteurId;
        dossier.ModifiedBy = userId;
        dossier.ModifiedAt = DateTime.UtcNow;

        // Historique
        var message = ancienRapporteur.HasValue
            ? $"Changement de rapporteur: {rapporteur.NomComplet}"
            : $"Attribution du rapporteur: {rapporteur.NomComplet}";

        dossier.Historiques.Add(new Historique
        {
            Id = Guid.NewGuid(),
            DossierId = dossier.Id,
            DateAction = DateTime.UtcNow,
            Action = message,
            UserId = userId
        });

        await _dossierRepository.UpdateAsync(dossier);
        await _dossierRepository.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ChangerStatutAsync(
        Guid dossierId, StatusDossier nouveauStatut, string? commentaire, 
        Guid userId, UserRole userRole)
    {
        // Charger le dossier SANS les historiques pour éviter les problèmes de concurrence EF
        var dossier = await _dossierRepository.GetByIdWithoutHistoriquesAsync(dossierId);
        if (dossier == null)
        {
            return false;
        }

        // Validation du workflow
        ValidateStatusTransition(dossier.Status, nouveauStatut, userRole, dossier.RapporteurId, userId);

        var ancienStatut = dossier.Status;
        dossier.Status = nouveauStatut;
        dossier.ModifiedBy = userId;
        dossier.ModifiedAt = DateTime.UtcNow;

        if (nouveauStatut == StatusDossier.Juge)
        {
            dossier.DateDecision = DateTime.UtcNow;
        }

        // Historique - Initialiser la collection si nécessaire puis ajouter
        if (dossier.Historiques == null)
        {
            dossier.Historiques = new List<Historique>();
        }
        
        dossier.Historiques.Add(new Historique
        {
            Id = Guid.NewGuid(),
            DossierId = dossier.Id,
            DateAction = DateTime.UtcNow,
            Action = $"Changement de statut: {nouveauStatut}",
            Details = commentaire ?? $"Passage de {ancienStatut} à {nouveauStatut}",
            UserId = userId
        });

        await _dossierRepository.UpdateAsync(dossier);
        await _dossierRepository.SaveChangesAsync();

        return true;
    }

    public async Task<DossierStatisticsDto> GetStatisticsAsync(Guid userId, UserRole userRole)
    {
        var stats = await _dossierRepository.GetStatisticsAsync(
            userRole == UserRole.JugeConstitutionnel ? userId : null);

        return new DossierStatisticsDto
        {
            TotalDossiers = stats.TotalDossiers,
            NouveauxDossiers = stats.NouveauxDossiers,
            EnInstruction = stats.EnInstruction,
            EnDelibere = stats.EnDelibere,
            Juges = stats.Juges,
            Classes = stats.Classes,
            ParType = stats.ParType,
            ParPriorite = stats.ParPriorite
        };
    }

    // Méthodes privées
    private void ValidateCreateDossier(CreateDossierDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Titre) || dto.Titre.Length < 10 || dto.Titre.Length > 500)
        {
            throw new ArgumentException("Le titre doit contenir entre 10 et 500 caractères");
        }

        if (string.IsNullOrWhiteSpace(dto.Demandeur) || dto.Demandeur.Length < 3 || dto.Demandeur.Length > 200)
        {
            throw new ArgumentException("Le demandeur doit contenir entre 3 et 200 caractères");
        }
    }

    private async Task<string> GenerateNumeroDossierAsync()
    {
        var year = DateTime.Now.Year;
        var lastNumber = await _dossierRepository.GetLastDossierNumberForYearAsync(year);
        var newNumber = lastNumber + 1;
        return $"CC-{year}-{newNumber:D3}";
    }

    private void ValidateStatusTransition(
        StatusDossier currentStatus, StatusDossier newStatus, 
        UserRole userRole, Guid? rapporteurId, Guid userId)
    {
        // Les transitions autorisées
        var allowedTransitions = new Dictionary<StatusDossier, List<StatusDossier>>
        {
            { StatusDossier.Nouveau, new List<StatusDossier> { StatusDossier.EnInstruction } },
            { StatusDossier.EnInstruction, new List<StatusDossier> { StatusDossier.EnDelibere, StatusDossier.Nouveau } },
            { StatusDossier.EnDelibere, new List<StatusDossier> { StatusDossier.Juge, StatusDossier.EnInstruction } },
            { StatusDossier.Juge, new List<StatusDossier> { StatusDossier.Classe } }
        };

        if (!allowedTransitions.ContainsKey(currentStatus) || 
            !allowedTransitions[currentStatus].Contains(newStatus))
        {
            throw new ArgumentException($"Transition invalide de {currentStatus} vers {newStatus}");
        }

        // Vérification des permissions selon le rôle
        if (userRole == UserRole.JugeConstitutionnel && rapporteurId != userId)
        {
            throw new UnauthorizedAccessException("Un juge ne peut modifier que ses propres dossiers");
        }
    }
}