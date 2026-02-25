using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Services;

/// <summary>
/// Service de gestion des courriers avec support OCR
/// </summary>
public class CourrierService : ICourrierService
{
    private readonly ICourrierRepository _courrierRepository;
    private readonly IDossierRepository _dossierRepository;
    private readonly IUserRepository _userRepository;
    private readonly IOcrService _ocrService;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly ApplicationDbContext _context;

    public CourrierService(
        ICourrierRepository courrierRepository,
        IDossierRepository dossierRepository,
        IUserRepository userRepository,
        IOcrService ocrService,
        IAuditLogRepository auditLogRepository,
        ApplicationDbContext context)
    {
        _courrierRepository = courrierRepository;
        _dossierRepository = dossierRepository;
        _userRepository = userRepository;
        _ocrService = ocrService;
        _auditLogRepository = auditLogRepository;
        _context = context;
    }

    public async Task<PaginatedResult<CourrierListDto>> GetCourriersAsync(
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
        UserRole userRole = UserRole.Admin)
    {
        var query = _courrierRepository.GetQueryable();

        // Filtres
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(c =>
                c.Reference.ToLower().Contains(searchLower) ||
                c.Objet.ToLower().Contains(searchLower) ||
                c.Expediteur.ToLower().Contains(searchLower) ||
                c.Destinataire.ToLower().Contains(searchLower) ||
                (c.ReferenceExterne != null && c.ReferenceExterne.ToLower().Contains(searchLower)));
        }

        if (type.HasValue)
            query = query.Where(c => c.Type == type.Value);

        if (statut.HasValue)
            query = query.Where(c => c.Statut == statut.Value);

        if (urgence.HasValue)
            query = query.Where(c => c.Urgence == urgence.Value);

        if (dateDebut.HasValue)
            query = query.Where(c => c.DateReception >= dateDebut.Value);

        if (dateFin.HasValue)
            query = query.Where(c => c.DateReception <= dateFin.Value);

        if (workspaceId.HasValue)
            query = query.Where(c => c.WorkspaceId == workspaceId.Value);

        if (assigneAId.HasValue)
            query = query.Where(c => c.AssigneAId == assigneAId.Value);

        // RBAC: les utilisateurs normaux ne voient que leurs courriers assignés ou créés
        if (userRole != UserRole.Admin && userRole != UserRole.Manager)
        {
            query = query.Where(c => c.AssigneAId == userId || c.CreatedBy == userId);
        }

        // Tri par date de réception décroissante
        query = query.OrderByDescending(c => c.DateReception);

        // Pagination
        var totalItems = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CourrierListDto
            {
                Id = c.Id,
                Reference = c.Reference,
                Type = c.Type,
                Objet = c.Objet,
                Expediteur = c.Expediteur,
                Destinataire = c.Destinataire,
                DateCourrier = c.DateCourrier,
                DateReception = c.DateReception,
                Statut = c.Statut,
                Urgence = c.Urgence,
                ReferenceExterne = c.ReferenceExterne,
                HasDocument = c.DocumentData != null,
                DossierReference = c.Dossier != null ? c.Dossier.NumeroDossier : null,
                AssigneANom = c.AssigneA != null ? c.AssigneA.NomComplet : null,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return new PaginatedResult<CourrierListDto>
        {
            Data = items,
            Pagination = new PaginationMetadata
            {
                CurrentPage = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            }
        };
    }

    public async Task<CourrierDetailDto?> GetCourrierByIdAsync(Guid id, Guid userId, UserRole userRole)
    {
        var courrier = await _courrierRepository.GetByIdWithDetailsAsync(id);
        if (courrier == null)
            return null;

        // RBAC
        if (userRole != UserRole.Admin && userRole != UserRole.Manager)
        {
            if (courrier.AssigneAId != userId && courrier.CreatedBy != userId)
                throw new UnauthorizedAccessException("Vous n'avez pas accès à ce courrier");
        }

        return MapToDetailDto(courrier);
    }

