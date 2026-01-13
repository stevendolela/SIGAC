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

            // === KPIs de base ===
            var stats = await _dossierRepository.GetStatisticsAsync(rapporteurFilter);

            // === Dossiers filtrés par période ===
            var dossiersCreated = await _dossierRepository.GetDossiersCreatedSinceAsync(
                startDate, rapporteurFilter);
            var dossiersCompleted = await _dossierRepository.GetDossiersCompletedSinceAsync(
                startDate, rapporteurFilter);

            // === Timeline (derniers 6 mois) ===
            var timelineCreated = BuildTimelineData(dossiersCreated);
            var timelineCompleted = BuildTimelineData(dossiersCompleted);

            // === Indicateurs de performance ===
            var tauxCompletion = stats.TotalDossiers > 0 
                ? (stats.Valides / (double)stats.TotalDossiers) * 100 
                : 0;

            var tempsTraitement = CalculateAverageProcessingTime(dossiersCompleted);

            // === Documents ===
            var docsStats = await _documentRepository.GetStatisticsAsync(rapporteurFilter);

            // === Utilisateurs actifs (Admin only) ===
            var activeUsers = 0;
            var topUsers = new List<UserActivityDto>();
            if (userRole == UserRole.Admin)
            {
                activeUsers = await _userRepository.GetActiveUsersCountAsync();
                topUsers = await _userRepository.GetTopActiveUsersAsync(5);
            }

            return new DashboardStatisticsDto
            {
                // KPIs
                TotalDossiers = stats.TotalDossiers,
                NouveauxDossiers = stats.NouveauxDossiers,
                EnCours = stats.EnCours,
                EnValidation = stats.EnValidation,
                Valides = stats.Valides,
                Termines = stats.Termines,
                Archives = 0, // À implémenter selon votre modèle

                // Distributions
                ParType = stats.ParType,
                ParPriorite = stats.ParPriorite,
                ParRapporteur = stats.ParType, // À adapter selon schema

                // Timeline
                DossiersCreesParMois = timelineCreated,
                DossiersCompletesParMois = timelineCompleted,

                // Performance
                TauxCompletionMoyen = tauxCompletion,
                TempsTraitementMoyenJours = tempsTraitement,
                DossiersEnRetard = 0, // À implémenter selon règles métier
                TachesEnAttente = stats.NouveauxDossiers + stats.EnCours + stats.EnValidation,

                // Documents & Storage
                TotalDocuments = docsStats.TotalDocuments,
                DocumentsUploadCeMois = docsStats.DocumentsThisMonth,
                StorageUtilizedBytes = docsStats.StorageUtilizedBytes,
                StorageQuotaBytes = docsStats.StorageQuotaBytes,

                // Activité
                UtilisateursActifs = activeUsers,
                TopUtilisateurs = topUsers,
                LastUpdated = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
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
