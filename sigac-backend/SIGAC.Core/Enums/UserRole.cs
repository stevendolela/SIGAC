namespace SIGAC.Core.Enums;

/// <summary>
/// Rôles utilisateurs génériques adaptables à tous les secteurs d'activité
/// (Juridique, Santé, Entreprise, Administration, etc.)
/// </summary>
public enum UserRole
{
    /// <summary>
    /// Administrateur système - Accès complet à toutes les fonctionnalités
    /// Applicable à tous les secteurs
    /// </summary>
    Admin = 1,

    /// <summary>
    /// Manager/Directeur - Vue globale et gestion de tous les dossiers
    /// Exemples: Président (juridique), Directeur (entreprise), Chef de service (médical)
    /// </summary>
    Manager = 2,

    /// <summary>
    /// Collaborateur principal - Accès aux dossiers assignés, peut traiter et valider
    /// Exemples: Juge (juridique), Chef de projet (entreprise), Médecin (santé)
    /// </summary>
    Collaborateur = 3,

    /// <summary>
    /// Assistant - Gestion administrative des dossiers
    /// Exemples: Greffier (juridique), Assistant (entreprise), Secrétaire médical (santé)
    /// </summary>
    Assistant = 4,

    /// <summary>
    /// Assistant Junior - Support administratif
    /// Exemples: Greffier adjoint (juridique), Stagiaire (entreprise)
    /// </summary>
    AssistantJunior = 5,

    /// <summary>
    /// Consultant externe - Accès limité en lecture sur dossiers assignés
    /// Exemples: Expert externe, Consultant, Auditeur
    /// </summary>
    Consultant = 6
}