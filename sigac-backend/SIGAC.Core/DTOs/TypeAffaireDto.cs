namespace SIGAC.Core.DTOs;

public class TypeAffaireDto
{
    public Guid Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
}
