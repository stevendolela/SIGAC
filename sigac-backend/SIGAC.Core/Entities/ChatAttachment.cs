namespace SIGAC.Core.Entities;

/// <summary>
/// Représente un fichier attaché à un message de chat (pièce jointe ou note vocale)
/// </summary>
public class ChatAttachment
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// ID du message auquel appartient ce fichier (null si message de groupe)
    /// </summary>
    public Guid? MessageId { get; set; }
    public Message? Message { get; set; }
    
    /// <summary>
    /// ID du message de groupe auquel appartient ce fichier (null si conversation)
    /// </summary>
    public Guid? GroupMessageId { get; set; }
    public GroupMessage? GroupMessage { get; set; }
    
    /// <summary>
    /// Nom original du fichier
    /// </summary>
    public string FileName { get; set; } = string.Empty;
    
    /// <summary>
    /// Chemin physique du fichier sur le serveur (legacy - déprécié)
    /// </summary>
    public string FilePath { get; set; } = string.Empty;
    
    /// <summary>
    /// Contenu du fichier encodé en Base64 (pour persistance en DB)
    /// </summary>
    public string? FileData { get; set; }
    
    /// <summary>
    /// Type MIME du fichier
    /// </summary>
    public string MimeType { get; set; } = string.Empty;
    
    /// <summary>
    /// Taille du fichier en octets
    /// </summary>
    public long FileSize { get; set; }
    
    /// <summary>
    /// Type de fichier: Image, Document, Audio, Video, Other
    /// </summary>
    public string FileType { get; set; } = string.Empty;
    
    /// <summary>
    /// Hash SHA256 du fichier pour intégrité et détection de doublons
    /// </summary>
    public string HashSHA256 { get; set; } = string.Empty;
    
    /// <summary>
    /// Indique si c'est une note vocale
    /// </summary>
    public bool IsVoiceNote { get; set; }
    
    /// <summary>
    /// Durée en secondes (pour audio/vidéo)
    /// </summary>
    public int? DurationSeconds { get; set; }
    
    /// <summary>
    /// ID de l'utilisateur qui a uploadé le fichier
    /// </summary>
    public Guid UploadedBy { get; set; }
    public User? Uploader { get; set; }
    
    /// <summary>
    /// Date/heure d'upload
    /// </summary>
    public DateTime UploadedAt { get; set; }
}
