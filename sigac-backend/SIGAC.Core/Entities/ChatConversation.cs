using System;
using System.Collections.Generic;

namespace SIGAC.Core.Entities;

/// <summary>
/// Represents a 1-to-1 chat conversation between two users
/// </summary>
public class ChatConversation
{
    public Guid Id { get; set; }
    public Guid User1Id { get; set; }
    public Guid User2Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastMessageAt { get; set; }

    // Navigation properties
    public virtual User? User1 { get; set; }
    public virtual User? User2 { get; set; }
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
}
