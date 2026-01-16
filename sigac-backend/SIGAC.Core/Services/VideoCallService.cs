using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;

namespace SIGAC.Core.Services;

public class VideoCallService : IVideoCallService
{
    private readonly IVideoCallRepository _videoCallRepository;
    private readonly IUserRepository _userRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IMapper _mapper;

    public VideoCallService(
        IVideoCallRepository videoCallRepository,
        IUserRepository userRepository,
        IAuditLogRepository auditLogRepository,
        IMapper mapper)
    {
        _videoCallRepository = videoCallRepository;
        _userRepository = userRepository;
        _auditLogRepository = auditLogRepository;
        _mapper = mapper;
    }

    public async Task<VideoCallDto> InitiateCallAsync(InitiateVideoCallDto dto, Guid initiatorId)
    {
        // Vérifier que l'initiateur et le destinataire existent
        var initiator = await _userRepository.GetByIdAsync(initiatorId)
            ?? throw new KeyNotFoundException("Initiateur non trouvé");
        
        var receiver = await _userRepository.GetByIdAsync(dto.ReceiverId)
            ?? throw new KeyNotFoundException("Destinataire non trouvé");

        if (initiatorId == dto.ReceiverId)
            throw new ArgumentException("Vous ne pouvez pas vous appeler vous-même");

        var videoCall = new VideoCall
        {
            Id = Guid.NewGuid(),
            InitiatorId = initiatorId,
            ReceiverId = dto.ReceiverId,
            ConversationId = dto.ConversationId,
            GroupId = dto.GroupId,
            Status = VideoCallStatus.Initiating,
            StartedAt = DateTime.UtcNow
        };

        await _videoCallRepository.AddAsync(videoCall);
        await _videoCallRepository.SaveChangesAsync();

        await _auditLogRepository.LogActionAsync(
            initiatorId,
            "INITIATE_VIDEO_CALL",
            "VideoCall",
            videoCall.Id.ToString(),
            null,
            $"Appel vidéo initié vers {receiver.NomComplet}"
        );

        return MapToDto(videoCall, initiator, receiver);
    }

    public async Task<VideoCallDto> AnswerCallAsync(Guid callId, Guid userId)
    {
        var call = await _videoCallRepository.GetByIdAsync(callId)
            ?? throw new KeyNotFoundException("Appel non trouvé");

        if (call.ReceiverId != userId)
            throw new UnauthorizedAccessException("Vous n'êtes pas autorisé à répondre à cet appel");

        if (call.Status != VideoCallStatus.Initiating)
            throw new InvalidOperationException("Cet appel ne peut plus être accepté");

        call.Status = VideoCallStatus.Active;
        
        await _videoCallRepository.UpdateAsync(call);
        await _videoCallRepository.SaveChangesAsync();

        await _auditLogRepository.LogActionAsync(
            userId,
            "ANSWER_VIDEO_CALL",
            "VideoCall",
            callId.ToString(),
            null,
            "Appel vidéo accepté"
        );

        var initiator = await _userRepository.GetByIdAsync(call.InitiatorId);
        var receiver = await _userRepository.GetByIdAsync(call.ReceiverId);
        
        return MapToDto(call, initiator!, receiver!);
    }

    public async Task<VideoCallDto> RejectCallAsync(Guid callId, Guid userId)
    {
        var call = await _videoCallRepository.GetByIdAsync(callId)
            ?? throw new KeyNotFoundException("Appel non trouvé");

        if (call.ReceiverId != userId)
            throw new UnauthorizedAccessException("Vous n'êtes pas autorisé à rejeter cet appel");

        if (call.Status != VideoCallStatus.Initiating)
            throw new InvalidOperationException("Cet appel ne peut plus être rejeté");

        call.Status = VideoCallStatus.Rejected;
        call.EndedAt = DateTime.UtcNow;
        
        await _videoCallRepository.UpdateAsync(call);
        await _videoCallRepository.SaveChangesAsync();

        await _auditLogRepository.LogActionAsync(
            userId,
            "REJECT_VIDEO_CALL",
            "VideoCall",
            callId.ToString(),
            null,
            "Appel vidéo rejeté"
        );

        var initiator = await _userRepository.GetByIdAsync(call.InitiatorId);
        var receiver = await _userRepository.GetByIdAsync(call.ReceiverId);
        
        return MapToDto(call, initiator!, receiver!);
    }

    public async Task<VideoCallDto> EndCallAsync(Guid callId, Guid userId)
    {
        var call = await _videoCallRepository.GetByIdAsync(callId)
            ?? throw new KeyNotFoundException("Appel non trouvé");

        if (call.InitiatorId != userId && call.ReceiverId != userId)
            throw new UnauthorizedAccessException("Vous n'êtes pas autorisé à terminer cet appel");

        if (call.Status != VideoCallStatus.Active)
            throw new InvalidOperationException("Cet appel n'est pas actif");

        call.Status = VideoCallStatus.Ended;
        call.EndedAt = DateTime.UtcNow;
        call.DurationSeconds = (int)(call.EndedAt.Value - call.StartedAt).TotalSeconds;
        
        await _videoCallRepository.UpdateAsync(call);
        await _videoCallRepository.SaveChangesAsync();

        await _auditLogRepository.LogActionAsync(
            userId,
            "END_VIDEO_CALL",
            "VideoCall",
            callId.ToString(),
            null,
            $"Appel vidéo terminé (durée: {call.DurationSeconds}s)"
        );

        var initiator = await _userRepository.GetByIdAsync(call.InitiatorId);
        var receiver = await _userRepository.GetByIdAsync(call.ReceiverId);
        
        return MapToDto(call, initiator!, receiver!);
    }

