using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Cryptography;

namespace SIGAC.Core.Services;

public class ChatService : IChatService
{
    private readonly IChatRepository _chatRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IMapper _mapper;

    public ChatService(IChatRepository chatRepository, IAuditLogRepository auditLogRepository, IMapper mapper)
    {
        _chatRepository = chatRepository;
        _auditLogRepository = auditLogRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ChatConversationDto>> GetConversationsAsync(Guid userId)
    {
        var conversations = await _chatRepository.GetUserConversationsAsync(userId);
        return _mapper.Map<IEnumerable<ChatConversationDto>>(conversations);
    }

    public async Task<ChatConversationDetailDto?> GetConversationAsync(Guid conversationId, Guid userId)
    {
        var conversation = await _chatRepository.GetConversationByIdAsync(conversationId);
        
        if (conversation == null)
            throw new KeyNotFoundException("Conversation non trouvée");

        // Vérifier que l'utilisateur est participant de cette conversation
        if (conversation.User1Id != userId && conversation.User2Id != userId)
            throw new UnauthorizedAccessException("Vous n'avez pas accès à cette conversation");

        // Marquer les messages non lus comme lus (pour l'utilisateur actuel uniquement)
        var unreadMessages = conversation.Messages
            .Where(m => !m.IsRead && m.SenderId != userId)
            .ToList();

        foreach (var message in unreadMessages)
        {
            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
            await _chatRepository.UpdateMessageAsync(message);
        }

        if (unreadMessages.Any())
        {
            await _chatRepository.SaveChangesAsync();
        }

        // Charger les attachments pour chaque message
        var messageIds = conversation.Messages.Select(m => m.Id).ToList();
        var attachments = await _chatRepository.GetAttachmentsByMessageIdsAsync(messageIds);
        
        var result = _mapper.Map<ChatConversationDetailDto>(conversation);
        
        // Associer les attachments aux messages
        foreach (var messageDto in result.Messages)
        {
            var messageAttachments = attachments.Where(a => a.MessageId == messageDto.Id).ToList();
            messageDto.Attachments = _mapper.Map<List<ChatAttachmentDto>>(messageAttachments);
        }

        return result;
    }

    public async Task<MessageDto> SendMessageAsync(CreateMessageDto dto, Guid userId)
    {
        // Validation
        if (string.IsNullOrWhiteSpace(dto.Content))
            throw new ArgumentException("Le message ne peut pas être vide");

        if (dto.Content.Length > 5000)
            throw new ArgumentException("Le message ne peut pas dépasser 5000 caractères");

        // Vérifier que la conversation existe et que l'utilisateur en est participant
        var conversation = await _chatRepository.GetConversationByIdAsync(dto.ConversationId);
        if (conversation == null)
            throw new KeyNotFoundException("Conversation non trouvée");

        if (conversation.User1Id != userId && conversation.User2Id != userId)
            throw new UnauthorizedAccessException("Vous n'avez pas accès à cette conversation");

        // Créer le message
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = dto.ConversationId,
            SenderId = userId,
            Content = dto.Content,
            SentAt = DateTime.UtcNow,
            IsRead = false
        };

        await _chatRepository.AddMessageAsync(message);

        // Mettre à jour LastMessageAt de la conversation
        conversation.LastMessageAt = DateTime.UtcNow;
        await _chatRepository.SaveChangesAsync();

        // Logging audit
        await _auditLogRepository.LogActionAsync(
            userId,
            "SEND_MESSAGE",
            "Message",
            message.Id.ToString(),
            null,
            System.Text.Json.JsonSerializer.Serialize(new { message.ConversationId, message.Content, message.SentAt })
        );

        var messageDto = _mapper.Map<MessageDto>(message);
        messageDto.SenderUsername = (await _chatRepository.GetConversationByIdAsync(message.ConversationId))
            ?.Messages.FirstOrDefault(m => m.Id == message.Id)?.Sender?.Username ?? "Unknown";

        return messageDto;
    }

