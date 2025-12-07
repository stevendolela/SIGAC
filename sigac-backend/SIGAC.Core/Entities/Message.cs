using System;

namespace SIGAC.Core.Entities;

/// <summary>
/// Represents a message in a chat conversation
/// </summary>
public class Message
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }

    // Navigation properties
    public virtual ChatConversation? Conversation { get; set; }
    public virtual User? Sender { get; set; }
}
