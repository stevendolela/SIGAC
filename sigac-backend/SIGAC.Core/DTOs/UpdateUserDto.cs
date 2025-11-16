using SIGAC.Core.Enums;

namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour la modification d'un utilisateur existant.
/// </summary>
public class UpdateUserDto
{
    /// <summary>
    /// Nouvelle adresse email (optionnel).
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Nouveau rôle (optionnel, admin seulement).
    /// </summary>
    public UserRole? Role { get; set; }

    /// <summary>
    /// Nom complet (optionnel).
    /// </summary>
    public string? NomComplet { get; set; }

    /// <summary>
    /// Matricule (optionnel).
    /// </summary>
    public string? Matricule { get; set; }

    /// <summary>
    /// État actif/inactif (optionnel).
    /// </summary>
    public bool? IsActive { get; set; }
}
