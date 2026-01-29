using SIGAC.Core.Enums;

namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour afficher les permissions d'un rôle sur un module
/// </summary>
public class RoleModulePermissionDto
{
    public Guid Id { get; set; }
    public string UserRole { get; set; } = string.Empty;
    public string ModuleKey { get; set; } = string.Empty;
    public string ModuleLabel { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool HasAccess { get; set; }
    public bool CanCreate { get; set; }
    public bool CanUpdate { get; set; }
    public bool CanDelete { get; set; }
    public bool CanExport { get; set; }
    public Guid? WorkspaceId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
}

/// <summary>
/// DTO pour créer/modifier une permission de rôle-module
/// </summary>
public class CreateRoleModulePermissionDto
{
    public UserRole UserRole { get; set; }
    public string ModuleKey { get; set; } = string.Empty;
    public string ModuleLabel { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool HasAccess { get; set; } = false;
    public bool CanCreate { get; set; } = false;
    public bool CanUpdate { get; set; } = false;
    public bool CanDelete { get; set; } = false;
    public bool CanExport { get; set; } = false;
    public Guid? WorkspaceId { get; set; }
}

/// <summary>
/// DTO pour mettre à jour une permission
/// </summary>
public class UpdateRoleModulePermissionDto
{
    public bool HasAccess { get; set; }
    public bool CanCreate { get; set; }
    public bool CanUpdate { get; set; }
    public bool CanDelete { get; set; }
    public bool CanExport { get; set; }
}

/// <summary>
/// DTO pour afficher la matrice complète des permissions
/// </summary>
public class PermissionsMatrixDto
{
    public List<ModuleDto> Modules { get; set; } = new();
    public List<string> Roles { get; set; } = new();
    public Dictionary<string, Dictionary<string, RolePermissionSummaryDto>> Matrix { get; set; } = new();
}

/// <summary>
/// Résumé d'une permission (pour la matrice)
/// </summary>
public class RolePermissionSummaryDto
{
    public bool HasAccess { get; set; }
    public bool CanCreate { get; set; }
    public bool CanUpdate { get; set; }
    public bool CanDelete { get; set; }
    public bool CanExport { get; set; }
}

/// <summary>
/// Descripteur de module pour l'UI
/// </summary>
public class ModuleDto
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
}
