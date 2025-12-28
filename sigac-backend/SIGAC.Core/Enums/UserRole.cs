namespace SIGAC.Core.Enums;

/// <summary>
/// Rôles utilisateurs configurables selon le secteur d'activité
/// Les noms sont maintenus pour compatibilité, mais s'adaptent à différents contextes
/// </summary>
public enum UserRole
{
    /// <summary>
    /// Administrateur système - Accès complet à toutes les fonctionnalités
    /// Applicable à tous les secteurs
    /// </summary>
    Administrateur = 1,

    /// <summary>
    /// Directeur/Manager principal - Vue globale et gestion de tous les dossiers
    /// Exemples: Président (juridique), Directeur (entreprise), Chef de service (médical)
    /// </summary>
    President = 2,

    /// <summary>
    /// Responsable/Expert - Accès aux dossiers assignés, peut traiter et valider
    /// Exemples: Juge (juridique), Chef de projet (entreprise), Médecin (santé)
    /// </summary>
    JugeConstitutionnel = 3,

    /// <summary>
    /// Gestionnaire administratif - Gestion administrative des dossiers
    /// Exemples: Greffier (juridique), Assistant (entreprise), Secrétaire médical (santé)
    /// </summary>
    Greffier = 4,

    /// <summary>
    /// Assistant gestionnaire - Support administratif
    /// Exemples: Greffier adjoint (juridique), Assistant junior (entreprise)
    /// </summary>
    GreffierAdjoint = 5,

    /// <summary>
    /// Consultant externe - Accès limité en lecture sur dossiers assignés
    /// Exemples: Expert externe, Consultant, Auditeur
    /// </summary>
    Consultant = 6
}