using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

public class PasswordChangeRequestRepository : IPasswordChangeRequestRepository
{
    private readonly ApplicationDbContext _context;

    public PasswordChangeRequestRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PasswordChangeRequest?> GetByCodeAsync(string code)
    {
        return await _context.PasswordChangeRequests
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Code == code && !p.IsUsed && p.ExpiresAt > DateTime.UtcNow);
    }

    public async Task<PasswordChangeRequest?> GetByUserIdAsync(Guid userId)
    {
        return await _context.PasswordChangeRequests
            .Where(p => p.UserId == userId && !p.IsUsed && p.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task AddAsync(PasswordChangeRequest request)
    {
        await _context.PasswordChangeRequests.AddAsync(request);
    }

    public async Task DeleteAsync(PasswordChangeRequest request)
    {
        _context.PasswordChangeRequests.Remove(request);
    }

    public async Task DeleteExpiredAsync()
    {
        var expiredRequests = await _context.PasswordChangeRequests
            .Where(p => p.ExpiresAt < DateTime.UtcNow || p.IsUsed)
            .ToListAsync();
        
        _context.PasswordChangeRequests.RemoveRange(expiredRequests);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
