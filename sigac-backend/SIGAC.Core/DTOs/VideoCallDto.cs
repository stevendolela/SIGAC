namespace SIGAC.Core.DTOs;

public class VideoCallDto
{
    public Guid Id { get; set; }
    public Guid InitiatorId { get; set; }
    public string InitiatorName { get; set; } = string.Empty;
    public Guid ReceiverId { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public Guid? ConversationId { get; set; }
    public Guid? GroupId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public int? DurationSeconds { get; set; }
}

public class InitiateVideoCallDto
{
    public Guid ReceiverId { get; set; }
    public Guid? ConversationId { get; set; }
    public Guid? GroupId { get; set; }
}

public class VideoCallSignalingDto
{
    public Guid CallId { get; set; }
    public string Type { get; set; } = string.Empty; // "offer", "answer", "ice-candidate"
    public string Data { get; set; } = string.Empty; // JSON stringified SDP ou ICE candidate
}

public class UpdateVideoCallStatusDto
{
    public Guid CallId { get; set; }
    public string Status { get; set; } = string.Empty; // "active", "ended", "rejected", "cancelled"
}
