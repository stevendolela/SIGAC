using SIGAC.Core.Enums;

namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour un fichier attaché à un message de chat
/// </summary>
public class ChatAttachmentDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FileType { get; set; } = string.Empty;
    public bool IsVoiceNote { get; set; }
    public int? DurationSeconds { get; set; }
    public Guid UploadedBy { get; set; }
    public string? UploaderUsername { get; set; }
    public DateTime UploadedAt { get; set; }
    public string DownloadUrl { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour uploader une pièce jointe dans un message de conversation
/// </summary>
public class UploadChatAttachmentDto
{
    public Guid ConversationId { get; set; }
    public bool IsVoiceNote { get; set; }
    public int? DurationSeconds { get; set; }
}

/// <summary>
/// DTO pour uploader une pièce jointe dans un message de groupe
/// </summary>
public class UploadGroupAttachmentDto
{
    public Guid ChatGroupId { get; set; }
    public bool IsVoiceNote { get; set; }
    public int? DurationSeconds { get; set; }
}
