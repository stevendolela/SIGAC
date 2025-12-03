using SIGAC.Core.Enums;

namespace SIGAC.Core.Entities;

/// <summary>
/// Représente une audience judiciaire programmée pour un dossier
/// </summary>
public class Audience
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Référence au dossier
    /// </summary>
    public Guid DossierId { get; set; }
    public Dossier Dossier { get; set; } = null!;
    
    /// <summary>
    /// Date et heure de l'audience
    /// </summary>
    public DateTime DateAudience { get; set; }
    
    /// <summary>
    /// Lieu de l'audience (ex: Salle 1, Salle d'audience principale)
    /// </summary>
    public string Lieu { get; set; } = string.Empty;
    
    /// <summary>
    /// Type d'audience
    /// </summary>
    public TypeAudience TypeAudience { get; set; }
    
    /// <summary>
    /// Statut de l'audience
    /// </summary>
    public StatutAudience Statut { get; set; }
    
    /// <summary>
    /// Observations ou notes sur l'audience
    /// </summary>
    public string? Observations { get; set; }
    
    /// <summary>
    /// Compte-rendu de l'audience (après tenue)
    /// </summary>
    public string? CompteRendu { get; set; }
    
    /// <summary>
    /// Utilisateur ayant créé l'audience
    /// </summary>
    public Guid CreatedBy { get; set; }
    public User CreatedByUser { get; set; } = null!;
    
    /// <summary>
    /// Date de création
    /// </summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// Dernière modification
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
