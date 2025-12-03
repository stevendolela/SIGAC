namespace SIGAC.Core.Entities;

public class TypeAffaire
{
    public Guid Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedAt { get; set; }
}
