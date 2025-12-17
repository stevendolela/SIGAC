namespace SIGAC.Core.Enums;

/// <summary>
/// Rôles utilisateur au niveau Workspace (organisation)
/// </summary>
public enum WorkspaceRole
{
    /// <summary>
    /// Propriétaire du workspace (tous les droits)
    /// </summary>
    Owner = 0,
    
    /// <summary>
    /// Administrateur (gestion membres, projets, config)
    /// </summary>
    Admin = 1,
    
    /// <summary>
    /// Membre standard (accès projets assignés)
    /// </summary>
    Member = 2,
    
    /// <summary>
    /// Invité (lecture seule)
    /// </summary>
    Guest = 3
}
