namespace SIGAC.Core.Enums;

/// <summary>
/// Statut de traitement d'un courrier
/// </summary>
public enum StatutCourrier
{
    Recu = 0,           // Courrier reçu, non traité
    EnTraitement = 1,   // En cours de traitement
    Traite = 2,         // Traitement terminé
    Archive = 3,        // Archivé
    Rejete = 4          // Rejeté/Annulé
}
