using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Service métier pour gérer les permissions d'accès aux modules par rôle utilisateur
/// </summary>
public interface IRoleModulePermissionService
{
    /// <summary>
    /// Récupère la matrice complète des permissions (tous les rôles x tous les modules)
    /// </summary>
    Task<PermissionsMatrixDto> GetPermissionsMatrixAsync(Guid? workspaceId = null);

    /// <summary>
    /// Récupère les permissions pour un rôle spécifique
    /// </summary>
    Task<List<RoleModulePermissionDto>> GetByRoleAsync(UserRole role, Guid? workspaceId = null);

    /// <summary>
    /// Récupère la permission pour un rôle-module spécifique
    /// </summary>
    Task<RoleModulePermissionDto?> GetPermissionAsync(UserRole role, string moduleKey, Guid? workspaceId = null);

    /// <summary>
    /// Vérifie si un rôle a accès à un module
    /// </summary>
    Task<bool> HasAccessAsync(UserRole role, string moduleKey, Guid? workspaceId = null);

    /// <summary>
    /// Vérifie si un rôle peut effectuer une action sur un module
    /// </summary>
    Task<bool> CanPerformActionAsync(UserRole role, string moduleKey, string action, Guid? workspaceId = null);

    /// <summary>
    /// Met à jour les permissions pour un rôle-module
    /// </summary>
    Task<RoleModulePermissionDto> UpdatePermissionAsync(
        UserRole role, 
        string moduleKey, 
        UpdateRoleModulePermissionDto dto, 
        Guid userId, 
        Guid? workspaceId = null);

    /// <summary>
    /// Met à jour plusieurs permissions en batch
    /// </summary>
    Task<List<RoleModulePermissionDto>> UpdateBatchAsync(
        List<(UserRole role, string moduleKey, UpdateRoleModulePermissionDto dto)> updates,
        Guid userId,
        Guid? workspaceId = null);

    /// <summary>
    /// Initialise les permissions par défaut pour tous les rôles
    /// </summary>
    Task InitializeDefaultPermissionsAsync(Guid? workspaceId = null);

    /// <summary>
    /// Exporte la matrice des permissions au format JSON
    /// </summary>
    Task<string> ExportMatrixAsJsonAsync(Guid? workspaceId = null);

    /// <summary>
    /// Importe les permissions depuis un JSON (pour backup/restore)
    /// </summary>
    Task ImportMatrixFromJsonAsync(string json, Guid userId, Guid? workspaceId = null);
}
