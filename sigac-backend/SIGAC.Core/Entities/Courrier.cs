namespace SIGAC.Core.Entities;

using SIGAC.Core.Enums;

/// <summary>
/// Entité représentant un courrier (entrant ou sortant)
/// avec support OCR pour extraction automatique des métadonnées
/// </summary>
public class Courrier
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Numéro de référence unique du courrier (généré automatiquement)
    /// Format: CE-2026-0001 (Courrier Entrant) ou CS-2026-0001 (Courrier Sortant)
    /// </summary>
    public string Reference { get; set; } = string.Empty;
    
    /// <summary>
    /// Type: Entrant ou Sortant
    /// </summary>
    public TypeCourrier Type { get; set; } = TypeCourrier.Entrant;
    
    /// <summary>
    /// Objet/Sujet du courrier (extrait par OCR ou saisi manuellement)
    /// </summary>
    public string Objet { get; set; } = string.Empty;
    
    /// <summary>
    /// Expéditeur du courrier
    /// </summary>
    public string Expediteur { get; set; } = string.Empty;
    
    /// <summary>
    /// Destinataire du courrier
    /// </summary>
    public string Destinataire { get; set; } = string.Empty;
    
    /// <summary>
    /// Date du courrier (date inscrite sur le document)
    /// </summary>
    public DateTime DateCourrier { get; set; }
    
    /// <summary>
    /// Date de réception (pour courrier entrant) ou d'envoi (pour sortant)
    /// </summary>
    public DateTime DateReception { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Statut de traitement
    /// </summary>
    public StatutCourrier Statut { get; set; } = StatutCourrier.Recu;
    
    /// <summary>
    /// Niveau d'urgence
    /// </summary>
    public UrgenceCourrier Urgence { get; set; } = UrgenceCourrier.Normale;
    
    /// <summary>
    /// Référence externe (numéro du courrier original si mentionné)
    /// </summary>
    public string? ReferenceExterne { get; set; }
    
    /// <summary>
    /// Texte complet extrait par OCR
    /// </summary>
    public string? TexteOCR { get; set; }
    
    /// <summary>
    /// Niveau de confiance OCR (0-100%)
    /// </summary>
    public int? ConfianceOCR { get; set; }
    
    /// <summary>
    /// Notes/Observations sur le courrier
    /// </summary>
    public string? Notes { get; set; }
    
    /// <summary>
    /// Document scanné/uploadé (stocké en Base64)
    /// </summary>
    public string? DocumentData { get; set; }
    
    /// <summary>
    /// Nom du fichier original
    /// </summary>
    public string? NomFichier { get; set; }
    
    /// <summary>
    /// Type MIME du document
    /// </summary>
    public string? MimeType { get; set; }
    
    /// <summary>
    /// Taille du fichier en octets
    /// </summary>
    public long? TailleFichier { get; set; }
    
    // Liens optionnels
    
    /// <summary>
    /// Dossier lié (si le courrier est associé à un dossier existant)
    /// </summary>
    public Guid? DossierId { get; set; }
    public Dossier? Dossier { get; set; }
    
    /// <summary>
    /// Workspace auquel appartient ce courrier
    /// </summary>
    public Guid? WorkspaceId { get; set; }
    public Workspace? Workspace { get; set; }
    
    /// <summary>
    /// Utilisateur assigné au traitement
    /// </summary>
    public Guid? AssigneAId { get; set; }
    public User? AssigneA { get; set; }
    
    // Audit
    public Guid CreatedBy { get; set; }
    public User? CreatedByUser { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? ModifiedBy { get; set; }
    public DateTime? ModifiedAt { get; set; }
    
    /// <summary>
    /// Historique des actions sur ce courrier
    /// </summary>
    public ICollection<CourrierHistorique> Historiques { get; set; } = new List<CourrierHistorique>();
}

/// <summary>
/// Historique des actions sur un courrier
/// </summary>
public class CourrierHistorique
{
    public Guid Id { get; set; }
    public Guid CourrierId { get; set; }
    public Courrier Courrier { get; set; } = null!;
    
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string? AncienStatut { get; set; }
    public string? NouveauStatut { get; set; }
    
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public DateTime DateAction { get; set; } = DateTime.UtcNow;
}
