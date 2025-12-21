using SIGAC.Core.DTOs;
using Microsoft.AspNetCore.Http;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Service pour gérer les conversations et messages de chat
/// </summary>
public interface IChatService
{
    /// <summary>
    /// Obtient toutes les conversations de l'utilisateur connecté
    /// </summary>
    Task<IEnumerable<ChatConversationDto>> GetConversationsAsync(Guid userId);
    
    /// <summary>
    /// Obtient une conversation spécifique avec tous ses messages
    /// Les messages non lus sont automatiquement marqués comme lus
    /// </summary>
    Task<ChatConversationDetailDto?> GetConversationAsync(Guid conversationId, Guid userId);
    
    /// <summary>
    /// Envoie un nouveau message dans une conversation
    /// </summary>
    Task<MessageDto> SendMessageAsync(CreateMessageDto dto, Guid userId);
    
    /// <summary>
    /// Obtient ou crée une conversation 1-to-1 avec un utilisateur spécifique
    /// </summary>
    Task<ChatConversationDto> GetOrCreateConversationAsync(Guid recipientId, Guid userId);
    
    /// <summary>
    /// Marque un message comme lu
    /// </summary>
    Task MarkMessageAsReadAsync(Guid messageId, Guid userId);
    
    /// <summary>
    /// Supprime une conversation et tous ses messages
    /// </summary>
    Task DeleteConversationAsync(Guid conversationId, Guid userId);
    
    /// <summary>
    /// Obtient le nombre total de messages non lus pour l'utilisateur
    /// </summary>
    Task<int> GetUnreadCountAsync(Guid userId);
    
    /// <summary>
    /// Upload une pièce jointe dans une conversation
    /// </summary>
    Task<ChatAttachmentDto> UploadAttachmentAsync(Guid conversationId, IFormFile file, bool isVoiceNote, int? durationSeconds, Guid userId);
    
    /// <summary>
    /// Upload une pièce jointe dans un groupe
    /// </summary>
    Task<ChatAttachmentDto> UploadGroupAttachmentAsync(Guid chatGroupId, IFormFile file, bool isVoiceNote, int? durationSeconds, Guid userId);
    
    /// <summary>
    /// Télécharge une pièce jointe
    /// </summary>
    Task<(byte[] fileData, string fileName, string mimeType)> DownloadAttachmentAsync(Guid attachmentId, Guid userId);
    
    /// <summary>
    /// Supprime une pièce jointe
    /// </summary>
    Task DeleteAttachmentAsync(Guid attachmentId, Guid userId);
}
