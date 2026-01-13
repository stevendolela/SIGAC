namespace SIGAC.Core.Interfaces;

using SIGAC.Core.DTOs;
using SIGAC.Core.Enums;

/// <summary>
/// Service pour accéder à l'historique des connexions des utilisateurs
/// </summary>
public interface ILoginHistoryService
{
    /// <summary>
    /// Récupère l'historique de connexion de l'utilisateur actuel
    /// </summary>
    Task<List<LoginHistoryDto>> GetMyLoginHistoryAsync(Guid userId, int limit = 50);

    /// <summary>
    /// Récupère l'historique de connexion de tous les utilisateurs (Admin only)
    /// </summary>
    Task<List<LoginHistoryDto>> GetAllLoginHistoryAsync(Guid userId, UserRole userRole, int limit = 100);

    /// <summary>
    /// Récupère l'historique de connexion pour un utilisateur spécifique (Admin only)
    /// </summary>
    Task<List<LoginHistoryDto>> GetUserLoginHistoryAsync(Guid userId, Guid targetUserId, UserRole userRole, int limit = 50);
}
