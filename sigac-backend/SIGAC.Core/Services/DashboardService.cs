using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;

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
        int periodeDays = 0)
    {
        try
        {
            var startDate = periodeDays > 0 
                ? DateTime.UtcNow.AddDays(-periodeDays) 
                : new DateTime(2000, 1, 1);

            // Filtre par rapporteur pour les collaborateurs
            Guid? rapporteurFilter = userRole == UserRole.Collaborateur ? userId : null;

            // === Dossiers filtrés par période (source de vérité) ===
            var dossiersCreated = await _dossierRepository.GetDossiersCreatedSinceAsync(
                startDate, rapporteurFilter);
            var dossiersCompleted = await _dossierRepository.GetDossiersCompletedSinceAsync(
                startDate, rapporteurFilter);
            var dossiersModified = await _dossierRepository.GetDossiersModifiedSinceAsync(
                startDate, rapporteurFilter);
            
            // Combine en HashSet pour éviter les doublons efficacement
            var allDossierIds = new HashSet<Guid>();
            var allDossiers = new List<Dossier>();
            
            foreach (var d in dossiersCreated.Concat(dossiersCompleted).Concat(dossiersModified))
            {
                if (allDossierIds.Add(d.Id))
                {
                    allDossiers.Add(d);
                }
            }

            // === KPIs filtrés par période ===
            var totalDossiers = allDossiers.Count;
            var nouveaux = allDossiers.Count(d => d.Status == StatusDossier.Nouveau);
            var enCours = allDossiers.Count(d => d.Status == StatusDossier.EnCours);
            var enValidation = allDossiers.Count(d => d.Status == StatusDossier.EnValidation);
            var valides = allDossiers.Count(d => d.Status == StatusDossier.Valide);
            var termines = allDossiers.Count(d => d.Status == StatusDossier.Termine);

            // === Distributions filtrées par période ===
            var parType = allDossiers
                .GroupBy(d => d.TypeAffaire.ToString())
                .Where(g => !string.IsNullOrEmpty(g.Key))
                .ToDictionary(g => g.Key, g => g.Count());

            var parPriorite = allDossiers
                .GroupBy(d => d.Priorite.ToString())
                .Where(g => !string.IsNullOrEmpty(g.Key))
                .ToDictionary(g => g.Key, g => g.Count());

            // === Timeline (derniers 6 mois) ===
            var timelineCreated = BuildTimelineData(dossiersCreated);
            var timelineCompleted = BuildTimelineData(dossiersCompleted);

            // === Indicateurs de performance ===
            var tauxCompletion = totalDossiers > 0 
                ? (valides / (double)totalDossiers) * 100 
                : 0;

            var tempsTraitement = CalculateAverageProcessingTime(dossiersCompleted);

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
            if (userRole == UserRole.Admin)
            {
                try
                {
                    activeUsers = await _userRepository.GetActiveUsersCountAsync();
                    topUsers = await _userRepository.GetTopActiveUsersAsync(5);
                }
                catch
                {
                    activeUsers = 0;
                    topUsers = new List<UserActivityDto>();
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
                ParType = parType ?? new Dictionary<string, int>(),
                ParPriorite = parPriorite ?? new Dictionary<string, int>(),
                ParRapporteur = parType ?? new Dictionary<string, int>(),

                // Timeline
                DossiersCreesParMois = timelineCreated,
                DossiersCompletesParMois = timelineCompleted,

                // Performance
                TauxCompletionMoyen = tauxCompletion,
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
                LastUpdated = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            // Log l'erreur exacte pour debug
            System.Diagnostics.Debug.WriteLine($"DashboardService.GetStatisticsAsync Error: {ex.Message}");
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