    public async Task<VideoCallDto> CancelCallAsync(Guid callId, Guid userId)
    {
        var call = await _videoCallRepository.GetByIdAsync(callId)
            ?? throw new KeyNotFoundException("Appel non trouvé");

        if (call.InitiatorId != userId)
            throw new UnauthorizedAccessException("Seul l'initiateur peut annuler cet appel");

        if (call.Status != VideoCallStatus.Initiating)
            throw new InvalidOperationException("Cet appel ne peut plus être annulé");

        call.Status = VideoCallStatus.Cancelled;
        call.EndedAt = DateTime.UtcNow;
        
        await _videoCallRepository.UpdateAsync(call);
        await _videoCallRepository.SaveChangesAsync();

        await _auditLogRepository.LogActionAsync(
            userId,
            "CANCEL_VIDEO_CALL",
            "VideoCall",
            callId.ToString(),
            null,
            "Appel vidéo annulé"
        );

        var initiator = await _userRepository.GetByIdAsync(call.InitiatorId);
        var receiver = await _userRepository.GetByIdAsync(call.ReceiverId);
        
        return MapToDto(call, initiator!, receiver!);
    }

    public async Task<VideoCallDto> GetCallByIdAsync(Guid callId, Guid userId)
    {
        var call = await _videoCallRepository.GetByIdAsync(callId)
            ?? throw new KeyNotFoundException("Appel non trouvé");

        if (call.InitiatorId != userId && call.ReceiverId != userId)
            throw new UnauthorizedAccessException("Vous n'êtes pas autorisé à voir cet appel");

        var initiator = await _userRepository.GetByIdAsync(call.InitiatorId);
        var receiver = await _userRepository.GetByIdAsync(call.ReceiverId);
        
        return MapToDto(call, initiator!, receiver!);
    }

    public async Task<List<VideoCallDto>> GetUserCallHistoryAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        var calls = await _videoCallRepository.GetUserCallsAsync(userId, page, pageSize);
        var result = new List<VideoCallDto>();

        foreach (var call in calls)
        {
            var initiator = await _userRepository.GetByIdAsync(call.InitiatorId);
            var receiver = await _userRepository.GetByIdAsync(call.ReceiverId);
            result.Add(MapToDto(call, initiator!, receiver!));
        }

        return result;
    }

    public async Task SaveSignalingDataAsync(VideoCallSignalingDto dto, Guid userId)
    {
        var call = await _videoCallRepository.GetByIdAsync(dto.CallId)
            ?? throw new KeyNotFoundException("Appel non trouvé");

        if (call.InitiatorId != userId && call.ReceiverId != userId)
            throw new UnauthorizedAccessException("Vous n'êtes pas autorisé à modifier cet appel");

        call.SignalingData = dto.Data;
        
        await _videoCallRepository.UpdateAsync(call);
        await _videoCallRepository.SaveChangesAsync();
    }

    public async Task<string?> GetSignalingDataAsync(Guid callId, Guid userId)
    {
        var call = await _videoCallRepository.GetByIdAsync(callId)
            ?? throw new KeyNotFoundException("Appel non trouvé");

        if (call.InitiatorId != userId && call.ReceiverId != userId)
            throw new UnauthorizedAccessException("Vous n'êtes pas autorisé à voir cet appel");

        return call.SignalingData;
    }

    private VideoCallDto MapToDto(VideoCall call, User initiator, User receiver)
    {
        return new VideoCallDto
        {
            Id = call.Id,
            InitiatorId = call.InitiatorId,
            InitiatorName = initiator.NomComplet ?? initiator.Username,
            ReceiverId = call.ReceiverId,
            ReceiverName = receiver.NomComplet ?? receiver.Username,
            ConversationId = call.ConversationId,
            GroupId = call.GroupId,
            Status = call.Status.ToString(),
            StartedAt = call.StartedAt,
            EndedAt = call.EndedAt,
            DurationSeconds = call.DurationSeconds
        };
    }
    
    public async Task<List<VideoCallDto>> GetPendingCallsForUserAsync(Guid userId)
    {
        // Récupérer tous les appels où l'utilisateur est le destinataire et le statut est Initiating
        var pendingCalls = await _videoCallRepository.GetPendingCallsForReceiverAsync(userId);
        
        return pendingCalls.Select(call => new VideoCallDto
        {
            Id = call.Id,
            InitiatorId = call.InitiatorId,
            ReceiverId = call.ReceiverId,
            ConversationId = call.ConversationId,
            GroupId = call.GroupId,
            Status = call.Status.ToString(),
            StartedAt = call.StartedAt,
            EndedAt = call.EndedAt,
            DurationSeconds = call.DurationSeconds
        }).ToList();
    }
}