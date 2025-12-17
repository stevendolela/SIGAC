using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Repository pour la gestion des workspaces
/// </summary>
public interface IWorkspaceRepository
{
    /// <summary>
    /// Récupérer un workspace par ID
    /// </summary>
    Task<Workspace?> GetByIdAsync(Guid id, bool includeMembers = false, bool includeProjects = false, bool includeOwner = false);
    
    /// <summary>
    /// Récupérer un workspace par slug
    /// </summary>
    Task<Workspace?> GetBySlugAsync(string slug, bool includeMembers = false, bool includeOwner = false);
    
    /// <summary>
    /// Récupérer tous les workspaces d'un utilisateur
    /// </summary>
    Task<List<Workspace>> GetUserWorkspacesAsync(Guid userId);
    
    /// <summary>
    /// Vérifier si un slug existe déjà
    /// </summary>
    Task<bool> SlugExistsAsync(string slug, Guid? excludeWorkspaceId = null);
    
    /// <summary>
    /// Ajouter un workspace
    /// </summary>
    Task AddAsync(Workspace workspace);
    
    /// <summary>
    /// Mettre à jour un workspace
    /// </summary>
    Task UpdateAsync(Workspace workspace);
    
    /// <summary>
    /// Supprimer un workspace
    /// </summary>
    Task DeleteAsync(Guid id);
    
    /// <summary>
    /// Sauvegarder les changements
    /// </summary>
    Task SaveChangesAsync();
    
    /// <summary>
    /// Récupérer le membership d'un utilisateur dans un workspace
    /// </summary>
    Task<WorkspaceUser?> GetMembershipAsync(Guid workspaceId, Guid userId);
    
    /// <summary>
    /// Récupérer tous les membres d'un workspace
    /// </summary>
    Task<List<WorkspaceUser>> GetWorkspaceMembersAsync(Guid workspaceId, bool includeInactive = false);
    
    /// <summary>
    /// Ajouter un membre au workspace
    /// </summary>
    Task AddMemberAsync(WorkspaceUser member);
    
    /// <summary>
    /// Retirer un membre du workspace
    /// </summary>
    Task RemoveMemberAsync(Guid workspaceId, Guid userId);
}
