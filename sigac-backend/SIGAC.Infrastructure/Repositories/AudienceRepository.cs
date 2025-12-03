using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

public class AudienceRepository : IAudienceRepository
{
    private readonly ApplicationDbContext _context;

    public AudienceRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Audience?> GetByIdAsync(Guid id)
    {
        return await _context.Audiences
            .Include(a => a.Dossier)
            .Include(a => a.CreatedByUser)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<List<Audience>> GetAllAsync()
    {
        return await _context.Audiences
            .Include(a => a.Dossier)
            .Include(a => a.CreatedByUser)
            .OrderByDescending(a => a.DateAudience)
            .ToListAsync();
    }

    public async Task<List<Audience>> GetByDossierIdAsync(Guid dossierId)
    {
        return await _context.Audiences
            .Include(a => a.Dossier)
            .Include(a => a.CreatedByUser)
            .Where(a => a.DossierId == dossierId)
            .OrderBy(a => a.DateAudience)
            .ToListAsync();
    }

    public async Task<List<Audience>> GetByDateRangeAsync(DateTime dateDebut, DateTime dateFin)
    {
        return await _context.Audiences
            .Include(a => a.Dossier)
            .Include(a => a.CreatedByUser)
            .Where(a => a.DateAudience >= dateDebut && a.DateAudience <= dateFin)
            .OrderBy(a => a.DateAudience)
            .ToListAsync();
    }

    public async Task<List<Audience>> GetByStatutAsync(StatutAudience statut)
    {
        return await _context.Audiences
            .Include(a => a.Dossier)
            .Include(a => a.CreatedByUser)
            .Where(a => a.Statut == statut)
            .OrderByDescending(a => a.DateAudience)
            .ToListAsync();
    }

    public async Task AddAsync(Audience audience)
    {
        await _context.Audiences.AddAsync(audience);
    }

    public async Task UpdateAsync(Audience audience)
    {
        _context.Audiences.Update(audience);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id)
    {
        var audience = await _context.Audiences.FindAsync(id);
        if (audience != null)
        {
            _context.Audiences.Remove(audience);
        }
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _context.Audiences.AnyAsync(a => a.Id == id);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
