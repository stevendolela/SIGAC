using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Diagnostics;

namespace SIGAC.Core.Services;

/// <summary>
/// Service de tableau de bord avec métriques avancées
/// Gestion multi-rôles et filtres temporels
/// </summary>
public class DashboardService : IDashboardService
{
    private readonly IDossierRepository _dossierRepository;
    private readonly IDocumentRepository _documentRepository;
    private readonly IUserRepository _userRepository;

    public DashboardService(
        IDossierRepository dossierRepository,
        IDocumentRepository documentRepository,
        IUserRepository userRepository)
    {
        _dossierRepository = dossierRepository;
        _documentRepository = documentRepository;
        _userRepository = userRepository;
    }

    /// <summary>
    /// Récupère les statistiques complètes du tableau de bord
    /// </summary>
    public async Task<DashboardStatisticsDto> GetStatisticsAsync(
        Guid userId, 
        UserRole userRole, 
        int periodeDays = 0,
        Guid? workspaceId = null)
    {
        try
        {
            var startDate = periodeDays > 0 
                ? DateTime.UtcNow.AddDays(-periodeDays) 
                : new DateTime(2000, 1, 1);

            // Filtre par rapporteur pour les collaborateurs
            Guid? rapporteurFilter = userRole == UserRole.Collaborateur ? userId : null;

            // === Récupère TOUS les dossiers filtrés par période ET workspace ===
            var allDossiers = await _dossierRepository.GetDossiersModifiedSinceAsync(
                startDate, rapporteurFilter, workspaceId);

            if (allDossiers == null)
                allDossiers = new List<Dossier>();

            // === KPIs filtrés par période ===
            var totalDossiers = allDossiers.Count;
            var nouveaux = allDossiers.Count(d => d.Status == StatusDossier.Nouveau);
            var enCours = allDossiers.Count(d => d.Status == StatusDossier.EnCours);
            var enValidation = allDossiers.Count(d => d.Status == StatusDossier.EnValidation);
            var valides = allDossiers.Count(d => d.Status == StatusDossier.Valide);
            var termines = allDossiers.Count(d => d.Status == StatusDossier.Termine);

            // === Distributions filtrées par période ===
            var parType = new Dictionary<string, int>();
            var parPriorite = new Dictionary<string, int>();

            if (allDossiers.Any())
            {
                parType = allDossiers
                    .Where(d => d?.TypeAffaire != null)
                    .GroupBy(d => d.TypeAffaire.Nom ?? "Non spécifié")
                    .Where(g => !string.IsNullOrEmpty(g.Key))
                    .ToDictionary(g => g.Key, g => g.Count());

                parPriorite = allDossiers
                    .Where(d => d != null)
                    .GroupBy(d => d.Priorite.ToString() ?? "Non spécifiée")
                    .Where(g => !string.IsNullOrEmpty(g.Key))
                    .ToDictionary(g => g.Key, g => g.Count());
            }

            // === Timeline (derniers 6 mois) ===
            var timelineCreated = BuildTimelineData(allDossiers.Where(d => d.CreatedAt >= startDate).ToList());
            var timelineCompleted = BuildTimelineData(allDossiers.Where(d => d.Status == StatusDossier.Valide && d.ModifiedAt.HasValue && d.ModifiedAt.Value >= startDate).ToList());

            // === Indicateurs de performance ===
            var tauxTraitement = totalDossiers > 0 
                ? (valides / (double)totalDossiers) * 100 
                : 0;

            var dossiersCompletes = allDossiers.Where(d => d.Status == StatusDossier.Valide).ToList();
            var tempsTraitement = CalculateAverageProcessingTime(dossiersCompletes);

            // === Documents ===
            DocumentStatsDto? docsStats = null;
            try
            {
                docsStats = await _documentRepository.GetStatisticsAsync(rapporteurFilter);
            }
            catch
            {
                docsStats = new DocumentStatsDto 
                { 
                    TotalDocuments = 0, 
                    DocumentsThisMonth = 0, 
                    StorageUtilizedBytes = 0, 
                    StorageQuotaBytes = 0 
                };
            }

            // === Utilisateurs actifs (Admin only) ===
            var activeUsers = 0;
            var topUsers = new List<UserActivityDto>();
            var userConnections = new List<UserConnectionDto>();
            
            if (userRole == UserRole.Admin || userRole == UserRole.Manager)
            {
                try
                {
                    activeUsers = await _userRepository.GetActiveUsersCountAsync();
                    // Récupère les top utilisateurs du workspace si disponible
                    topUsers = await _userRepository.GetTopActiveUsersByWorkspaceAsync(workspaceId, 5);
                    
                    System.Diagnostics.Debug.WriteLine($"[Dashboard] Admin/Manager detected. WorkspaceId={workspaceId}, HasValue={workspaceId.HasValue}");
                    System.Diagnostics.Debug.WriteLine($"[Dashboard] ✓ Fetched {topUsers.Count} top active users");
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Dashboard] ✗ Exception in top users block: {ex.GetType().Name}: {ex.Message}\n{ex.StackTrace}");
                    activeUsers = 0;
                    topUsers = new List<UserActivityDto>();
                    userConnections = new List<UserConnectionDto>();
                }
            }

            return new DashboardStatisticsDto
            {
                // KPIs - tous filtrés par période
                TotalDossiers = totalDossiers,
                NouveauxDossiers = nouveaux,
                EnCours = enCours,
                EnValidation = enValidation,
                Valides = valides,
                Termines = termines,
                Archives = 0,

                // Distributions filtrées par période
                ParType = parType,
                ParPriorite = parPriorite,
                ParRapporteur = parType,

                // Timeline
                DossiersCreesParMois = timelineCreated,
                DossiersCompletesParMois = timelineCompleted,

                // Performance
                TauxTraitementMoyen = tauxTraitement,
                TempsTraitementMoyenJours = tempsTraitement,
                DossiersEnRetard = 0,
                TachesEnAttente = nouveaux + enCours + enValidation,

                // Documents & Storage
                TotalDocuments = docsStats?.TotalDocuments ?? 0,
                DocumentsUploadCeMois = docsStats?.DocumentsThisMonth ?? 0,
                StorageUtilizedBytes = docsStats?.StorageUtilizedBytes ?? 0,
                StorageQuotaBytes = docsStats?.StorageQuotaBytes ?? 0,

                // Activité
                UtilisateursActifs = activeUsers,
                TopUtilisateurs = topUsers,
                UserConnections = userConnections,
                LastUpdated = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"DashboardService.GetStatisticsAsync Error: {ex.Message}");
            throw;
        }
    }

    /// <summary>
    /// Récupère les statistiques pour une période spécifique
    /// </summary>
    public async Task<DashboardStatisticsDto> GetStatisticsForPeriodAsync(
        Guid userId,
        UserRole userRole,
        DateTime dateDebut,
        DateTime dateFin)
    {
        if (dateDebut >= dateFin)
            throw new ArgumentException("La date de début doit être antérieure à la date de fin");

        var days = (int)(dateFin - dateDebut).TotalDays;
        return await GetStatisticsAsync(userId, userRole, days);
    }

    /// <summary>
    /// Récupère la timeline des dossiers créés
    /// </summary>
    public async Task<List<TimelineDataDto>> GetDossiersCreatedTimelineAsync(
        Guid userId, 
        UserRole userRole)
    {
        Guid? rapporteurFilter = userRole == UserRole.Collaborateur ? userId : (Guid?)null;
        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);

        var dossiers = await _dossierRepository.GetDossiersCreatedSinceAsync(
            sixMonthsAgo, rapporteurFilter);

        return BuildTimelineData(dossiers);
    }

    /// <summary>
    /// Récupère la timeline des dossiers complétés
    /// </summary>
    public async Task<List<TimelineDataDto>> GetDossiersCompletedTimelineAsync(
        Guid userId, 
        UserRole userRole)
    {
        Guid? rapporteurFilter = userRole == UserRole.Collaborateur ? userId : (Guid?)null;
        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);

        var dossiers = await _dossierRepository.GetDossiersCompletedSinceAsync(
            sixMonthsAgo, rapporteurFilter);

        return BuildTimelineData(dossiers);
    }

    /// <summary>
    /// Récupère le top des utilisateurs actifs (Admin only)
    /// </summary>
    public async Task<List<UserActivityDto>> GetTopUsersAsync(int limit = 5)
    {
        return await _userRepository.GetTopActiveUsersAsync(limit);
    }

    /// <summary>
    /// Récupère les statistiques de stockage
    /// </summary>
    public async Task<StorageStatisticsDto> GetStorageStatisticsAsync(Guid workspaceId)
    {
        return await _documentRepository.GetStorageStatisticsAsync(workspaceId);
    }

    // === Helpers Privés ===

    /// <summary>
    /// Construit les données de timeline par mois
    /// </summary>
    private List<TimelineDataDto> BuildTimelineData(List<Dossier> dossiers)
    {
        var timeline = new List<TimelineDataDto>();

        // Agrège par mois
        var grouped = dossiers
            .GroupBy(d => new { d.CreatedAt.Year, d.CreatedAt.Month })
            .OrderBy(g => g.Key.Year)
            .ThenBy(g => g.Key.Month)
            .ToList();

        foreach (var group in grouped)
        {
            var moisStr = $"{group.Key.Year}-{group.Key.Month:D2}";
            timeline.Add(new TimelineDataDto
            {
                Mois = moisStr,
                Valeur = group.Count(),
                Date = new DateTime(group.Key.Year, group.Key.Month, 1)
            });
        }

        // Complète les mois manquants (derniers 6 mois)
        return FillMissingMonths(timeline, 6);
    }

    /// <summary>
    /// Remplit les mois manquants avec des zéros
    /// </summary>
    private List<TimelineDataDto> FillMissingMonths(List<TimelineDataDto> timeline, int monthsBack)
    {
        var result = new Dictionary<string, TimelineDataDto>();
        var now = DateTime.UtcNow;

        // Initialise les 6 derniers mois avec 0
        for (int i = monthsBack - 1; i >= 0; i--)
        {
            var date = now.AddMonths(-i);
            var key = $"{date.Year}-{date.Month:D2}";
            result[key] = new TimelineDataDto
            {
                Mois = key,
                Valeur = 0,
                Date = new DateTime(date.Year, date.Month, 1)
            };
        }

        // Remplace avec les données réelles
        foreach (var item in timeline)
        {
            if (result.ContainsKey(item.Mois))
                result[item.Mois].Valeur = item.Valeur;
        }

        return result.Values.OrderBy(x => x.Date).ToList();
    }

    /// <summary>
    /// Calcule le temps moyen de traitement en jours
    /// </summary>
    private double CalculateAverageProcessingTime(List<Dossier> dossiersCompletes)
    {
        if (!dossiersCompletes.Any())
            return 0;

        var totalDays = dossiersCompletes.Sum(d =>
            ((d.ModifiedAt ?? DateTime.UtcNow) - d.CreatedAt).TotalDays);

        return Math.Round(totalDays / (double)dossiersCompletes.Count(), 2);
    }
}
