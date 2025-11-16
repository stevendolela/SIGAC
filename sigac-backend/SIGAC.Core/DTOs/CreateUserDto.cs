using SIGAC.Core.Enums;

namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour la création d'un nouvel utilisateur.
/// </summary>
public class CreateUserDto
{
    /// <summary>
    /// Nom d'utilisateur (login) - unique et requis.
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Adresse email - unique et requis.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Mot de passe en clair (sera hashé avec BCrypt).
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Rôle de l'utilisateur dans le système.
    /// </summary>
    public UserRole Role { get; set; } = UserRole.Consultant;

    /// <summary>
    /// Nom complet (optionnel).
    /// </summary>
    public string? NomComplet { get; set; }

    /// <summary>
    /// Matricule (optionnel).
    /// </summary>
    public string? Matricule { get; set; }
}
