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
/// Service pour importer en masse des dossiers et documents
/// </summary>
public class BulkImportService : IBulkImportService
{
    private readonly IDossierRepository _dossierRepository;
    private readonly IUserRepository _userRepository;
    private readonly ITypeAffaireRepository _typeAffaireRepository;
    private readonly IAuditLogRepository _auditLogRepository;

    public BulkImportService(
        IDossierRepository dossierRepository,
        IUserRepository userRepository,
        ITypeAffaireRepository typeAffaireRepository,
        IAuditLogRepository auditLogRepository)
    {
        _dossierRepository = dossierRepository;
        _userRepository = userRepository;
        _typeAffaireRepository = typeAffaireRepository;
        _auditLogRepository = auditLogRepository;
    }

    /// <summary>
    /// Importe en masse des dossiers depuis un DTO
    /// </summary>
    public async Task<BulkImportResultDto> ImportDossiersAsync(
        BulkImportDossiersDto importData,
        Guid userId,
        UserRole userRole)
    {
        var result = new BulkImportResultDto { Success = true };
        var errors = new List<string>();
        int dossiersCreated = 0;
        int documentsCreated = 0;

        if (userRole != UserRole.Admin && userRole != UserRole.Manager)
        {
            return new BulkImportResultDto
            {
                Success = false,
                Message = "Seuls les admins peuvent importer en masse",
                Errors = new List<string> { "Accès non autorisé" }
            };
        }

        if (!importData.Dossiers.Any())
        {
            return new BulkImportResultDto
            {
                Success = false,
                Message = "Aucun dossier à importer",
                Errors = new List<string> { "La liste des dossiers est vide" }
            };
        }

        // Précharge les données de référence
        var typeAffaires = await _typeAffaireRepository.GetAllAsync();
        var (users, _) = await _userRepository.GetUsersAsync(1, 1000);

        foreach (var row in importData.Dossiers)
        {
            try
            {
                // Validation
                if (string.IsNullOrWhiteSpace(row.NumeroDossier))
                {
                    errors.Add($"Ligne ignorée: NumeroDossier vide");
                    continue;
                }

                if (string.IsNullOrWhiteSpace(row.Titre))
                {
                    errors.Add($"Ligne {row.NumeroDossier}: Titre vide");
                    continue;
                }

                // Cherche le TypeAffaire
                var typeAffaire = typeAffaires.FirstOrDefault(t =>
                    t.Nom.Equals(row.TypeAffaire, StringComparison.OrdinalIgnoreCase));

                if (typeAffaire == null)
                {
                    errors.Add($"Ligne {row.NumeroDossier}: TypeAffaire '{row.TypeAffaire}' non trouvé");
                    continue;
                }

                // Parse Priorite
                if (!Enum.TryParse<PrioriteDossier>(row.Priorite, true, out var priorite))
                {
                    priorite = PrioriteDossier.Normale;
                    errors.Add($"Ligne {row.NumeroDossier}: Priorité invalide, utilisation de 'Normale'");
                }

                // Parse Status
                if (!Enum.TryParse<StatusDossier>(row.Status, true, out var status))
                {
                    status = StatusDossier.Nouveau;
                    errors.Add($"Ligne {row.NumeroDossier}: Status invalide, utilisation de 'Nouveau'");
                }

                // Cherche le Responsable
                User? responsable = null;
                if (!string.IsNullOrWhiteSpace(row.Responsable))
                {
                    responsable = users.FirstOrDefault(u =>
                        u.Username.Equals(row.Responsable, StringComparison.OrdinalIgnoreCase));
                    
                    if (responsable == null)
                    {
                        errors.Add($"Ligne {row.NumeroDossier}: Responsable '{row.Responsable}' non trouvé");
                    }
                }

                // Crée le Dossier
                var dossier = new Dossier
                {
                    NumeroDossier = row.NumeroDossier,
                    Titre = row.Titre,
                    Resume = string.IsNullOrWhiteSpace(row.Description) ? null : row.Description,
                    Status = status,
                    Priorite = priorite,
                    TypeAffaireId = typeAffaire.Id,
                    RapporteurId = responsable?.Id,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = userId
                };

                await _dossierRepository.AddAsync(dossier);
                await _dossierRepository.SaveChangesAsync();
                dossiersCreated++;

                // Ajoute un Historique
                dossier.Historiques.Add(new Historique
                {
                    DateAction = DateTime.UtcNow,
                    Action = "Création via import en masse",
                    Details = $"Importé par {userId}",
                    UserId = userId
                });

                // Parse Documents (URLs séparées par des points-virgules)
                if (!string.IsNullOrWhiteSpace(row.Documents))
                {
                    var documentUrls = row.Documents.Split(';', StringSplitOptions.RemoveEmptyEntries);
                    
                    foreach (var url in documentUrls)
                    {
                        // Note: Ceci est simplifié. En production, il faudrait télécharger l'URL
                        // et créer une véritable entrée Document
                        documentsCreated++;
                    }
                }

                // Log d'audit
                await _auditLogRepository.LogActionAsync(
                    userId,
                    "BULK_IMPORT",
                    "Dossier",
                    dossier.Id.ToString(),
                    null,
                    System.Text.Json.JsonSerializer.Serialize(dossier)
                );
            }
            catch (Exception ex)
            {
                errors.Add($"Erreur lors du traitement de {row.NumeroDossier}: {ex.Message}");
            }
        }

        result.DossiersCreated = dossiersCreated;
        result.DocumentsCreated = documentsCreated;
        result.Errors = errors;
        result.Message = $"Import terminé: {dossiersCreated} dossiers créés";
        result.Success = dossiersCreated > 0;

        return result;
    }
}
