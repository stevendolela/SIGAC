namespace SIGAC.Core.Interfaces;

using SIGAC.Core.Entities;
using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByRefreshTokenAsync(string refreshToken);
    Task<User?> GetByPasswordResetTokenAsync(string token);
    Task<(List<User> Items, PaginationMetadata Pagination)> GetUsersAsync(int page = 1, int pageSize = 10, string? search = null);
    Task<(List<User> Items, PaginationMetadata Pagination)> GetDeletedUsersAsync(int page = 1, int pageSize = 10, string? search = null);
    Task<List<User>> GetByRoleAsync(UserRole role);
    Task AddAsync(User user);
    void Update(User user);
    void Delete(User user);
    Task SaveChangesAsync();
    
    // === Méthodes pour Dashboard ===
    /// <summary>Récupère le nombre d'utilisateurs actifs (connectés dernièrement)</summary>
    Task<int> GetActiveUsersCountAsync();
    
    /// <summary>Récupère le top des utilisateurs les plus actifs</summary>
    Task<List<UserActivityDto>> GetTopActiveUsersAsync(int limit = 5);

    /// <summary>Récupère le top des utilisateurs les plus actifs d'un workspace</summary>
    Task<List<UserActivityDto>> GetTopActiveUsersByWorkspaceAsync(Guid? workspaceId, int limit = 5);

    /// <summary>Récupère les temps de connexion des utilisateurs d'un workspace</summary>
    Task<List<UserConnectionDto>> GetWorkspaceUserConnectionsAsync(Guid workspaceId);
}