    public async Task<ChatConversationDto> GetOrCreateConversationAsync(Guid recipientId, Guid userId)
    {
        if (recipientId == userId)
            throw new ArgumentException("Vous ne pouvez pas converser avec vous-même");

        // Chercher une conversation existante
        var existingConversation = await _chatRepository.GetConversationBetweenUsersAsync(userId, recipientId);
        
        if (existingConversation != null)
            return _mapper.Map<ChatConversationDto>(existingConversation);

        // Créer une nouvelle conversation
        var newConversation = new ChatConversation
        {
            Id = Guid.NewGuid(),
            User1Id = userId,
            User2Id = recipientId,
            CreatedAt = DateTime.UtcNow
        };

        await _chatRepository.AddConversationAsync(newConversation);
        await _chatRepository.SaveChangesAsync();

        // Logging audit
        await _auditLogRepository.LogActionAsync(
            userId,
            "CREATE_CONVERSATION",
            "ChatConversation",
            newConversation.Id.ToString(),
            null,
            System.Text.Json.JsonSerializer.Serialize(new { newConversation.User1Id, newConversation.User2Id })
        );

        return _mapper.Map<ChatConversationDto>(newConversation);
    }

    public async Task MarkMessageAsReadAsync(Guid messageId, Guid userId)
    {
        // Chercher le message
        var conversations = await _chatRepository.GetUserConversationsAsync(userId);
        var message = conversations
            .SelectMany(c => c.Messages)
            .FirstOrDefault(m => m.Id == messageId);

        if (message == null)
            throw new KeyNotFoundException("Message non trouvé");

        if (message.IsRead)
            return; // Déjà lu

        message.IsRead = true;
        message.ReadAt = DateTime.UtcNow;
        await _chatRepository.UpdateMessageAsync(message);
        await _chatRepository.SaveChangesAsync();

        // Logging audit
        await _auditLogRepository.LogActionAsync(
            userId,
            "READ_MESSAGE",
            "Message",
            messageId.ToString(),
            null,
            System.Text.Json.JsonSerializer.Serialize(new { message.ReadAt })
        );
    }

    public async Task DeleteConversationAsync(Guid conversationId, Guid userId)
    {
        var conversation = await _chatRepository.GetConversationByIdAsync(conversationId);
        
        if (conversation == null)
            throw new KeyNotFoundException("Conversation non trouvée");

        // Vérifier que l'utilisateur est participant
        if (conversation.User1Id != userId && conversation.User2Id != userId)
            throw new UnauthorizedAccessException("Vous n'avez pas accès à cette conversation");

        await _chatRepository.DeleteConversationAsync(conversation);
        await _chatRepository.SaveChangesAsync();

        // Logging audit
        await _auditLogRepository.LogActionAsync(
            userId,
            "DELETE_CONVERSATION",
            "ChatConversation",
            conversationId.ToString(),
            System.Text.Json.JsonSerializer.Serialize(new { conversation.User1Id, conversation.User2Id }),
            null
        );
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        var conversations = await _chatRepository.GetUserConversationsAsync(userId);
        
        return conversations
            .SelectMany(c => c.Messages)
            .Count(m => !m.IsRead && m.SenderId != userId);
    }

    public async Task<ChatAttachmentDto> UploadAttachmentAsync(Guid conversationId, IFormFile file, bool isVoiceNote, int? durationSeconds, Guid userId)
    {
        // Validation du fichier
        ValidateFile(file, isVoiceNote);

        // Vérifier que la conversation existe et que l'utilisateur en est participant
        var conversation = await _chatRepository.GetConversationByIdAsync(conversationId);
        if (conversation == null)
            throw new KeyNotFoundException("Conversation non trouvée");

        if (conversation.User1Id != userId && conversation.User2Id != userId)
            throw new UnauthorizedAccessException("Vous n'avez pas accès à cette conversation");

        // Créer un message pour contenir la pièce jointe
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            SenderId = userId,
            Content = isVoiceNote ? "[Note vocale]" : $"[Fichier: {file.FileName}]",
            SentAt = DateTime.UtcNow,
            IsRead = false
        };

