using SIGAC.Core.Enums;

namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour la liste des audiences
/// </summary>
public class AudienceListDto
{
    public Guid Id { get; set; }
    public Guid DossierId { get; set; }
    public string DossierNumero { get; set; } = string.Empty;
    public string DossierTitre { get; set; } = string.Empty;
    public DateTime DateAudience { get; set; }
    public string Lieu { get; set; } = string.Empty;
    public TypeAudience TypeAudience { get; set; }
    public StatutAudience Statut { get; set; }
    public string? Observations { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO détaillé pour une audience
/// </summary>
public class AudienceDetailDto
{
    public Guid Id { get; set; }
    public Guid DossierId { get; set; }
    public string DossierNumero { get; set; } = string.Empty;
    public string DossierTitre { get; set; } = string.Empty;
    public DateTime DateAudience { get; set; }
    public string Lieu { get; set; } = string.Empty;
    public TypeAudience TypeAudience { get; set; }
    public StatutAudience Statut { get; set; }
    public string? Observations { get; set; }
    public string? CompteRendu { get; set; }
    public Guid CreatedBy { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// DTO pour créer une audience
/// </summary>
public class CreateAudienceDto
{
    public Guid DossierId { get; set; }
    public DateTime DateAudience { get; set; }
    public string Lieu { get; set; } = string.Empty;
    public TypeAudience TypeAudience { get; set; }
    public string? Observations { get; set; }
}

/// <summary>
/// DTO pour mettre à jour une audience
/// </summary>
public class UpdateAudienceDto
{
    public DateTime? DateAudience { get; set; }
    public string? Lieu { get; set; }
    public TypeAudience? TypeAudience { get; set; }
    public StatutAudience? Statut { get; set; }
    public string? Observations { get; set; }
    public string? CompteRendu { get; set; }
}
