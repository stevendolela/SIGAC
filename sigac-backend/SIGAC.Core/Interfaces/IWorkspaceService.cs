using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Service pour la gestion des workspaces (organisations)
/// </summary>
public interface IWorkspaceService
{
    /// <summary>
    /// Créer un nouveau workspace
    /// </summary>
    Task<WorkspaceDto> CreateWorkspaceAsync(CreateWorkspaceDto dto, Guid userId);
    
    /// <summary>
    /// Récupérer tous les workspaces auxquels l'utilisateur appartient
    /// </summary>
    Task<List<WorkspaceDto>> GetUserWorkspacesAsync(Guid userId);
    
    /// <summary>
    /// Récupérer un workspace par son ID
    /// </summary>
    Task<WorkspaceDto> GetWorkspaceByIdAsync(Guid workspaceId, Guid userId);
    
    /// <summary>
    /// Récupérer un workspace par son slug
    /// </summary>
    Task<WorkspaceDto> GetWorkspaceBySlugAsync(string slug, Guid userId);
    
    /// <summary>
    /// Mettre à jour un workspace
    /// </summary>
    Task<WorkspaceDto> UpdateWorkspaceAsync(Guid workspaceId, UpdateWorkspaceDto dto, Guid userId);
    
    /// <summary>
    /// Supprimer un workspace (soft delete)
    /// </summary>
    Task DeleteWorkspaceAsync(Guid workspaceId, Guid userId);
    
    /// <summary>
    /// Récupérer tous les membres d'un workspace
    /// </summary>
    Task<List<WorkspaceMemberDto>> GetWorkspaceMembersAsync(Guid workspaceId, Guid userId);
    
    /// <summary>
    /// Ajouter un membre au workspace
    /// </summary>
    Task AddMemberAsync(Guid workspaceId, AddWorkspaceMemberDto dto, Guid userId);
    
    /// <summary>
    /// Mettre à jour le rôle d'un membre
    /// </summary>
    Task UpdateMemberRoleAsync(Guid workspaceId, Guid memberId, WorkspaceRole newRole, Guid userId);
    
    /// <summary>
    /// Retirer un membre du workspace
    /// </summary>
    Task RemoveMemberAsync(Guid workspaceId, Guid memberId, Guid userId);
    
    /// <summary>
    /// Vérifier si l'utilisateur a les permissions minimales requises
    /// </summary>
    Task<bool> HasPermissionAsync(Guid workspaceId, Guid userId, WorkspaceRole minimumRole);
    
    /// <summary>
    /// Récupérer le rôle d'un utilisateur dans un workspace
    /// </summary>
    Task<WorkspaceRole?> GetUserRoleAsync(Guid workspaceId, Guid userId);
}
