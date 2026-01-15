namespace SIGAC.Core.Entities;

/// <summary>
/// Représente un appel vidéo entre utilisateurs
/// </summary>
public class VideoCall
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// ID de l'utilisateur initiateur de l'appel
    /// </summary>
    public Guid InitiatorId { get; set; }
    public User? Initiator { get; set; }
    
    /// <summary>
    /// ID de l'utilisateur destinataire de l'appel
    /// </summary>
    public Guid ReceiverId { get; set; }
    public User? Receiver { get; set; }
    
    /// <summary>
    /// ID de la conversation (peut être null pour les appels de groupe)
    /// </summary>
    public Guid? ConversationId { get; set; }
    public ChatConversation? Conversation { get; set; }
    
    /// <summary>
    /// ID du groupe (peut être null pour les appels 1-to-1)
    /// </summary>
    public Guid? GroupId { get; set; }
    public ChatGroup? Group { get; set; }
    
    /// <summary>
    /// Statut de l'appel
    /// </summary>
    public VideoCallStatus Status { get; set; }
    
    /// <summary>
    /// Date/heure de début de l'appel
    /// </summary>
    public DateTime StartedAt { get; set; }
    
    /// <summary>
    /// Date/heure de fin de l'appel (null si en cours)
    /// </summary>
    public DateTime? EndedAt { get; set; }
    
    /// <summary>
    /// Durée de l'appel en secondes (calculé)
    /// </summary>
    public int? DurationSeconds { get; set; }
    
    /// <summary>
    /// Données de signalisation WebRTC (SDP offer/answer)
    /// </summary>
    public string? SignalingData { get; set; }
}

/// <summary>
/// Statut d'un appel vidéo
/// </summary>
public enum VideoCallStatus
{
    /// <summary>
    /// Appel en cours d'initiation (sonnerie)
    /// </summary>
    Initiating = 0,
    
    /// <summary>
    /// Appel en cours
    /// </summary>
    Active = 1,
    
    /// <summary>
    /// Appel terminé normalement
    /// </summary>
    Ended = 2,
    
    /// <summary>
    /// Appel rejeté par le destinataire
    /// </summary>
    Rejected = 3,
    
    /// <summary>
    /// Appel manqué (pas de réponse)
    /// </summary>
    Missed = 4,
    
    /// <summary>
    /// Appel annulé par l'initiateur
    /// </summary>
    Cancelled = 5
}
