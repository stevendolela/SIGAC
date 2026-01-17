using SIGAC.Core.Enums;

namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour la liste des courriers (vue légère)
/// </summary>
public class CourrierListDto
{
    public Guid Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public TypeCourrier Type { get; set; }
    public string Objet { get; set; } = string.Empty;
    public string Expediteur { get; set; } = string.Empty;
    public string Destinataire { get; set; } = string.Empty;
    public DateTime DateCourrier { get; set; }
    public DateTime DateReception { get; set; }
    public StatutCourrier Statut { get; set; }
    public UrgenceCourrier Urgence { get; set; }
    public string? ReferenceExterne { get; set; }
    public bool HasDocument { get; set; }
    public string? DossierReference { get; set; }
    public string? AssigneANom { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO complet pour les détails d'un courrier
/// </summary>
public class CourrierDetailDto
{
    public Guid Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public TypeCourrier Type { get; set; }
    public string Objet { get; set; } = string.Empty;
    public string Expediteur { get; set; } = string.Empty;
    public string Destinataire { get; set; } = string.Empty;
    public DateTime DateCourrier { get; set; }
    public DateTime DateReception { get; set; }
    public StatutCourrier Statut { get; set; }
    public UrgenceCourrier Urgence { get; set; }
    public string? ReferenceExterne { get; set; }
    public string? TexteOCR { get; set; }
    public int? ConfianceOCR { get; set; }
    public string? Notes { get; set; }
    
    // Document info (sans les données binaires)
    public string? NomFichier { get; set; }
    public string? MimeType { get; set; }
    public long? TailleFichier { get; set; }
    public bool HasDocument { get; set; }
    
    // Relations
    public Guid? DossierId { get; set; }
    public string? DossierReference { get; set; }
    public string? DossierTitre { get; set; }
    
    public Guid? WorkspaceId { get; set; }
    public string? WorkspaceName { get; set; }
    
    public Guid? AssigneAId { get; set; }
    public string? AssigneANom { get; set; }
    
    // Audit
    public Guid CreatedBy { get; set; }
    public string? CreatedByNom { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    
    // Historique
    public List<CourrierHistoriqueDto> Historiques { get; set; } = new();
}

/// <summary>
/// DTO pour l'historique d'un courrier
/// </summary>
public class CourrierHistoriqueDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string? AncienStatut { get; set; }
    public string? NouveauStatut { get; set; }
    public string UserNom { get; set; } = string.Empty;
    public DateTime DateAction { get; set; }
}

/// <summary>
/// DTO pour créer un courrier (réception manuelle)
/// </summary>
public class CreateCourrierDto
{
    public TypeCourrier Type { get; set; } = TypeCourrier.Entrant;
    public string Objet { get; set; } = string.Empty;
    public string Expediteur { get; set; } = string.Empty;
    public string Destinataire { get; set; } = string.Empty;
    public DateTime DateCourrier { get; set; }
    public DateTime? DateReception { get; set; }
    public UrgenceCourrier Urgence { get; set; } = UrgenceCourrier.Normale;
    public string? ReferenceExterne { get; set; }
    public string? Notes { get; set; }
    public Guid? DossierId { get; set; }
    public Guid? WorkspaceId { get; set; }
    public Guid? AssigneAId { get; set; }
}

/// <summary>
/// DTO pour la réception d'un courrier avec OCR automatique
/// </summary>
public class ReceptionCourrierOcrDto
{
    public TypeCourrier Type { get; set; } = TypeCourrier.Entrant;
    public UrgenceCourrier Urgence { get; set; } = UrgenceCourrier.Normale;
    public Guid? WorkspaceId { get; set; }
    public Guid? AssigneAId { get; set; }
    public string? Notes { get; set; }
    // Le fichier sera envoyé via multipart/form-data
}

/// <summary>
/// DTO pour mettre à jour un courrier
/// </summary>
public class UpdateCourrierDto
{
    public string? Objet { get; set; }
    public string? Expediteur { get; set; }
    public string? Destinataire { get; set; }
    public DateTime? DateCourrier { get; set; }
    public StatutCourrier? Statut { get; set; }
    public UrgenceCourrier? Urgence { get; set; }
    public string? ReferenceExterne { get; set; }
    public string? Notes { get; set; }
    public Guid? DossierId { get; set; }
    public Guid? AssigneAId { get; set; }
}

/// <summary>
/// Résultat de l'analyse OCR d'un document
/// </summary>
public class OcrResultDto
{
    public bool Success { get; set; }
    public string? TexteComplet { get; set; }
    public int Confiance { get; set; }
    
    // Métadonnées extraites de l'en-tête
    public string? ObjetDetecte { get; set; }
    public string? ExpediteurDetecte { get; set; }
    public string? DestinataireDetecte { get; set; }
    public DateTime? DateDetectee { get; set; }
    public string? ReferenceDetectee { get; set; }
    
    public string? Erreur { get; set; }
}

/// <summary>
/// DTO pour créer un dossier à partir d'un courrier
/// </summary>
public class CreateDossierFromCourrierDto
{
    public Guid CourrierId { get; set; }
    public string? Titre { get; set; }
    public Guid? TypeAffaireId { get; set; }
    public string? Demandeur { get; set; }
    public string? Defendeur { get; set; }
    public Guid? RapporteurId { get; set; }
}

/// <summary>
/// Statistiques des courriers
/// </summary>
public class CourrierStatsDto
{
    public int TotalCourriers { get; set; }
    public int CourriersEntrants { get; set; }
    public int CourriersSortants { get; set; }
    public int EnAttente { get; set; }
    public int EnTraitement { get; set; }
    public int Traites { get; set; }
    public int Urgents { get; set; }
    public int ReceptionnesAujourdHui { get; set; }
    public int ReceptionnesCetteSemaine { get; set; }
}
