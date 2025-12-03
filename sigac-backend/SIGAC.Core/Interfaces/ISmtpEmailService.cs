namespace SIGAC.Core.Interfaces;

/// <summary>
/// Service SMTP pour l'envoi d'emails avec support des templates
/// </summary>
public interface ISmtpEmailService
{
    /// <summary>
    /// Envoie un email via SMTP
    /// </summary>
    /// <param name="toEmail">Adresse email du destinataire</param>
    /// <param name="toName">Nom du destinataire</param>
    /// <param name="subject">Sujet de l'email</param>
    /// <param name="body">Corps de l'email (HTML ou texte)</param>
    /// <param name="isHtml">Indique si le corps est au format HTML</param>
    Task SendEmailAsync(string toEmail, string toName, string subject, string body, bool isHtml = true);

    /// <summary>
    /// Envoie un email via SMTP (version compatible avec IEmailService)
    /// </summary>
    Task SendAsync(string to, string subject, string htmlBody, string? textBody = null);
}
