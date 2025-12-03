using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

public class FormationRepository : IFormationRepository
{
    private readonly ApplicationDbContext _context;
    public FormationRepository(ApplicationDbContext context) => _context = context;

    public async Task AddAsync(Formation entity)
    {
        await _context.Formations.AddAsync(entity);
    }

    public async Task DeleteAsync(Formation entity)
    {
        _context.Formations.Remove(entity);
        await Task.CompletedTask;
    }

    public async Task<List<Formation>> GetAllAsync()
    {
        return await _context.Formations.AsNoTracking().Include(f => f.Participations).ToListAsync();
    }

    public async Task<Formation?> GetByIdAsync(Guid id)
    {
        return await _context.Formations.Include(f => f.Participations).FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();

    public async Task UpdateAsync(Formation entity)
    {
        _context.Formations.Update(entity);
        await Task.CompletedTask;
    }

    public async Task<FormationParticipation?> GetParticipationAsync(Guid formationId, Guid userId)
    {
        return await _context.FormationParticipations.FirstOrDefaultAsync(p => p.FormationId == formationId && p.UserId == userId);
    }

    public async Task AddParticipationAsync(FormationParticipation entity)
    {
        await _context.FormationParticipations.AddAsync(entity);
    }

    public async Task UpdateParticipationAsync(FormationParticipation entity)
    {
        _context.FormationParticipations.Update(entity);
        await Task.CompletedTask;
    }
}
