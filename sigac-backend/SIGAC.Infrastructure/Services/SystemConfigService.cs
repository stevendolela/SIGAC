using AutoMapper;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Logging;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.EntityFrameworkCore;
using SIGAC.Infrastructure.Data;
using System.Diagnostics;

namespace SIGAC.Infrastructure.Services;

public class SystemConfigService : ISystemConfigService
{
    private readonly ISmtpConfigurationRepository _smtpConfigRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IDataProtector _dataProtector;
    private readonly ILogger<SystemConfigService> _logger;
    private static readonly DateTime ApplicationStartTime = DateTime.UtcNow;
    private static long TotalRequestCount = 0;

    public SystemConfigService(
        ISmtpConfigurationRepository smtpConfigRepository,
        IAuditLogRepository auditLogRepository,
        ApplicationDbContext context,
        IMapper mapper,
        IDataProtectionProvider dataProtectionProvider,
        ILogger<SystemConfigService> logger)
    {
        _smtpConfigRepository = smtpConfigRepository;
        _auditLogRepository = auditLogRepository;
        _context = context;
        _mapper = mapper;
        _dataProtector = dataProtectionProvider.CreateProtector("SmtpPasswordProtector");
        _logger = logger;
    }

    public async Task<SmtpConfigurationDto?> GetSmtpConfigurationAsync()
    {
        var config = await _smtpConfigRepository.GetActiveConfigurationAsync();
        if (config == null)
            return null;

        var dto = _mapper.Map<SmtpConfigurationDto>(config);
        dto.HasPassword = !string.IsNullOrWhiteSpace(config.EncryptedPassword);
        
        return dto;
    }

    public async Task<SmtpConfigurationDto> UpdateSmtpConfigurationAsync(UpdateSmtpConfigurationDto dto, Guid userId)
    {
        var existingConfig = await _smtpConfigRepository.GetActiveConfigurationAsync();
        
        SmtpConfiguration config;
        string action;

        if (existingConfig == null)
        {
            // Créer nouvelle config
            config = new SmtpConfiguration
            {
                Id = Guid.NewGuid(),
                ModifiedBy = userId,
                ModifiedAt = DateTime.UtcNow
            };
            action = "CREATE";
        }
        else
        {
            config = existingConfig;
            config.ModifiedBy = userId;
            config.ModifiedAt = DateTime.UtcNow;
            action = "UPDATE";
        }

        // Mise à jour des propriétés
        config.Host = dto.Host;
        config.Port = dto.Port;
        config.Username = dto.Username;
        config.From = dto.From;
        config.FromName = dto.FromName;
        config.EnableSsl = dto.EnableSsl;
        config.IsEnabled = dto.IsEnabled;

        // Chiffrer le mot de passe si fourni
        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            config.EncryptedPassword = _dataProtector.Protect(dto.Password);
        }

        var savedConfig = await _smtpConfigRepository.UpsertAsync(config);
        await _smtpConfigRepository.SaveChangesAsync();

        // Audit log
        await _auditLogRepository.LogActionAsync(
            userId,
            action,
            "SmtpConfiguration",
            savedConfig.Id.ToString(),
            existingConfig != null ? System.Text.Json.JsonSerializer.Serialize(existingConfig) : "",
            System.Text.Json.JsonSerializer.Serialize(new { 
                savedConfig.Host, 
                savedConfig.Port, 
                savedConfig.Username, 
                savedConfig.From, 
                savedConfig.EnableSsl, 
                savedConfig.IsEnabled 
            })
        );

        _logger.LogInformation(
            "Configuration SMTP {Action} par l'utilisateur {UserId}",
            action, userId);

        var resultDto = _mapper.Map<SmtpConfigurationDto>(savedConfig);
        resultDto.HasPassword = !string.IsNullOrWhiteSpace(savedConfig.EncryptedPassword);
        
