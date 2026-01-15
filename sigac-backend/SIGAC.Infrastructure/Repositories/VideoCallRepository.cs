using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

public class VideoCallRepository : IVideoCallRepository
{
    private readonly ApplicationDbContext _context;

    public VideoCallRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VideoCall?> GetByIdAsync(Guid id)
    {
        return await _context.VideoCalls
            .Include(vc => vc.Initiator)
            .Include(vc => vc.Receiver)
            .FirstOrDefaultAsync(vc => vc.Id == id);
    }

    public async Task<List<VideoCall>> GetUserCallsAsync(Guid userId, int page, int pageSize)
    {
        return await _context.VideoCalls
            .Include(vc => vc.Initiator)
            .Include(vc => vc.Receiver)
            .Where(vc => vc.InitiatorId == userId || vc.ReceiverId == userId)
            .OrderByDescending(vc => vc.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task AddAsync(VideoCall videoCall)
    {
        await _context.VideoCalls.AddAsync(videoCall);
    }

    public async Task UpdateAsync(VideoCall videoCall)
    {
        _context.VideoCalls.Update(videoCall);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