    public async Task<CourrierDetailDto> CreateCourrierAsync(CreateCourrierDto dto, Guid userId)
    {
        var reference = await GenererReferenceAsync(dto.Type);

        var courrier = new Courrier
        {
            Id = Guid.NewGuid(),
            Reference = reference,
            Type = dto.Type,
            Objet = dto.Objet,
            Expediteur = dto.Expediteur,
            Destinataire = dto.Destinataire,
            DateCourrier = DateTime.SpecifyKind(dto.DateCourrier, DateTimeKind.Utc),
            DateReception = dto.DateReception.HasValue 
                ? DateTime.SpecifyKind(dto.DateReception.Value, DateTimeKind.Utc) 
                : DateTime.UtcNow,
            Statut = StatutCourrier.Recu,
            Urgence = dto.Urgence,
            ReferenceExterne = dto.ReferenceExterne,
            Notes = dto.Notes,
            DossierId = dto.DossierId,
            WorkspaceId = dto.WorkspaceId,
            AssigneAId = dto.AssigneAId,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        // Ajouter historique
        courrier.Historiques.Add(new CourrierHistorique
        {
            Id = Guid.NewGuid(),
            Action = "Création",
            Details = $"Courrier {(dto.Type == TypeCourrier.Entrant ? "entrant" : "sortant")} créé",
            NouveauStatut = StatutCourrier.Recu.ToString(),
            UserId = userId,
            DateAction = DateTime.UtcNow
        });

        await _courrierRepository.AddAsync(courrier);
        await _courrierRepository.SaveChangesAsync();

        // Audit
        await _auditLogRepository.LogActionAsync(
            userId, "CREATE", "Courrier", courrier.Id.ToString(),
            null, System.Text.Json.JsonSerializer.Serialize(new { reference, dto.Objet, dto.Type }));

        return (await GetCourrierByIdAsync(courrier.Id, userId, UserRole.Admin))!;
    }

    public async Task<CourrierDetailDto> ReceptionnerAvecOcrAsync(
        Stream fileStream,
        string fileName,
        string mimeType,
        ReceptionCourrierOcrDto dto,
        Guid userId)
    {
        // Lire le fichier
        using var memoryStream = new MemoryStream();
        await fileStream.CopyToAsync(memoryStream);
        var fileData = memoryStream.ToArray();
        var base64Data = Convert.ToBase64String(fileData);

        // Analyser avec OCR
        var ocrResult = await _ocrService.AnalyzeDocumentAsync(fileData, mimeType);

        // Générer la référence
        var reference = await GenererReferenceAsync(dto.Type);

        // Créer le courrier avec les données OCR
        var courrier = new Courrier
        {
            Id = Guid.NewGuid(),
            Reference = reference,
            Type = dto.Type,
            Objet = ocrResult.ObjetDetecte ?? $"Courrier {reference}",
            Expediteur = ocrResult.ExpediteurDetecte ?? "À déterminer",
            Destinataire = ocrResult.DestinataireDetecte ?? "À déterminer",
            DateCourrier = ocrResult.DateDetectee.HasValue 
                ? DateTime.SpecifyKind(ocrResult.DateDetectee.Value, DateTimeKind.Utc) 
                : DateTime.UtcNow,
            DateReception = DateTime.UtcNow,
            Statut = StatutCourrier.Recu,
            Urgence = dto.Urgence,
            ReferenceExterne = ocrResult.ReferenceDetectee,
            TexteOCR = ocrResult.TexteComplet,
            ConfianceOCR = ocrResult.Confiance,
            Notes = dto.Notes,
            DocumentData = base64Data,
            NomFichier = fileName,
            MimeType = mimeType,
            TailleFichier = fileData.Length,
            WorkspaceId = dto.WorkspaceId,
            AssigneAId = dto.AssigneAId,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        // Historique
        courrier.Historiques.Add(new CourrierHistorique
        {
            Id = Guid.NewGuid(),
            Action = "Réception OCR",
            Details = $"Document scanné et analysé (confiance: {ocrResult.Confiance}%)",
            NouveauStatut = StatutCourrier.Recu.ToString(),
            UserId = userId,
            DateAction = DateTime.UtcNow
        });

        await _courrierRepository.AddAsync(courrier);
        await _courrierRepository.SaveChangesAsync();

        // Audit
        await _auditLogRepository.LogActionAsync(
            userId, "CREATE_OCR", "Courrier", courrier.Id.ToString(),
            null, System.Text.Json.JsonSerializer.Serialize(new { 
                reference, 
                fileName, 
                ocrConfidence = ocrResult.Confiance,
                objetDetecte = ocrResult.ObjetDetecte
            }));

        return (await GetCourrierByIdAsync(courrier.Id, userId, UserRole.Admin))!;
    }

    public async Task<OcrResultDto> AnalyserDocumentAsync(Guid courrierId, Guid userId, UserRole userRole)
    {
        var courrier = await _courrierRepository.GetByIdAsync(courrierId);
        if (courrier == null)
            throw new KeyNotFoundException("Courrier non trouvé");

        if (string.IsNullOrEmpty(courrier.DocumentData))
            throw new InvalidOperationException("Aucun document associé à ce courrier");

        var result = await _ocrService.AnalyzeDocumentFromBase64Async(
            courrier.DocumentData, 
            courrier.MimeType ?? "image/png");

        // Mettre à jour les données OCR
        courrier.TexteOCR = result.TexteComplet;
        courrier.ConfianceOCR = result.Confiance;
        courrier.ModifiedAt = DateTime.UtcNow;
        courrier.ModifiedBy = userId;

        await _courrierRepository.UpdateAsync(courrier);
        await _courrierRepository.SaveChangesAsync();

        return result;
    }

    public async Task<CourrierDetailDto> UpdateCourrierAsync(Guid id, UpdateCourrierDto dto, Guid userId, UserRole userRole)
    {
        var courrier = await _courrierRepository.GetByIdAsync(id);
        if (courrier == null)
            throw new KeyNotFoundException("Courrier non trouvé");

        // RBAC
        if (userRole != UserRole.Admin && userRole != UserRole.Manager)
        {
            if (courrier.AssigneAId != userId && courrier.CreatedBy != userId)
                throw new UnauthorizedAccessException("Vous n'avez pas le droit de modifier ce courrier");
        }

        var oldStatut = courrier.Statut;
        var changes = new List<string>();

        if (!string.IsNullOrEmpty(dto.Objet) && dto.Objet != courrier.Objet)
        {
            changes.Add($"Objet: {courrier.Objet} → {dto.Objet}");
            courrier.Objet = dto.Objet;
        }
        if (!string.IsNullOrEmpty(dto.Expediteur) && dto.Expediteur != courrier.Expediteur)
        {
            changes.Add($"Expéditeur: {courrier.Expediteur} → {dto.Expediteur}");
            courrier.Expediteur = dto.Expediteur;
        }
        if (!string.IsNullOrEmpty(dto.Destinataire) && dto.Destinataire != courrier.Destinataire)
        {
            changes.Add($"Destinataire: {courrier.Destinataire} → {dto.Destinataire}");
            courrier.Destinataire = dto.Destinataire;
        }
        if (dto.DateCourrier.HasValue)
            courrier.DateCourrier = DateTime.SpecifyKind(dto.DateCourrier.Value, DateTimeKind.Utc);
        if (dto.Statut.HasValue && dto.Statut != courrier.Statut)
        {
            changes.Add($"Statut: {courrier.Statut} → {dto.Statut}");
            courrier.Statut = dto.Statut.Value;
        }
        if (dto.Urgence.HasValue)
            courrier.Urgence = dto.Urgence.Value;
        if (dto.ReferenceExterne != null)
            courrier.ReferenceExterne = dto.ReferenceExterne;
        if (dto.Notes != null)
            courrier.Notes = dto.Notes;
        if (dto.DossierId.HasValue)
            courrier.DossierId = dto.DossierId;
        if (dto.AssigneAId.HasValue)
            courrier.AssigneAId = dto.AssigneAId;

        courrier.ModifiedAt = DateTime.UtcNow;
        courrier.ModifiedBy = userId;

        // Historique
        if (changes.Count > 0)
        {
            courrier.Historiques.Add(new CourrierHistorique
            {
                Id = Guid.NewGuid(),
                Action = "Modification",
                Details = string.Join("; ", changes),
                AncienStatut = oldStatut.ToString(),
                NouveauStatut = courrier.Statut.ToString(),
                UserId = userId,
                DateAction = DateTime.UtcNow
            });
        }

        await _courrierRepository.UpdateAsync(courrier);
        await _courrierRepository.SaveChangesAsync();

        return (await GetCourrierByIdAsync(courrier.Id, userId, userRole))!;
    }

    public async Task DeleteCourrierAsync(Guid id, Guid userId, UserRole userRole)
    {
        var courrier = await _courrierRepository.GetByIdAsync(id);
        if (courrier == null)
            throw new KeyNotFoundException("Courrier non trouvé");

        if (userRole != UserRole.Admin)
            throw new UnauthorizedAccessException("Seuls les administrateurs peuvent supprimer des courriers");

        await _courrierRepository.DeleteAsync(id);
        await _courrierRepository.SaveChangesAsync();

        await _auditLogRepository.LogActionAsync(
            userId, "DELETE", "Courrier", id.ToString(),
            System.Text.Json.JsonSerializer.Serialize(new { courrier.Reference, courrier.Objet }),
            null);
    }

    public async Task<(byte[] Data, string FileName, string MimeType)?> GetDocumentAsync(
        Guid courrierId, Guid userId, UserRole userRole)
    {
        var courrier = await _courrierRepository.GetByIdAsync(courrierId);
        if (courrier == null || string.IsNullOrEmpty(courrier.DocumentData))
            return null;

        // RBAC
        if (userRole != UserRole.Admin && userRole != UserRole.Manager)
        {
            if (courrier.AssigneAId != userId && courrier.CreatedBy != userId)
                throw new UnauthorizedAccessException("Vous n'avez pas accès à ce document");
        }

        var data = Convert.FromBase64String(courrier.DocumentData);
        return (data, courrier.NomFichier ?? "document", courrier.MimeType ?? "application/octet-stream");
    }

    public async Task<DossierDto> CreateDossierFromCourrierAsync(CreateDossierFromCourrierDto dto, Guid userId)
    {
        var courrier = await _courrierRepository.GetByIdAsync(dto.CourrierId);
        if (courrier == null)
            throw new KeyNotFoundException("Courrier non trouvé");

        // Obtenir le prochain numéro de dossier
        var year = DateTime.UtcNow.Year;
        var lastNumber = await _dossierRepository.GetLastDossierNumberForYearAsync(year);
        var numeroDossier = $"DOS-{year}-{(lastNumber + 1):D4}";

        // Créer le dossier
        var dossier = new Dossier
        {
            Id = Guid.NewGuid(),
            NumeroDossier = numeroDossier,
            Titre = dto.Titre ?? courrier.Objet,
            TypeAffaireId = dto.TypeAffaireId,
            Demandeur = dto.Demandeur ?? courrier.Expediteur,
            Defendeur = dto.Defendeur,
            DateDepot = DateTime.UtcNow,
            Status = StatusDossier.Nouveau,
            Priorite = courrier.Urgence switch
            {
                UrgenceCourrier.TresUrgente => PrioriteDossier.Urgente,
                UrgenceCourrier.Urgente => PrioriteDossier.Haute,
                _ => PrioriteDossier.Normale
            },
            Resume = $"Dossier créé à partir du courrier {courrier.Reference}",
            WorkspaceId = courrier.WorkspaceId,
            RapporteurId = dto.RapporteurId,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        await _dossierRepository.AddAsync(dossier);

        // Lier le courrier au dossier
        courrier.DossierId = dossier.Id;
        courrier.Statut = StatutCourrier.EnTraitement;
        courrier.Historiques.Add(new CourrierHistorique
        {
            Id = Guid.NewGuid(),
            Action = "Dossier créé",
            Details = $"Dossier {dossier.NumeroDossier} créé à partir de ce courrier",
            AncienStatut = StatutCourrier.Recu.ToString(),
            NouveauStatut = StatutCourrier.EnTraitement.ToString(),
            UserId = userId,
            DateAction = DateTime.UtcNow
        });

        await _courrierRepository.UpdateAsync(courrier);
        await _courrierRepository.SaveChangesAsync();

        // Ajouter le document du courrier au dossier si présent
        if (!string.IsNullOrEmpty(courrier.DocumentData))
        {
            var document = new Document
            {
                Id = Guid.NewGuid(),
                DossierId = dossier.Id,
                NomFichier = courrier.NomFichier ?? $"Courrier_{courrier.Reference}",
                TypeDocument = "Courrier",
                MimeType = courrier.MimeType ?? "image/png",
                TailleFichier = courrier.TailleFichier ?? 0,
                FileData = courrier.DocumentData,
                UploadedBy = userId,
                UploadedAt = DateTime.UtcNow,
                NumeroVersion = 1
            };
            dossier.Documents.Add(document);
        }

        await _dossierRepository.SaveChangesAsync();

        return new DossierDto
        {
            Id = dossier.Id,
            NumeroDossier = dossier.NumeroDossier,
            Titre = dossier.Titre,
            Demandeur = dossier.Demandeur,
            DateDepot = dossier.DateDepot,
            Status = dossier.Status.ToString(),
            Priorite = dossier.Priorite.ToString()
        };
    }

    public async Task<CourrierDetailDto> ChangerStatutAsync(
        Guid id, StatutCourrier nouveauStatut, string? commentaire, Guid userId, UserRole userRole)
    {
        var courrier = await _courrierRepository.GetByIdAsync(id);
        if (courrier == null)
            throw new KeyNotFoundException("Courrier non trouvé");

        var ancienStatut = courrier.Statut;
        courrier.Statut = nouveauStatut;
        courrier.ModifiedAt = DateTime.UtcNow;
        courrier.ModifiedBy = userId;

        courrier.Historiques.Add(new CourrierHistorique
        {
            Id = Guid.NewGuid(),
            Action = "Changement de statut",
            Details = commentaire ?? $"Passage de {ancienStatut} à {nouveauStatut}",
            AncienStatut = ancienStatut.ToString(),
            NouveauStatut = nouveauStatut.ToString(),
            UserId = userId,
            DateAction = DateTime.UtcNow
        });

        await _courrierRepository.UpdateAsync(courrier);
        await _courrierRepository.SaveChangesAsync();

        return (await GetCourrierByIdAsync(id, userId, userRole))!;
    }

    public async Task<CourrierDetailDto> AssignerCourrierAsync(Guid id, Guid assigneAId, Guid userId, UserRole userRole)
    {
        var courrier = await _courrierRepository.GetByIdAsync(id);
        if (courrier == null)
            throw new KeyNotFoundException("Courrier non trouvé");

        var user = await _userRepository.GetByIdAsync(assigneAId);
        if (user == null)
            throw new KeyNotFoundException("Utilisateur non trouvé");

        courrier.AssigneAId = assigneAId;
        courrier.ModifiedAt = DateTime.UtcNow;
        courrier.ModifiedBy = userId;

        courrier.Historiques.Add(new CourrierHistorique
        {
            Id = Guid.NewGuid(),
            Action = "Attribution",
            Details = $"Courrier assigné à {user.NomComplet ?? user.Username}",
            UserId = userId,
            DateAction = DateTime.UtcNow
        });

        await _courrierRepository.UpdateAsync(courrier);
        await _courrierRepository.SaveChangesAsync();

        return (await GetCourrierByIdAsync(id, userId, userRole))!;
    }

    public async Task<CourrierDetailDto> LierAuDossierAsync(Guid courrierId, Guid dossierId, Guid userId, UserRole userRole)
    {
        var courrier = await _courrierRepository.GetByIdAsync(courrierId);
        if (courrier == null)
            throw new KeyNotFoundException("Courrier non trouvé");

        var dossier = await _dossierRepository.GetByIdAsync(dossierId);
        if (dossier == null)
            throw new KeyNotFoundException("Dossier non trouvé");

        courrier.DossierId = dossierId;
        courrier.ModifiedAt = DateTime.UtcNow;
        courrier.ModifiedBy = userId;

        courrier.Historiques.Add(new CourrierHistorique
        {
            Id = Guid.NewGuid(),
            Action = "Liaison dossier",
            Details = $"Lié au dossier {dossier.NumeroDossier}",
            UserId = userId,
            DateAction = DateTime.UtcNow
        });

        await _courrierRepository.UpdateAsync(courrier);
        await _courrierRepository.SaveChangesAsync();

        return (await GetCourrierByIdAsync(courrierId, userId, userRole))!;
    }

    public async Task<CourrierStatsDto> GetStatistiquesAsync(Guid? workspaceId, Guid userId, UserRole userRole)
    {
        var query = _courrierRepository.GetQueryable();

        if (workspaceId.HasValue)
            query = query.Where(c => c.WorkspaceId == workspaceId);

        var today = DateTime.UtcNow.Date;
        var weekStart = today.AddDays(-(int)today.DayOfWeek);

        var stats = await query
            .GroupBy(c => 1)
            .Select(g => new CourrierStatsDto
            {
                TotalCourriers = g.Count(),
                CourriersEntrants = g.Count(c => c.Type == TypeCourrier.Entrant),
                CourriersSortants = g.Count(c => c.Type == TypeCourrier.Sortant),
                EnAttente = g.Count(c => c.Statut == StatutCourrier.Recu),
                EnTraitement = g.Count(c => c.Statut == StatutCourrier.EnTraitement),
                Traites = g.Count(c => c.Statut == StatutCourrier.Traite),
                Urgents = g.Count(c => c.Urgence >= UrgenceCourrier.Urgente),
                ReceptionnesAujourdHui = g.Count(c => c.DateReception.Date == today),
                ReceptionnesCetteSemaine = g.Count(c => c.DateReception.Date >= weekStart)
            })
            .FirstOrDefaultAsync();

        return stats ?? new CourrierStatsDto();
    }

    public async Task<string> GenererReferenceAsync(TypeCourrier type)
    {
        var prefix = type == TypeCourrier.Entrant ? "CE" : "CS";
        var year = DateTime.UtcNow.Year;

        // Compter les courriers de ce type cette année
        var count = await _courrierRepository.GetQueryable()
            .CountAsync(c => c.Type == type && c.CreatedAt.Year == year);

        return $"{prefix}-{year}-{(count + 1):D4}";
    }

    private CourrierDetailDto MapToDetailDto(Courrier c)
    {
        return new CourrierDetailDto
        {
            Id = c.Id,
            Reference = c.Reference,
            Type = c.Type,
            Objet = c.Objet,
            Expediteur = c.Expediteur,
            Destinataire = c.Destinataire,
            DateCourrier = c.DateCourrier,
            DateReception = c.DateReception,
            Statut = c.Statut,
            Urgence = c.Urgence,
            ReferenceExterne = c.ReferenceExterne,
            TexteOCR = c.TexteOCR,
            ConfianceOCR = c.ConfianceOCR,
            Notes = c.Notes,
            NomFichier = c.NomFichier,
            MimeType = c.MimeType,
            TailleFichier = c.TailleFichier,
            HasDocument = !string.IsNullOrEmpty(c.DocumentData),
            DossierId = c.DossierId,
            DossierReference = c.Dossier?.NumeroDossier,
            DossierTitre = c.Dossier?.Titre,
            WorkspaceId = c.WorkspaceId,
            WorkspaceName = c.Workspace?.Name,
            AssigneAId = c.AssigneAId,
            AssigneANom = c.AssigneA?.NomComplet ?? c.AssigneA?.Username,
            CreatedBy = c.CreatedBy,
            CreatedByNom = c.CreatedByUser?.NomComplet ?? c.CreatedByUser?.Username,
            CreatedAt = c.CreatedAt,
            ModifiedAt = c.ModifiedAt,
            Historiques = c.Historiques.OrderByDescending(h => h.DateAction).Select(h => new CourrierHistoriqueDto
            {
                Id = h.Id,
                Action = h.Action,
                Details = h.Details,
                AncienStatut = h.AncienStatut,
                NouveauStatut = h.NouveauStatut,
                UserNom = h.User?.NomComplet ?? h.User?.Username ?? "Système",
                DateAction = h.DateAction
            }).ToList()
        };
    }
}
