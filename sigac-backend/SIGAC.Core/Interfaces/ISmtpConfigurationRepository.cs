using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces;

public interface ISmtpConfigurationRepository
{
    /// <summary>
    /// Récupère la configuration SMTP active (il ne devrait y en avoir qu'une seule)
    /// </summary>
    Task<SmtpConfiguration?> GetActiveConfigurationAsync();
    
    /// <summary>
    /// Récupère une configuration par ID
    /// </summary>
    Task<SmtpConfiguration?> GetByIdAsync(Guid id);
    
    /// <summary>
    /// Crée ou met à jour la configuration SMTP
    /// </summary>
    Task<SmtpConfiguration> UpsertAsync(SmtpConfiguration config);
    
    /// <summary>
    /// Sauvegarde les changements
    /// </summary>
    Task SaveChangesAsync();
}
