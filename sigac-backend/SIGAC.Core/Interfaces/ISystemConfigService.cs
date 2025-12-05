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

    /// <summary>
    /// Récupère les informations système et de l'API (ADMIN ONLY)
    /// </summary>
    Task<SystemInfoDto> GetSystemInfoAsync();

    /// <summary>
    /// Vérifie le statut de la base de données (ADMIN ONLY)
    /// </summary>
    Task<string> GetDatabaseStatusAsync();
}
