using SIGAC.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace SIGAC.Core.DTOs;

public class UpdateDossierDto
{
    [StringLength(500, MinimumLength = 10)]
    public string? Titre { get; set; }

    public TypeAffaire? Type { get; set; }

    [StringLength(200, MinimumLength = 3)]
    public string? Demandeur { get; set; }

    [StringLength(200)]
    public string? Defendeur { get; set; }

    public PrioriteDossier? Priorite { get; set; }

    [StringLength(2000)]
    public string? Resume { get; set; }

    [StringLength(2000)]
    public string? Observations { get; set; }

    public DateTime? DateAudience { get; set; }
}