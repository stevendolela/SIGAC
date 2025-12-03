namespace SIGAC.Core.Interfaces;

public interface IEmailService
{
    /// <summary>
    /// Envoie un email. Si l'envoi SMTP est désactivé en configuration, le service loguera simplement l'intention d'envoi.
    /// </summary>
    /// <param name="to">Adresse email du destinataire</param>
    /// <param name="subject">Sujet</param>
    /// <param name="htmlBody">Corps du message au format HTML</param>
    /// <param name="textBody">Corps alternatif en texte brut (optionnel)</param>
    Task SendAsync(string to, string subject, string htmlBody, string? textBody = null);
}
