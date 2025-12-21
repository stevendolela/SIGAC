using SIGAC.Core.Enums;

namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour mettre à jour le statut de disponibilité d'un utilisateur
/// </summary>
public class UpdateUserStatusDto
{
    /// <summary>
    /// Nouveau statut (EnLigne = 0, Occupe = 1, Absent = 2)
    /// </summary>
    public UserStatus Status { get; set; }
}
