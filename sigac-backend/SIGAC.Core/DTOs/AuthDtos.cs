using SIGAC.Core.Enums;

namespace SIGAC.Core.DTOs;

public class RefreshTokenDto
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class ChangePasswordDto
{
    public string OldPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class ForgotPasswordDto
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class AttribuerRapporteurDto
{
    public Guid RapporteurId { get; set; }
}

public class ChangerStatutDto
{
    public StatusDossier NouveauStatut { get; set; }
    public string? Commentaire { get; set; }
}

