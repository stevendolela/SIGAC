using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

public class JugeProfileRepository : IJugeProfileRepository
{
    private readonly ApplicationDbContext _context;
    public JugeProfileRepository(ApplicationDbContext context) => _context = context;

    public async Task AddAsync(JugeProfile entity)
    {
        await _context.JugeProfiles.AddAsync(entity);
    }

    public async Task DeleteAsync(JugeProfile entity)
    {
        _context.JugeProfiles.Remove(entity);
        await Task.CompletedTask;
    }

    public async Task<List<JugeProfile>> GetAllAsync()
    {
        return await _context.JugeProfiles.AsNoTracking().Include(j => j.User).ToListAsync();
    }

    public async Task<JugeProfile?> GetByIdAsync(Guid id)
    {
        return await _context.JugeProfiles.Include(j => j.User).FirstOrDefaultAsync(j => j.Id == id);
    }

    public async Task<JugeProfile?> GetByUserIdAsync(Guid userId)
    {
        return await _context.JugeProfiles.Include(j => j.User).FirstOrDefaultAsync(j => j.UserId == userId);
    }

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();

    public async Task UpdateAsync(JugeProfile entity)
    {
        _context.JugeProfiles.Update(entity);
        await Task.CompletedTask;
    }
}
