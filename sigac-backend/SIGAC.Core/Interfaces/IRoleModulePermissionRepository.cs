using SIGAC.Core.Entities;
using SIGAC.Core.Enums;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Interface pour gérer les permissions d'accès aux modules par rôle
/// </summary>
public interface IRoleModulePermissionRepository
{
    /// <summary>
    /// Récupère toutes les permissions pour un rôle et optionnellement un workspace
    /// </summary>
    Task<List<RoleModulePermission>> GetByRoleAsync(UserRole role, Guid? workspaceId = null);

    /// <summary>
    /// Récupère la permission pour un rôle-module spécifique
    /// </summary>
    Task<RoleModulePermission?> GetAsync(UserRole role, string moduleKey, Guid? workspaceId = null);

    /// <summary>
    /// Récupère toutes les permissions pour tous les rôles
    /// </summary>
    Task<List<RoleModulePermission>> GetAllAsync(Guid? workspaceId = null);

    /// <summary>
    /// Ajoute une nouvelle permission
    /// </summary>
    Task AddAsync(RoleModulePermission permission);

    /// <summary>
    /// Met à jour une permission existante
    /// </summary>
    Task UpdateAsync(RoleModulePermission permission);

    /// <summary>
    /// Supprime une permission
    /// </summary>
    Task DeleteAsync(Guid permissionId);

    /// <summary>
    /// Sauvegarde les changements
    /// </summary>
    Task SaveChangesAsync();
}
