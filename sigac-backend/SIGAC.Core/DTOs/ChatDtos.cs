using SIGAC.Core.Enums;

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
    public string? SenderNomComplet { get; set; }
    public UserStatus? SenderStatus { get; set; }
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
    public string? User1NomComplet { get; set; }
    public UserStatus? User1Status { get; set; }
    public Guid User2Id { get; set; }
    public string? User2Username { get; set; }
    public string? User2NomComplet { get; set; }
    public UserStatus? User2Status { get; set; }
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
    public string? User1NomComplet { get; set; }
    public UserStatus? User1Status { get; set; }
    public Guid User2Id { get; set; }
    public string? User2Username { get; set; }
    public string? User2NomComplet { get; set; }
    public UserStatus? User2Status { get; set; }
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

/// <summary>
/// DTO pour un message de groupe
/// </summary>
public class GroupMessageDto
{
    public Guid Id { get; set; }
    public Guid ChatGroupId { get; set; }
    public Guid SenderId { get; set; }
    public string? SenderUsername { get; set; }
    public string? SenderNomComplet { get; set; }
    public UserStatus? SenderStatus { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
}

/// <summary>
/// DTO pour un membre de groupe
/// </summary>
public class ChatGroupMemberDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? Username { get; set; }
    public string? NomComplet { get; set; }
    public UserStatus? Status { get; set; }
    public string? Email { get; set; }
    public DateTime JoinedAt { get; set; }
    public bool IsAdmin { get; set; }
}

/// <summary>
/// DTO pour afficher un groupe de chat (vue résumée)
/// </summary>
public class ChatGroupDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid CreatedById { get; set; }
    public string? CreatedByUsername { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public int MemberCount { get; set; }
    public int MessageCount { get; set; }
}

/// <summary>
/// DTO pour afficher un groupe de chat avec tous ses messages et membres
/// </summary>
public class ChatGroupDetailDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid CreatedById { get; set; }
    public string? CreatedByUsername { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public IEnumerable<ChatGroupMemberDto> Members { get; set; } = new List<ChatGroupMemberDto>();
    public IEnumerable<GroupMessageDto> Messages { get; set; } = new List<GroupMessageDto>();
}

/// <summary>
/// DTO pour créer un nouveau groupe de chat
/// </summary>
public class CreateChatGroupDto
{
    /// <summary>
    /// Nom du groupe
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Description optionnelle
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// IDs des utilisateurs à ajouter au groupe (sans l'utilisateur créateur)
    /// </summary>
    public IEnumerable<Guid> MemberIds { get; set; } = new List<Guid>();
}

/// <summary>
/// DTO pour ajouter un message de groupe
/// </summary>
public class CreateGroupMessageDto
{
    public Guid ChatGroupId { get; set; }
    public string Content { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour ajouter un membre à un groupe
/// </summary>
public class AddGroupMemberDto
{
    public Guid UserId { get; set; }
}

