using SIGAC.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO unique pour la mise à jour d'un utilisateur existant.
/// Tous les champs sont optionnels.
/// </summary>
public class UpdateUserDto
{
    [EmailAddress]
    [MaxLength(255)]
    public string? Email { get; set; }

    public UserRole? Role { get; set; }

    [MaxLength(200)]
    public string? NomComplet { get; set; }

    [MaxLength(50)]
    public string? Matricule { get; set; }

    public bool? IsActive { get; set; }
}
