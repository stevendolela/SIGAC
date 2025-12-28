namespace SIGAC.Core.Enums;

/// <summary>
/// Statut d'un dossier/projet dans le workflow
/// Adaptable selon le secteur d'activité (juridique, santé, entreprise, etc.)
/// </summary>
public enum StatusDossier
{
    /// <summary>
    /// Nouveau dossier créé, en attente de traitement
    /// Exemples: Nouveau dossier client, Nouvelle demande, Nouveau projet
    /// </summary>
    Nouveau = 1,

    /// <summary>
    /// Dossier en cours de traitement/analyse
    /// Exemples: En instruction (juridique), En consultation (médical), En développement (projet)
    /// </summary>
    EnInstruction = 2,

    /// <summary>
    /// En attente de validation/délibération
    /// Exemples: En délibéré (juridique), En validation (entreprise), En révision (médical)
    /// </summary>
    EnDelibere = 3,

    /// <summary>
    /// Dossier traité/validé
    /// Exemples: Jugé (juridique), Validé (entreprise), Diagnostic établi (médical)
    /// </summary>
    Juge = 4,

    /// <summary>
    /// Dossier archivé/terminé
    /// Exemples: Classé (juridique), Archivé (général), Clôturé (projet)
    /// </summary>
    Classe = 5
}