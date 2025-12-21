namespace SIGAC.Core.Enums;

/// <summary>
/// Statut de disponibilité utilisateur (inspiré de Microsoft Teams)
/// </summary>
public enum UserStatus
{
    /// <summary>
    /// Disponible (pastille verte)
    /// </summary>
    Disponible = 0,
    
    /// <summary>
    /// Occupé (pastille rouge)
    /// </summary>
    Occupe = 1,
    
    /// <summary>
    /// Ne pas déranger (pastille rouge avec tiret)
    /// </summary>
    NePasDeranger = 2,
    
    /// <summary>
    /// Absent / De retour bientôt (pastille jaune)
    /// </summary>
    Absent = 3,
    
    /// <summary>
    /// Hors ligne (pastille grise)
    /// </summary>
    HorsLigne = 4,
    
    /// <summary>
    /// Apparaître absent (pastille jaune - utilisateur disponible mais veut paraître absent)
    /// </summary>
    ApparaitreAbsent = 5
}
