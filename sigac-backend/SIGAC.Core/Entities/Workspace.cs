namespace SIGAC.Core.Entities;

/// <summary>
/// Workspace = Organisation/Entreprise dans le modèle GED
/// Permet de gérer plusieurs organisations dans une seule instance SIGAC
/// </summary>
public class Workspace
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Nom de l'organisation (ex: "Cour Constitutionnelle RDC")
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Slug URL-friendly (ex: "cour-constitutionnelle-rdc")
    /// </summary>
    public string Slug { get; set; } = string.Empty;
    
    /// <summary>
    /// Description de l'organisation
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// URL du logo de l'organisation (deprecated - utiliser LogoBase64)
    /// </summary>
    [Obsolete("Use LogoBase64 instead for better cross-browser compatibility")]
    public string? LogoUrl { get; set; }
    
    /// <summary>
    /// Logo encodé en base64 avec data URI (ex: "data:image/png;base64,iVBORw0KG...")
    /// Stocké directement en BDD pour éviter les problèmes CORS et de chemins
    /// </summary>
    public string? LogoBase64 { get; set; }
    
    // Configuration & Limits
    
    /// <summary>
    /// Limite de stockage en GB (quota)
    /// </summary>
    public int MaxStorageGB { get; set; } = 100;
    
    /// <summary>
    /// Nombre maximum d'utilisateurs autorisés
    /// </summary>
    public int MaxUsers { get; set; } = 50;
    
    /// <summary>
    /// Autoriser l'accès invité (lecture seule)
    /// </summary>
    public bool AllowGuestAccess { get; set; } = false;
    
    /// <summary>
    /// Workspace actif ou archivé
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    // Relations
    
    /// <summary>
    /// Propriétaire/créateur du workspace
    /// </summary>
    public Guid OwnerId { get; set; }
    public User Owner { get; set; } = null!;
    
    /// <summary>
    /// Tous les membres du workspace (via table de jonction)
    /// </summary>
    public ICollection<WorkspaceUser> Members { get; set; } = new List<WorkspaceUser>();
    
    /// <summary>
    /// Projets (ex-Dossiers) appartenant à ce workspace
    /// </summary>
    public ICollection<Dossier> Projects { get; set; } = new List<Dossier>();
    
    /// <summary>
    /// Équipes dans ce workspace
    /// </summary>
    public ICollection<Formation> Teams { get; set; } = new List<Formation>();
    
    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedAt { get; set; }
}
