using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

/// <summary>
/// Repository pour la gestion des courriers
/// </summary>
public class CourrierRepository : ICourrierRepository
{
    private readonly ApplicationDbContext _context;

    public CourrierRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public IQueryable<Courrier> GetQueryable()
    {
        return _context.Courriers
            .Include(c => c.Dossier)
            .Include(c => c.AssigneA)
            .Include(c => c.Workspace)
            .AsQueryable();
    }

    public async Task<Courrier?> GetByIdAsync(Guid id)
    {
        return await _context.Courriers
            .Include(c => c.Historiques)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Courrier?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _context.Courriers
            .Include(c => c.Dossier)
            .Include(c => c.AssigneA)
            .Include(c => c.Workspace)
            .Include(c => c.CreatedByUser)
            .Include(c => c.Historiques)
                .ThenInclude(h => h.User)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Courrier?> GetByReferenceAsync(string reference)
    {
        return await _context.Courriers
            .FirstOrDefaultAsync(c => c.Reference == reference);
    }

    public async Task AddAsync(Courrier courrier)
    {
        await _context.Courriers.AddAsync(courrier);
    }

    public async Task UpdateAsync(Courrier courrier)
    {
        // Ne pas appeler Update() si l'entité est déjà trackée
        var entry = _context.Entry(courrier);
        if (entry.State == EntityState.Detached)
        {
            _context.Courriers.Update(courrier);
        }
        // Sinon, les modifications sont automatiquement trackées par EF Core
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id)
    {
        var courrier = await _context.Courriers.FindAsync(id);
        if (courrier != null)
        {
            // Supprimer d'abord les historiques
            var historiques = await _context.Set<CourrierHistorique>()
                .Where(h => h.CourrierId == id)
                .ToListAsync();
            _context.Set<CourrierHistorique>().RemoveRange(historiques);
            
            _context.Courriers.Remove(courrier);
        }
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