        await _chatRepository.AddMessageAsync(message);

        // Mettre à jour la conversation
        conversation.LastMessageAt = DateTime.UtcNow;

        // Sauvegarder le fichier et créer l'attachment
        var attachment = await SaveFileAsync(file, message.Id, null, isVoiceNote, durationSeconds, userId);

        await _chatRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "UPLOAD_CHAT_ATTACHMENT",
            "ChatAttachment",
            attachment.Id.ToString(),
            null,
            System.Text.Json.JsonSerializer.Serialize(new { attachment.FileName, attachment.FileSize, attachment.IsVoiceNote })
        );

        return _mapper.Map<ChatAttachmentDto>(attachment);
    }

    public async Task<ChatAttachmentDto> UploadGroupAttachmentAsync(Guid chatGroupId, IFormFile file, bool isVoiceNote, int? durationSeconds, Guid userId)
    {
        // Validation du fichier
        ValidateFile(file, isVoiceNote);

        // TODO: Vérifier que le groupe existe et que l'utilisateur en est membre
        // Cela nécessite d'ajouter une méthode dans IChatGroupService

        // Créer un message de groupe pour contenir la pièce jointe
        var groupMessage = new GroupMessage
        {
            Id = Guid.NewGuid(),
            ChatGroupId = chatGroupId,
            SenderId = userId,
            Content = isVoiceNote ? "[Note vocale]" : $"[Fichier: {file.FileName}]",
            SentAt = DateTime.UtcNow
        };

        // Sauvegarder le fichier et créer l'attachment
        var attachment = await SaveFileAsync(file, null, groupMessage.Id, isVoiceNote, durationSeconds, userId);

        await _chatRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "UPLOAD_GROUP_ATTACHMENT",
            "ChatAttachment",
            attachment.Id.ToString(),
            null,
            System.Text.Json.JsonSerializer.Serialize(new { attachment.FileName, attachment.FileSize, attachment.IsVoiceNote })
        );

        return _mapper.Map<ChatAttachmentDto>(attachment);
    }

    public async Task<(byte[] fileData, string fileName, string mimeType)> DownloadAttachmentAsync(Guid attachmentId, Guid userId)
    {
        var attachment = await _chatRepository.GetAttachmentByIdAsync(attachmentId);
        
        if (attachment == null)
            throw new KeyNotFoundException("Pièce jointe non trouvée");

        // Vérifier les permissions (utilisateur doit être participant de la conversation ou membre du groupe)
        if (attachment.MessageId.HasValue)
        {
            var message = await _chatRepository.GetMessageByIdAsync(attachment.MessageId.Value);
            if (message?.Conversation == null)
                throw new KeyNotFoundException("Message non trouvé");

            if (message.Conversation.User1Id != userId && message.Conversation.User2Id != userId)
                throw new UnauthorizedAccessException("Vous n'avez pas accès à cette pièce jointe");
        }
        else if (attachment.GroupMessageId.HasValue)
        {
            // TODO: Vérifier que l'utilisateur est membre du groupe
            // Cela nécessite d'ajouter une méthode dans IChatGroupService
        }

        // Lire le fichier
        if (!File.Exists(attachment.FilePath))
            throw new FileNotFoundException("Le fichier n'existe pas sur le serveur");

        var fileData = await File.ReadAllBytesAsync(attachment.FilePath);

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "DOWNLOAD_CHAT_ATTACHMENT",
            "ChatAttachment",
            attachmentId.ToString(),
            null,
            System.Text.Json.JsonSerializer.Serialize(new { attachment.FileName })
        );

        return (fileData, attachment.FileName, attachment.MimeType);
    }

    public async Task DeleteAttachmentAsync(Guid attachmentId, Guid userId)
    {
        var attachment = await _chatRepository.GetAttachmentByIdAsync(attachmentId);
        
        if (attachment == null)
            throw new KeyNotFoundException("Pièce jointe non trouvée");

        // Seul l'uploader peut supprimer
        if (attachment.UploadedBy != userId)
            throw new UnauthorizedAccessException("Vous n'avez pas le droit de supprimer cette pièce jointe");

        // Supprimer le fichier physique
        if (File.Exists(attachment.FilePath))
        {
            File.Delete(attachment.FilePath);
        }

        await _chatRepository.DeleteAttachmentAsync(attachment);
        await _chatRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            "DELETE_CHAT_ATTACHMENT",
            "ChatAttachment",
            attachmentId.ToString(),
            System.Text.Json.JsonSerializer.Serialize(new { attachment.FileName, attachment.FileSize }),
            null
        );
    }

    // Méthodes privées pour la gestion des fichiers

    private void ValidateFile(IFormFile file, bool isVoiceNote)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("Aucun fichier fourni");

        // Limite de taille: 50MB pour fichiers normaux, 10MB pour notes vocales
        var maxSize = isVoiceNote ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
        if (file.Length > maxSize)
            throw new ArgumentException($"Le fichier est trop volumineux (max {maxSize / (1024 * 1024)}MB)");

        // Validation du type MIME
        var allowedMimeTypes = isVoiceNote
            ? new[] { "audio/webm", "audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/m4a" }
            : new[] { "image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", 
                     "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                     "text/plain", "audio/webm", "audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg" };

        if (!allowedMimeTypes.Contains(file.ContentType.ToLower()))
            throw new ArgumentException($"Type de fichier non autorisé: {file.ContentType}");
    }

    private async Task<ChatAttachment> SaveFileAsync(IFormFile file, Guid? messageId, Guid? groupMessageId, bool isVoiceNote, int? durationSeconds, Guid userId)
    {
        // Créer le répertoire de stockage si nécessaire
        var basePath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "chat", DateTime.UtcNow.Year.ToString(), DateTime.UtcNow.Month.ToString("D2"));
        Directory.CreateDirectory(basePath);

        // Générer un nom de fichier unique
        var fileExtension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(basePath, uniqueFileName);

        // Calculer le hash SHA256
        string hash;
        using (var stream = file.OpenReadStream())
        {
            using var sha256 = SHA256.Create();
            var hashBytes = await sha256.ComputeHashAsync(stream);
            hash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
            stream.Position = 0; // Reset pour l'écriture

            // Sauvegarder le fichier
            using var fileStream = new FileStream(filePath, FileMode.Create);
            await stream.CopyToAsync(fileStream);
        }

        // Déterminer le type de fichier
        var fileType = DetermineFileType(file.ContentType, isVoiceNote);

        // Créer l'entité ChatAttachment
        var attachment = new ChatAttachment
        {
            Id = Guid.NewGuid(),
            MessageId = messageId,
            GroupMessageId = groupMessageId,
            FileName = file.FileName,
            FilePath = filePath,
            MimeType = file.ContentType,
            FileSize = file.Length,
            FileType = fileType,
            HashSHA256 = hash,
            IsVoiceNote = isVoiceNote,
            DurationSeconds = durationSeconds,
            UploadedBy = userId,
            UploadedAt = DateTime.UtcNow
        };

        await _chatRepository.AddAttachmentAsync(attachment);

        return attachment;
    }

    private string DetermineFileType(string mimeType, bool isVoiceNote)
    {
        if (isVoiceNote) return "Audio";
        if (mimeType.StartsWith("image/")) return "Image";
        if (mimeType.StartsWith("audio/")) return "Audio";
        if (mimeType.StartsWith("video/")) return "Video";
        if (mimeType == "application/pdf") return "Document";
        if (mimeType.Contains("word") || mimeType.Contains("document")) return "Document";
        return "Other";
    }
}
