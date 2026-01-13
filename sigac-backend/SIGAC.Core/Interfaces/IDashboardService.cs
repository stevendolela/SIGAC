using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Service de tableau de bord avec métriques avancées
/// Supporte filtres temporels et vues multi-rôles
/// </summary>
public interface IDashboardService
{
    /// <summary>
    /// Récupère les statistiques complètes du tableau de bord
    /// </summary>
    /// <param name="userId">Utilisateur connecté</param>
    /// <param name="userRole">Rôle de l'utilisateur (pour RBAC)</param>
    /// <param name="periodeDays">Nombre de jours à analyser (0 = tous les temps)</param>
    /// <returns>Statistiques enrichies</returns>
    Task<DashboardStatisticsDto> GetStatisticsAsync(
        Guid userId, 
        UserRole userRole, 
        int periodeDays = 0);

    /// <summary>
    /// Récupère les statistiques pour une période spécifique
    /// </summary>
    Task<DashboardStatisticsDto> GetStatisticsForPeriodAsync(
        Guid userId,
        UserRole userRole,
        DateTime dateDebut,
        DateTime dateFin);

    /// <summary>
    /// Récupère la timeline des dossiers créés (derniers 6 mois)
    /// </summary>
    Task<List<TimelineDataDto>> GetDossiersCreatedTimelineAsync(Guid userId, UserRole userRole);

    /// <summary>
    /// Récupère la timeline des dossiers complétés (derniers 6 mois)
    /// </summary>
    Task<List<TimelineDataDto>> GetDossiersCompletedTimelineAsync(Guid userId, UserRole userRole);

    /// <summary>
    /// Récupère le top des utilisateurs les plus actifs
    /// </summary>
    Task<List<UserActivityDto>> GetTopUsersAsync(int limit = 5);

    /// <summary>
    /// Récupère les statistiques de stockage
    /// </summary>
    Task<StorageStatisticsDto> GetStorageStatisticsAsync(Guid workspaceId);
}

/// <summary>
/// DTO pour statistiques de stockage
/// </summary>
public class StorageStatisticsDto
{
    public long TotalUtilizedBytes { get; set; }
    public long QuotaBytes { get; set; }
    public int TotalDocuments { get; set; }
    public int DocumentsThisMonth { get; set; }
    public Dictionary<string, long> BytesByDocumentType { get; set; } = new();
    public double PercentageUsed => QuotaBytes > 0 
        ? (TotalUtilizedBytes / (double)QuotaBytes) * 100 
        : 0;
}
