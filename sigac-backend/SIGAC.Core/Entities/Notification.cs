namespace SIGAC.Core.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; } // null => broadcast
    public string Titre { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Lien { get; set; }
    public bool EstLue { get; set; }
    public DateTime CreeLe { get; set; } = DateTime.UtcNow;
    public DateTime? LueLe { get; set; }

    public User? User { get; set; }
}
