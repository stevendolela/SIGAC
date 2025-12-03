using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces;

public interface ISystemConfigService
{
    /// <summary>
    /// Récupère la configuration SMTP actuelle
    /// </summary>
    Task<SmtpConfigurationDto?> GetSmtpConfigurationAsync();
    
    /// <summary>
    /// Met à jour la configuration SMTP
    /// </summary>
    Task<SmtpConfigurationDto> UpdateSmtpConfigurationAsync(UpdateSmtpConfigurationDto dto, Guid userId);
    
    /// <summary>
    /// Teste la connexion SMTP avec les paramètres fournis
    /// </summary>
    Task<SmtpTestResultDto> TestSmtpConnectionAsync(TestSmtpConnectionDto dto);
    
    /// <summary>
    /// Récupère le mot de passe SMTP déchiffré (pour usage interne uniquement)
    /// </summary>
    Task<string?> GetDecryptedSmtpPasswordAsync();
}
