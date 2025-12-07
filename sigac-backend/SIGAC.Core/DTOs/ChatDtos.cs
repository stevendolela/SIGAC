namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour afficher un message individuel
/// </summary>
public class MessageDto
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string? SenderUsername { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}

/// <summary>
/// DTO pour créer un nouveau message
/// </summary>
public class CreateMessageDto
{
    public Guid ConversationId { get; set; }
    public string Content { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour afficher une conversation (vue résumée)
/// </summary>
public class ChatConversationDto
{
    public Guid Id { get; set; }
    public Guid User1Id { get; set; }
    public string? User1Username { get; set; }
    public Guid User2Id { get; set; }
    public string? User2Username { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastMessageAt { get; set; }
    
    /// <summary>
    /// Nombre de messages non lus dans cette conversation
    /// </summary>
    public int UnreadCount { get; set; }
}

/// <summary>
/// DTO pour afficher une conversation avec tous ses messages
/// </summary>
public class ChatConversationDetailDto
{
    public Guid Id { get; set; }
    public Guid User1Id { get; set; }
    public string? User1Username { get; set; }
    public Guid User2Id { get; set; }
    public string? User2Username { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastMessageAt { get; set; }
    
    /// <summary>
    /// Tous les messages de la conversation, ordonnés par date
    /// </summary>
    public IEnumerable<MessageDto> Messages { get; set; } = new List<MessageDto>();
}

/// <summary>
/// DTO pour créer/récupérer une conversation 1-to-1
/// </summary>
public class CreateChatConversationDto
{
    /// <summary>
    /// ID de l'utilisateur avec qui on veut discuter
    /// </summary>
    public Guid RecipientId { get; set; }
}
