namespace SIGAC.Core.DTOs;

public class FormationDto
{
    public Guid Id { get; set; }
    public string Titre { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Organisateur { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
    public string? Lieu { get; set; }
    public bool EstEnLigne { get; set; }
}

public class CreateFormationDto
{
    public string Titre { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Organisateur { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
    public string? Lieu { get; set; }
    public bool EstEnLigne { get; set; }
}

public class FormationParticipationDto
{
    public Guid Id { get; set; }
    public Guid FormationId { get; set; }
    public Guid UserId { get; set; }
    public bool EstCompletee { get; set; }
    public DateTime? DateCompletion { get; set; }
    public string? CertificatUrl { get; set; }
}

public class CreateFormationParticipationDto
{
    public Guid UserId { get; set; }
}
