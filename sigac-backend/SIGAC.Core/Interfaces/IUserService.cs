using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;
using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces;

public interface IUserService
{
    Task<UserDto?> GetByIdAsync(Guid id);
    Task<UserDto?> GetByUsernameAsync(string username);
    Task<PaginatedResult<UserDto>> GetUsersAsync(int page = 1, int pageSize = 10, string? search = null);
    
    /// <summary>
    /// Récupère les utilisateurs supprimés/désactivés (isActive = false) pour l'audit.
    /// </summary>
    Task<PaginatedResult<UserDto>> GetDeletedUsersAsync(int page = 1, int pageSize = 10, string? search = null);
    
    Task<UserDto> CreateUserAsync(string username, string email, string passwordHash, UserRole role, Guid createdBy, string? nomComplet = null, string? matricule = null);
    Task<bool> UpdateUserAsync(Guid userId, string? email, UserRole? role, string? nomComplet, bool? isActive, string? matricule, Guid updatedBy);
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

    /// <summary>
    /// Retourne tous les utilisateurs ayant le rôle JugeConstitutionnel (non paginé, pour affichage profils).
    /// </summary>
    Task<List<UserDto>> GetJugesAsync();

    /// <summary>
    /// Met à jour l'avatar de l'utilisateur.
    /// </summary>
    Task UpdateAvatarAsync(Guid userId, string avatarUrl);

    /// <summary>
    /// Met à jour le profil de l'utilisateur (nom complet, email).
    /// </summary>
    Task<UserDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);

    // ===== Gestion des mots de passe avec 2FA =====

    /// <summary>
    /// Réinitialisation du mot de passe par un admin (sans besoin de l'ancien mot de passe).
    /// </summary>
    Task AdminResetPasswordAsync(AdminResetPasswordDto dto, Guid adminUserId);

    /// <summary>
    /// Demande un changement de mot de passe avec envoi de code 2FA (email ou SMS).
    /// </summary>
    Task<PasswordChangeCodeDto> RequestPasswordChangeAsync(RequestPasswordChangeDto dto, Guid userId);

    /// <summary>
    /// Vérifie le code 2FA et change le mot de passe.
    /// </summary>
    Task<bool> VerifyPasswordChangeAsync(VerifyPasswordChangeDto dto, Guid userId);
}
