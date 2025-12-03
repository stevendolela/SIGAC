namespace SIGAC.Core.DTOs;

public class NotificationDto
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string Titre { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Lien { get; set; }
    public bool EstLue { get; set; }
    public DateTime CreeLe { get; set; }
    public DateTime? LueLe { get; set; }
}

public class CreateNotificationDto
{
    public Guid? UserId { get; set; }
    public string Titre { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Lien { get; set; }
}
