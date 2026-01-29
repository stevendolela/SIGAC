using SIGAC.Core.Enums;

namespace SIGAC.Core.Entities;

/// <summary>
/// Gestion des permissions d'accès aux modules par rôle utilisateur
/// Permet une configuration granulaire des droits pour chaque rôle sur chaque module applicatif
/// </summary>
public class RoleModulePermission
{
    /// <summary>
    /// Identifiant unique
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Rôle utilisateur auquel s'applique cette permission
    /// </summary>
    public UserRole UserRole { get; set; }

    /// <summary>
    /// Clé du module (ex: 'dashboard', 'documents', 'dossiers', 'chat', etc.)
    /// </summary>
    public string ModuleKey { get; set; } = string.Empty;

    /// <summary>
    /// Label lisible du module
    /// </summary>
    public string ModuleLabel { get; set; } = string.Empty;

    /// <summary>
    /// Description du module et son rôle
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Indique si ce rôle a accès au module
    /// </summary>
    public bool HasAccess { get; set; } = false;

    /// <summary>
    /// Peut créer des ressources dans ce module
    /// </summary>
    public bool CanCreate { get; set; } = false;

    /// <summary>
    /// Peut modifier les ressources dans ce module
    /// </summary>
    public bool CanUpdate { get; set; } = false;

    /// <summary>
    /// Peut supprimer les ressources dans ce module
    /// </summary>
    public bool CanDelete { get; set; } = false;

    /// <summary>
    /// Peut exporter/télécharger les ressources
    /// </summary>
    public bool CanExport { get; set; } = false;

    /// <summary>
    /// Workspace auquel s'applique cette permission (null = permissions globales du système)
    /// </summary>
    public Guid? WorkspaceId { get; set; }

    /// <summary>
    /// Horodatage de création
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Horodatage de dernière modification
    /// </summary>
    public DateTime? ModifiedAt { get; set; }

    /// <summary>
    /// Utilisateur qui a configuré cette permission (pour audit)
    /// </summary>
    public Guid? ConfiguredByUserId { get; set; }

    // Relations
    public Workspace? Workspace { get; set; }
}
