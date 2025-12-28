namespace SIGAC.Core.Enums;

/// <summary>
/// Type d'événement/rendez-vous/audience
/// Les valeurs sont configurables selon le secteur d'activité
/// </summary>
public enum TypeAudience
{
    /// <summary>
    /// Événement/Réunion préliminaire ou de préparation
    /// Exemples: Audience préliminaire (juridique), Réunion kick-off (projet), Première consultation (médical)
    /// </summary>
    Preliminaire = 1,

    /// <summary>
    /// Présentation ou plaidoirie
    /// Exemples: Plaidoirie (juridique), Présentation client (entreprise), Exposé de cas (médical)
    /// </summary>
    Plaidoirie = 2,

    /// <summary>
    /// Session de délibération ou validation
    /// Exemples: Délibéré (juridique), Comité de validation (entreprise), Conseil médical (santé)
    /// </summary>
    Delibere = 3,

    /// <summary>
    /// Annonce de décision ou communication officielle
    /// Exemples: Prononcé (juridique), Présentation de résultats (entreprise), Annonce diagnostic (médical)
    /// </summary>
    Prononce = 4,

    /// <summary>
    /// Session de travail ou d'analyse
    /// Exemples: Instruction (juridique), Réunion de travail (entreprise), Consultation approfondie (médical)
    /// </summary>
    Instruction = 5,

    /// <summary>
    /// Audience de mise en état
    /// </summary>
    MiseEnEtat = 6
}
