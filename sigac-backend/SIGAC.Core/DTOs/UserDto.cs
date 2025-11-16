namespace SIGAC.Core.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string NomComplet { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? Matricule { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastLogin { get; set; }
}