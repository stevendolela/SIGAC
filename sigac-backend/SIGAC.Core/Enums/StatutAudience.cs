namespace SIGAC.Core.Enums;

/// <summary>
/// Statut d'un événement/rendez-vous/audience
/// Applicable à tous secteurs: réunions, consultations, audiences juridiques, etc.
/// </summary>
public enum StatutAudience
{
    /// <summary>
    /// Événement planifié
    /// Exemples: Audience planifiée (juridique), Réunion planifiée (entreprise), Consultation prévue (médical)
    /// </summary>
    Planifiee = 1,

    /// <summary>
    /// Événement confirmé par les participants
    /// Applicable à tous types d'événements
    /// </summary>
    Confirmee = 2,

    /// <summary>
    /// Événement reporté à une date ultérieure
    /// Applicable à tous types d'événements
    /// </summary>
    Reportee = 3,

    /// <summary>
    /// Événement annulé définitivement
    /// Applicable à tous types d'événements
    /// </summary>
    Annulee = 4,

    /// <summary>
    /// Audience tenue
    /// </summary>
    Tenue = 5
}
