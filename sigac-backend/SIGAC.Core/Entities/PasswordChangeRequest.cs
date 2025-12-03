namespace SIGAC.Core.Entities;

public class PasswordChangeRequest
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string NewPasswordHash { get; set; } = string.Empty;
    public string Method { get; set; } = "email"; // "email" ou "sms"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; } = false;
    
    // Relations
    public User User { get; set; } = null!;
}
