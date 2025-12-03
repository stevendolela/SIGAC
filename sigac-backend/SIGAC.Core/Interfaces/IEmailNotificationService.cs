using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Service pour l'envoi de notifications par email avec templates
/// </summary>
public interface IEmailNotificationService
{
    /// <summary>
    /// Envoie un email de notification lors de la création d'un dossier
    /// </summary>
    Task SendDossierCreatedEmailAsync(DossierDto dossier, UserDto rapporteur, UserDto createdBy);

    /// <summary>
    /// Envoie un email de notification lors du changement de statut d'un dossier
    /// </summary>
    Task SendDossierStatusChangedEmailAsync(DossierDto dossier, StatusDossier oldStatus, StatusDossier newStatus, UserDto changedBy);

    /// <summary>
    /// Envoie un email de réinitialisation de mot de passe
    /// </summary>
    Task SendPasswordResetEmailAsync(User user, string resetToken);

    /// <summary>
    /// Envoie un email de bienvenue à un nouvel utilisateur
    /// </summary>
    Task SendWelcomeEmailAsync(User user, string temporaryPassword);

    /// <summary>
    /// Envoie un email de notification d'audience programmée
    /// </summary>
    Task SendAudienceScheduledEmailAsync(Audience audience, List<User> concernedUsers);

    /// <summary>
    /// Envoie un email personnalisé avec template HTML
    /// </summary>
    Task SendCustomEmailAsync(string toEmail, string toName, string subject, string htmlBody);
}
