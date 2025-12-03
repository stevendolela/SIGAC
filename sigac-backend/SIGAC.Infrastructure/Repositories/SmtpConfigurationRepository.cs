using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Repositories;

public class SmtpConfigurationRepository : ISmtpConfigurationRepository
{
    private readonly ApplicationDbContext _context;

    public SmtpConfigurationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SmtpConfiguration?> GetActiveConfigurationAsync()
    {
        // Il ne devrait y avoir qu'une seule configuration SMTP
        // On retourne la plus récente si plusieurs existent
        return await _context.SmtpConfigurations
            .OrderByDescending(c => c.ModifiedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<SmtpConfiguration?> GetByIdAsync(Guid id)
    {
        return await _context.SmtpConfigurations.FindAsync(id);
    }

    public async Task<SmtpConfiguration> UpsertAsync(SmtpConfiguration config)
    {
        var existing = await _context.SmtpConfigurations.FindAsync(config.Id);
        
        if (existing == null)
        {
            _context.SmtpConfigurations.Add(config);
        }
        else
        {
            _context.Entry(existing).CurrentValues.SetValues(config);
        }

        return config;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
