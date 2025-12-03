namespace SIGAC.Core.DTOs;

public class JugeProfileDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Grade { get; set; } = string.Empty;
    public string? Specialisations { get; set; }
    public string? Biographie { get; set; }
    public DateTime? DateNomination { get; set; }
    public string? Telephone { get; set; }
    public string? Adresse { get; set; }
}

public class CreateJugeProfileDto
{
    public Guid UserId { get; set; }
    public string Grade { get; set; } = string.Empty;
    public string? Specialisations { get; set; }
    public string? Biographie { get; set; }
    public DateTime? DateNomination { get; set; }
    public string? Telephone { get; set; }
    public string? Adresse { get; set; }
}

public class UpdateJugeProfileDto : CreateJugeProfileDto {}
