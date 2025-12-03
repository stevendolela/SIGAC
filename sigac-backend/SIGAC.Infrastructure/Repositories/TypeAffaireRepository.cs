using SIGAC.Infrastructure.Data;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SIGAC.Infrastructure.Repositories;

public class TypeAffaireRepository : ITypeAffaireRepository
{
    private readonly ApplicationDbContext _context;
    public TypeAffaireRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TypeAffaire>> GetAllAsync()
        => await _context.TypeAffaires.OrderBy(t => t.Nom).ToListAsync();

    public async Task<TypeAffaire?> GetByIdAsync(Guid id)
        => await _context.TypeAffaires.FindAsync(id);

    public async Task AddAsync(TypeAffaire entity)
        => await _context.TypeAffaires.AddAsync(entity);

    public void Update(TypeAffaire entity)
        => _context.TypeAffaires.Update(entity);

    public void Remove(TypeAffaire entity)
        => _context.TypeAffaires.Remove(entity);

    public async Task SaveChangesAsync()
        => await _context.SaveChangesAsync();
}
