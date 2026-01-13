namespace SIGAC.Core.DTOs;

/// <summary>
/// Statistiques détaillées du tableau de bord
/// Supporte filtres temporels et vues multi-rôles
/// </summary>
public class DashboardStatisticsDto
{
    // === KPIs Génériques (GED standardisée) ===
    public int TotalDossiers { get; set; }
    public int NouveauxDossiers { get; set; }
    public int EnCours { get; set; }
    public int EnValidation { get; set; }
    public int Valides { get; set; }
    public int Termines { get; set; }
    public int Archives { get; set; }
    
    // === Distributions ===
    public Dictionary<string, int> ParType { get; set; } = new();
    public Dictionary<string, int> ParPriorite { get; set; } = new();
    public Dictionary<string, int> ParRapporteur { get; set; } = new();
    
    // === Métriques Temporelles (6 derniers mois) ===
    public List<TimelineDataDto> DossiersCreesParMois { get; set; } = new();
    public List<TimelineDataDto> DossiersCompletesParMois { get; set; } = new();
    
    // === Indicateurs de Performance ===
    public double TauxTraitementMoyen { get; set; } // %
    public double TempsTraitementMoyenJours { get; set; }
    public int DossiersEnRetard { get; set; } // Basé sur deadline vs status
    public int TachesEnAttente { get; set; }
    
    // === Documents ===
    public int TotalDocuments { get; set; }
    public int DocumentsUploadCeMois { get; set; }
    public long StorageUtilizedBytes { get; set; }
    public long StorageQuotaBytes { get; set; }
    public double StoragePercentage => StorageQuotaBytes > 0 
        ? (StorageUtilizedBytes / (double)StorageQuotaBytes) * 100 
        : 0;
    
    // === Activité Utilisateurs ===
    public int UtilisateursActifs { get; set; }
    public List<UserActivityDto> TopUtilisateurs { get; set; } = new();
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Données pour timeline (graphiques temporels)
/// </summary>
public class TimelineDataDto
{
    public string Mois { get; set; } // Format: "2025-12", "2026-01"
    public int Valeur { get; set; }
    public DateTime Date { get; set; }
}

/// <summary>
/// Activité d'un utilisateur
/// </summary>
public class UserActivityDto
{
    public Guid UserId { get; set; }
    public string NomUtilisateur { get; set; }
    public int NombreDossiersTraites { get; set; }
    public int NombreDocumentsUpload { get; set; }
    public DateTime DerniereActivite { get; set; }
}

// === Anciennes DTOs (compatibilité) ===
public class DossierStatisticsDto
{
    public int TotalDossiers { get; set; }
    public int NouveauxDossiers { get; set; }
    public int EnCours { get; set; }
    public int EnValidation { get; set; }
    public int Valides { get; set; }
    public int Termines { get; set; }
    public Dictionary<string, int> ParType { get; set; } = new();
    public Dictionary<string, int> ParPriorite { get; set; } = new();
}

public class DossierStatistics
{
    public int TotalDossiers { get; set; }
    public int NouveauxDossiers { get; set; }
    public int EnCours { get; set; }
    public int EnValidation { get; set; }
    public int Valides { get; set; }
    public int Termines { get; set; }
    public Dictionary<string, int> ParType { get; set; } = new();
    public Dictionary<string, int> ParPriorite { get; set; } = new();
}
