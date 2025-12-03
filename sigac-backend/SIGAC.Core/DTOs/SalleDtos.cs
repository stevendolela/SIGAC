namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour la liste des salles
/// </summary>
public class SalleListDto
{
    public Guid Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Capacite { get; set; }
    public bool EstActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO détaillé pour une salle
/// </summary>
public class SalleDetailDto
{
    public Guid Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Capacite { get; set; }
    public bool EstActive { get; set; }
    public Guid CreatedBy { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// DTO pour créer une salle
/// </summary>
public class CreateSalleDto
{
    public string Nom { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Capacite { get; set; }
}

/// <summary>
/// DTO pour mettre à jour une salle
/// </summary>
public class UpdateSalleDto
{
    public string? Nom { get; set; }
    public string? Description { get; set; }
    public int? Capacite { get; set; }
    public bool? EstActive { get; set; }
}
