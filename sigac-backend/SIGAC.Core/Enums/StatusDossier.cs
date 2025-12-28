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
    /// Exemples: En cours (général), En consultation (médical), En développement (projet)
    /// </summary>
    EnCours = 2,

    /// <summary>
    /// En attente de validation/révision
    /// Exemples: En validation (général), En révision (médical), En approbation (projet)
    /// </summary>
    EnValidation = 3,

    /// <summary>
    /// Dossier traité/validé
    /// Exemples: Validé (général), Approuvé (entreprise), Diagnostic établi (médical)
    /// </summary>
    Valide = 4,

    /// <summary>
    /// Dossier terminé/archivé
    /// Exemples: Terminé (général), Archivé (général), Clôturé (projet)
    /// </summary>
    Termine = 5
}