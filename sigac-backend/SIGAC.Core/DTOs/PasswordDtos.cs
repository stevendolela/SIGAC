namespace SIGAC.Core.DTOs;

public class AdminResetPasswordDto
{
    public Guid UserId { get; set; }
    public string NewPassword { get; set; } = string.Empty;
}

public class RequestPasswordChangeDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string Method { get; set; } = "email"; // "email" ou "sms"
}

public class VerifyPasswordChangeDto
{
    public string Code { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class PasswordChangeCodeDto
{
    public string Message { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
