using System.ComponentModel.DataAnnotations;

namespace SIGAC.Core.Entities;

/// <summary>
/// Représente une salle d'audience
/// </summary>
public class Salle
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nom { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    [Range(1, 1000)]
    public int Capacite { get; set; }

    public bool EstActive { get; set; } = true;

    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual User CreatedByUser { get; set; } = null!;
}
