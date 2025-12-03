using System.ComponentModel.DataAnnotations;
using SIGAC.Core.Enums;

namespace SIGAC.Core.DTOs;

public class CreateDossierDto
{
    [Required]
    [StringLength(500, MinimumLength = 10)]
    public string Titre { get; set; } = string.Empty;

    [Required]
    public Guid TypeAffaireId { get; set; }

    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Demandeur { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Defendeur { get; set; }

    public PrioriteDossier Priorite { get; set; } = PrioriteDossier.Normale;

    [StringLength(2000)]
    public string? Resume { get; set; }
}