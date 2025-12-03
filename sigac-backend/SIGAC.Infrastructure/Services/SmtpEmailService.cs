using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SIGAC.Core.Interfaces;
using System.Net;
using System.Net.Mail;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace SIGAC.Infrastructure.Services;

/// <summary>
/// Implémentation SMTP qui charge la configuration depuis la DB en priorité,
/// avec fallback vers appsettings.json si aucune config DB n'est disponible.
/// </summary>
public class SmtpEmailService : IEmailService, ISmtpEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;
    private readonly ISmtpConfigurationRepository _smtpConfigRepository;
    private readonly ISystemConfigService _systemConfigService;

    public SmtpEmailService(
        IConfiguration config, 
        ILogger<SmtpEmailService> logger,
        ISmtpConfigurationRepository smtpConfigRepository,
        ISystemConfigService systemConfigService)
    {
        _config = config;
        _logger = logger;
        _smtpConfigRepository = smtpConfigRepository;
        _systemConfigService = systemConfigService;
    }

    public async Task SendAsync(string to, string subject, string htmlBody, string? textBody = null)
    {
        // 1. Essayer de charger config depuis DB
        var dbConfig = await _smtpConfigRepository.GetActiveConfigurationAsync();
        
        bool enabled;
        string from;
        string? fromName = null;
        string host;
        int port;
        string? user = null;
        string? pass = null;
        bool enableSsl;

        if (dbConfig != null && dbConfig.IsEnabled)
        {
            // Utiliser config DB
            enabled = true;
            from = dbConfig.From;
            fromName = dbConfig.FromName;
            host = dbConfig.Host;
            port = dbConfig.Port;
            user = dbConfig.Username;
            pass = await _systemConfigService.GetDecryptedSmtpPasswordAsync();
            enableSsl = dbConfig.EnableSsl;
            
            _logger.LogInformation("[SmtpEmailService] Utilisation de la configuration SMTP depuis la base de données");
        }
        else
        {
            // Fallback vers appsettings.json
            enabled = bool.TryParse(_config["Smtp:Enabled"], out var en) && en;
            from = _config["Smtp:From"] ?? "no-reply@sigac.local";
            host = _config["Smtp:Host"] ?? "localhost";
            port = int.TryParse(_config["Smtp:Port"], out var p) ? p : 25;
            user = _config["Smtp:Username"];
            pass = _config["Smtp:Password"];
            enableSsl = bool.TryParse(_config["Smtp:Ssl"], out var ssl) && ssl;
            
            _logger.LogInformation("[SmtpEmailService] Utilisation de la configuration SMTP depuis appsettings.json");
        }

        if (!enabled)
        {
            // En dev/test, on log simplement
            _logger.LogInformation("[SmtpEmailService] SMTP désactivé - email vers {To} sujet '{Subject}'", to, subject);
            _logger.LogInformation("[SmtpEmailService] Contenu: {Body}", htmlBody);
            return;
        }

        // Construire le message avec MimeKit
        var mimeMessage = new MimeMessage();
        mimeMessage.From.Add(new MailboxAddress(fromName ?? "SIGAC", from));
        mimeMessage.To.Add(MailboxAddress.Parse(to));
        mimeMessage.Subject = subject;

        if (string.IsNullOrWhiteSpace(textBody))
        {
            var builder = new BodyBuilder { HtmlBody = htmlBody };
            mimeMessage.Body = builder.ToMessageBody();
        }
        else
        {
            var builder = new BodyBuilder { TextBody = textBody };
            mimeMessage.Body = builder.ToMessageBody();
        }

        // Envoyer via MailKit avec support StartTLS (587) et SSL implicite (465)
    using var client = new MailKit.Net.Smtp.SmtpClient();
        try
        {
            if (port == 465)
            {
                // SSL implicite
                await client.ConnectAsync(host, port, SecureSocketOptions.SslOnConnect);
            }
            else
            {
                // StartTLS si SSL activé, sinon plain
                var socketOption = enableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;
                await client.ConnectAsync(host, port, socketOption);
            }

            if (!string.IsNullOrWhiteSpace(user))
            {
                await client.AuthenticateAsync(user, pass);
            }

            await client.SendAsync(mimeMessage);
            await client.DisconnectAsync(true);
            _logger.LogInformation("[SmtpEmailService] Email envoyé à {To} avec sujet '{Subject}'", to, subject);
        }
        catch (MailKit.ServiceNotAuthenticatedException ex)
        {
            _logger.LogError(ex, "[SmtpEmailService] Échec d'authentification SMTP pour l'utilisateur {User}. Vérifiez le mot de passe d'application Gmail.", user);
            throw;
        }
        catch (MailKit.CommandException ex)
        {
            _logger.LogError(ex, "[SmtpEmailService] Erreur de commande SMTP. Hôte: {Host}, Port: {Port}", host, port);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SmtpEmailService] Échec d'envoi email à {To}.", to);
            throw;
        }
    }

    /// <summary>
    /// Envoie un email via SMTP avec nom du destinataire
    /// </summary>
    public async Task SendEmailAsync(string toEmail, string toName, string subject, string body, bool isHtml = true)
    {
        await SendAsync(toEmail, subject, isHtml ? body : null, isHtml ? null : body);
    }
}
