using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces;

public interface IVideoCallRepository
{
    Task<VideoCall?> GetByIdAsync(Guid id);
    Task<List<VideoCall>> GetUserCallsAsync(Guid userId, int page, int pageSize);
    Task<List<VideoCall>> GetPendingCallsForReceiverAsync(Guid receiverId);
    Task AddAsync(VideoCall videoCall);
    Task UpdateAsync(VideoCall videoCall);
    Task SaveChangesAsync();
}
