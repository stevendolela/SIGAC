namespace SIGAC.Core.Enums;

/// <summary>
/// Statut de disponibilité utilisateur (simplifié - 3 états)
/// </summary>
public enum UserStatus
{
    /// <summary>
    /// En ligne / Disponible (pastille verte) 🟢
    /// </summary>
    EnLigne = 0,
    
    /// <summary>
    /// Occupé / Ne pas déranger (pastille rouge) 🔴
    /// </summary>
    Occupe = 1,
    
    /// <summary>
    /// Absent / Inactif (pastille orange) 🟠
    /// </summary>
    Absent = 2
}
