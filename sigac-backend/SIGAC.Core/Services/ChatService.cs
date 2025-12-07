using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;

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

        return _mapper.Map<ChatConversationDetailDto>(conversation);
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
}