        return resultDto;
    }

    public async Task<SmtpTestResultDto> TestSmtpConnectionAsync(TestSmtpConnectionDto dto)
    {
        var result = new SmtpTestResultDto
        {
            TestedAt = DateTime.UtcNow
        };

        try
        {
            using var client = new SmtpClient();

            // Connexion avec le bon mode SSL selon le port
            var secureSocketOptions = dto.Port == 465 
                ? SecureSocketOptions.SslOnConnect 
                : SecureSocketOptions.StartTls;

            await client.ConnectAsync(dto.Host, dto.Port, secureSocketOptions);

            // Authentification si credentials fournis
            if (!string.IsNullOrWhiteSpace(dto.Username) && !string.IsNullOrWhiteSpace(dto.Password))
            {
                await client.AuthenticateAsync(dto.Username, dto.Password);
            }

            // Si un email de test est fourni, envoyer un vrai email
            if (!string.IsNullOrWhiteSpace(dto.TestEmailTo))
            {
                var message = new MimeMessage();
                
                // Utiliser l'email configuré comme expéditeur (ou username si From non spécifié)
                var fromEmail = !string.IsNullOrWhiteSpace(dto.From) ? dto.From : dto.Username;
                var fromName = !string.IsNullOrWhiteSpace(dto.FromName) ? dto.FromName : "SIGAC Test";
                message.From.Add(new MailboxAddress(fromName, fromEmail));
                message.To.Add(new MailboxAddress("", dto.TestEmailTo));
                message.Subject = "Test de configuration SMTP - SIGAC";
                
                var bodyBuilder = new BodyBuilder
                {
                    TextBody = $"Ceci est un email de test envoyé le {DateTime.UtcNow:dd/MM/yyyy à HH:mm:ss}.\n\n" +
                               $"La configuration SMTP fonctionne correctement.\n\n" +
                               $"Serveur: {dto.Host}:{dto.Port}\n" +
                               $"SSL: {(dto.EnableSsl ? "Activé" : "Désactivé")}"
                };
                message.Body = bodyBuilder.ToMessageBody();

                await client.SendAsync(message);
                result.Success = true;
                result.Message = $"Email de test envoyé avec succès à {dto.TestEmailTo}";
            }
            else
            {
                // Tester juste la connexion sans envoyer d'email
                result.Success = true;
                result.Message = "Connexion SMTP établie avec succès";
            }

            await client.DisconnectAsync(true);

            _logger.LogInformation("Test SMTP réussi pour {Host}:{Port}", dto.Host, dto.Port);
        }
        catch (MailKit.Security.AuthenticationException ex)
        {
            result.Success = false;
            result.Message = "Échec de la connexion SMTP - Authentification refusée";
            result.ErrorDetails = $"Vérifiez vos identifiants. Gmail nécessite un mot de passe d'application (App Password). {ex.Message}";
            
            _logger.LogWarning(ex, "Échec d'authentification SMTP pour {Host}:{Port}", dto.Host, dto.Port);
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.Message = "Échec de la connexion SMTP";
            result.ErrorDetails = ex.Message;
            
            _logger.LogWarning(ex, "Échec du test SMTP pour {Host}:{Port}", dto.Host, dto.Port);
        }

        // Mettre à jour le résultat du dernier test dans la config si elle existe
        var config = await _smtpConfigRepository.GetActiveConfigurationAsync();
        if (config != null)
        {
            config.LastTestedAt = result.TestedAt;
            config.LastTestSuccess = result.Success;
            config.LastTestError = result.Success ? null : result.ErrorDetails;
            await _smtpConfigRepository.SaveChangesAsync();
        }

        _logger.LogInformation("Test de connexion SMTP effectué: {Success} pour {Host}:{Port}", result.Success, dto.Host, dto.Port);

        return result;
    }

    public async Task<string?> GetDecryptedSmtpPasswordAsync()
    {
        var config = await _smtpConfigRepository.GetActiveConfigurationAsync();
        if (config == null || string.IsNullOrWhiteSpace(config.EncryptedPassword))
            return null;

        try
        {
            return _dataProtector.Unprotect(config.EncryptedPassword);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors du déchiffrement du mot de passe SMTP");
            return null;
        }
    }

    /// <summary>
    /// Récupère les informations système et de l'API (ADMIN ONLY)
    /// </summary>
    public async Task<SystemInfoDto> GetSystemInfoAsync()
    {
        try
        {
            var process = Process.GetCurrentProcess();
            var databaseStatus = await GetDatabaseStatusAsync();

            var info = new SystemInfoDto
            {
                ApplicationName = "SIGAC - Système de Gestion des Affaires Constitutionnelles",
                ApiVersion = "1.0.0",
                RuntimeVersion = $".NET {GetDotNetVersion()}",
                Environment = GetEnvironment(),
                DatabaseStatus = databaseStatus,
                DatabaseType = "PostgreSQL 15",
                ApplicationStartTime = ApplicationStartTime,
                UptimeSeconds = (long)(DateTime.UtcNow - ApplicationStartTime).TotalSeconds,
                MemoryUsageMB = Math.Round(process.WorkingSet64 / (1024.0 * 1024.0), 2),
                TotalRequests = TotalRequestCount,
                DatabaseHost = ExtractDatabaseHost(),
                LastBackupTime = null,
                ExternalServices = new Dictionary<string, string>
                {
                    { "CORS", "Configured" },
                    { "JWT", "Active" },
                    { "SSL/TLS", "Enabled" },
                    { "Audit Logging", "Active" }
                },
                GeneratedAt = DateTime.UtcNow
            };

            // Compter les entités
            info.ActiveUsers = await _context.Users.CountAsync();
            info.TotalDossiers = await _context.Dossiers.CountAsync();
            info.TotalDocuments = await _context.Documents.CountAsync();

            _logger.LogInformation("Informations système récupérées pour Admin");
            return info;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des infos système");
            throw;
        }
    }

    /// <summary>
    /// Vérifie le statut de la base de données (ADMIN ONLY)
    /// </summary>
    public async Task<string> GetDatabaseStatusAsync()
    {
        try
        {
            await _context.Database.ExecuteSqlRawAsync("SELECT 1");
            return "Connected";
        }
        catch
        {
            return "Disconnected";
        }
    }

    /// <summary>
    /// Extrait le host de la connexion PostgreSQL
    /// </summary>
    private string ExtractDatabaseHost()
    {
        try
        {
            var connection = _context.Database.GetConnectionString();
            if (string.IsNullOrEmpty(connection))
                return "Unknown";

            var hostPart = connection.Split(';')
                .FirstOrDefault(x => x.StartsWith("Host="));

            return hostPart?.Replace("Host=", "") ?? "Unknown";
        }
        catch
        {
            return "Unknown";
        }
    }

    /// <summary>
    /// Récupère la version de .NET
    /// </summary>
    private string GetDotNetVersion()
    {
        return System.Runtime.InteropServices.RuntimeInformation
            .FrameworkDescription ?? "Unknown";
    }

    /// <summary>
    /// Récupère l'environnement actuel
    /// </summary>
    private string GetEnvironment()
    {
        return System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
    }

    /// <summary>
    /// Incrémente le compteur de requêtes
    /// </summary>
    public static void IncrementRequestCount()
    {
        Interlocked.Increment(ref TotalRequestCount);
    }

    public async Task<string?> GetSystemLogoAsync()
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync();
        return setting?.LogoBase64;
    }

    public async Task<string?> UpdateSystemLogoAsync(string logoBase64, Guid userId)
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync();
        
        if (setting == null)
        {
            // Créer nouvelle entrée
            setting = new SystemSetting
            {
                Id = Guid.NewGuid(),
                LogoBase64 = logoBase64,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = userId
            };
            _context.SystemSettings.Add(setting);
        }
        else
        {
            // Mettre à jour l'existante
            var oldLogo = setting.LogoBase64;
            setting.LogoBase64 = logoBase64;
            setting.UpdatedAt = DateTime.UtcNow;
            setting.UpdatedBy = userId;
            
            // Audit log
            await _auditLogRepository.LogActionAsync(
                userId,
                "UPDATE",
                "SystemSetting",
                setting.Id.ToString(),
                oldLogo ?? "",
                $"Logo mis à jour ({logoBase64?.Length ?? 0} caractères)"
            );
        }

        await _context.SaveChangesAsync();
        
        _logger.LogInformation(
            "Logo système mis à jour par l'utilisateur {UserId}",
            userId);

        return setting.LogoBase64;
    }

    public async Task DeleteSystemLogoAsync(Guid userId)
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync();
        
        if (setting != null)
        {
            var oldLogo = setting.LogoBase64;
            setting.LogoBase64 = null;
            setting.UpdatedAt = DateTime.UtcNow;
            setting.UpdatedBy = userId;
            
            await _context.SaveChangesAsync();
            
            // Audit log
            await _auditLogRepository.LogActionAsync(
                userId,
                "DELETE",
                "SystemSetting",
                setting.Id.ToString(),
                oldLogo ?? "",
                "Logo supprimé"
            );
            
            _logger.LogInformation(
                "Logo système supprimé par l'utilisateur {UserId}",
                userId);
        }
    }
}
