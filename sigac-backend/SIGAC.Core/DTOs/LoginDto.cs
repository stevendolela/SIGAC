using System.ComponentModel.DataAnnotations;

namespace SIGAC.Core.DTOs;

public class LoginDto
{
    [Required(ErrorMessage = "Le nom d'utilisateur est requis")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le mot de passe est requis")]
    public string Password { get; set; } = string.Empty;
}