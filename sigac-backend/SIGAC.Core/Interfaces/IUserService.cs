using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces;

public interface IUserService
{
    Task<UserDto?> GetByIdAsync(Guid id);
    Task<UserDto?> GetByUsernameAsync(string username);
    Task<PaginatedResult<UserDto>> GetUsersAsync(int page = 1, int pageSize = 10, string? search = null);
    Task<UserDto> CreateUserAsync(string username, string email, string passwordHash, UserRole role, Guid createdBy);
    Task<bool> UpdateUserAsync(Guid userId, string? email, UserRole? role, Guid updatedBy);
    Task<bool> DeleteUserAsync(Guid userId, Guid deletedBy);
    
    /// <summary>
    /// Change le password d'un utilisateur après vérification de l'ancien password.
    /// </summary>
    Task<bool> ChangePasswordAsync(Guid userId, string oldPassword, string newPassword, Guid changedBy);
    
    /// <summary>
    /// Désactive un utilisateur (soft delete).
    /// </summary>
    Task<bool> DeactivateUserAsync(Guid userId, Guid deactivatedBy);
    
    /// <summary>
    /// Réactive un utilisateur désactivé.
    /// </summary>
    Task<bool> ActivateUserAsync(Guid userId, Guid activatedBy);
    
    /// <summary>
    /// Vérifie le password d'un utilisateur.
    /// </summary>
    Task<bool> VerifyPasswordAsync(Guid userId, string password);
    
    /// <summary>
    /// Récupère un utilisateur avec vérification du password (pour authentification).
    /// </summary>
    Task<(User? User, bool PasswordValid)> GetByUsernameWithPasswordAsync(string username, string password);
}
