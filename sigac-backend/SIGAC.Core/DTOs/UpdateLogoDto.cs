namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour mettre à jour le logo système
/// </summary>
public class UpdateLogoDto
{
    public string LogoBase64 { get; set; } = string.Empty;
}
