using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces;

public interface IVideoCallService
{
    /// <summary>
    /// Initier un appel vidéo
    /// </summary>
    Task<VideoCallDto> InitiateCallAsync(InitiateVideoCallDto dto, Guid initiatorId);
    
    /// <summary>
    /// Répondre à un appel vidéo
    /// </summary>
    Task<VideoCallDto> AnswerCallAsync(Guid callId, Guid userId);
    
    /// <summary>
    /// Rejeter un appel vidéo
    /// </summary>
    Task<VideoCallDto> RejectCallAsync(Guid callId, Guid userId);
    
    /// <summary>
    /// Terminer un appel vidéo en cours
    /// </summary>
    Task<VideoCallDto> EndCallAsync(Guid callId, Guid userId);
    
    /// <summary>
    /// Annuler un appel vidéo (avant réponse)
    /// </summary>
    Task<VideoCallDto> CancelCallAsync(Guid callId, Guid userId);
    
    /// <summary>
    /// Obtenir les détails d'un appel
    /// </summary>
    Task<VideoCallDto> GetCallByIdAsync(Guid callId, Guid userId);
    
    /// <summary>
    /// Obtenir l'historique des appels d'un utilisateur
    /// </summary>
    Task<List<VideoCallDto>> GetUserCallHistoryAsync(Guid userId, int page = 1, int pageSize = 20);
    
    /// <summary>
    /// Enregistrer des données de signalisation WebRTC
    /// </summary>
    Task SaveSignalingDataAsync(VideoCallSignalingDto dto, Guid userId);
    
    /// <summary>
    /// Récupérer les données de signalisation pour un appel
    /// </summary>
    Task<string?> GetSignalingDataAsync(Guid callId, Guid userId);
}
