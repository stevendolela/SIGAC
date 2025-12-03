using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

public class SalleRepository : ISalleRepository
{
    private readonly ApplicationDbContext _context;

    public SalleRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Salle>> GetAllAsync(bool? activeOnly = null)
    {
        var query = _context.Salles
            .Include(s => s.CreatedByUser)
            .AsQueryable();

        if (activeOnly.HasValue && activeOnly.Value)
        {
            query = query.Where(s => s.EstActive);
        }

        return await query
            .OrderBy(s => s.Nom)
            .ToListAsync();
    }

    public async Task<Salle?> GetByIdAsync(Guid id)
    {
        return await _context.Salles
            .Include(s => s.CreatedByUser)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<Salle?> GetByNomAsync(string nom)
    {
        if (string.IsNullOrWhiteSpace(nom)) return null;
        // Utilise ILIKE PostgreSQL pour une comparaison insensible à la casse plus fiable
        return await _context.Salles
            .FirstOrDefaultAsync(s => EF.Functions.ILike(s.Nom, nom));
    }

    public async Task AddAsync(Salle salle)
    {
        await _context.Salles.AddAsync(salle);
    }

    public async Task UpdateAsync(Salle salle)
    {
        _context.Salles.Update(salle);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(Salle salle)
    {
        _context.Salles.Remove(salle);
        await Task.CompletedTask;
    }

    public async Task<bool> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync() > 0;
    }
}
