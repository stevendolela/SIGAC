using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;

namespace SIGAC.Infrastructure.Services;

public class EmailNotificationService : IEmailNotificationService
{
    private readonly ISmtpEmailService _smtpEmailService;
    private readonly ILogger<EmailNotificationService> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _frontendUrl;

    public EmailNotificationService(
        ISmtpEmailService smtpEmailService,
        ILogger<EmailNotificationService> logger,
        IConfiguration configuration)
    {
        _smtpEmailService = smtpEmailService;
        _logger = logger;
        _configuration = configuration;
        _frontendUrl = configuration["Frontend:Url"] ?? "http://localhost:5173";
    }

    public async Task SendDossierCreatedEmailAsync(DossierDto dossier, UserDto rapporteur, UserDto createdBy)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(rapporteur.Email))
            {
                _logger.LogWarning("Le rapporteur {RapporteurId} n'a pas d'email configuré", rapporteur.Id);
                return;
            }

            var htmlBody = EmailTemplates.GetDossierCreatedTemplate(
                numeroDossier: dossier.NumeroDossier,
                titre: dossier.Titre,
                typeAffaire: dossier.TypeAffaireNom ?? string.Empty,
                rapporteurNom: rapporteur.NomComplet,
                createurNom: createdBy.NomComplet,
                dateCreation: dossier.DateDepot.ToString("dd/MM/yyyy à HH:mm"),
                dossierId: dossier.Id.ToString()
            ).Replace("{{FRONTEND_URL}}", _frontendUrl);

            await _smtpEmailService.SendEmailAsync(
                toEmail: rapporteur.Email,
                toName: rapporteur.NomComplet,
                subject: $"[SIGAC] Nouveau dossier assigné - {dossier.NumeroDossier}",
                body: htmlBody,
                isHtml: true
            );

            _logger.LogInformation(
                "Email de création de dossier envoyé à {Email} pour le dossier {NumeroDossier}",
                rapporteur.Email, dossier.NumeroDossier);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Erreur lors de l'envoi de l'email de création de dossier {NumeroDossier} à {Email}",
                dossier.NumeroDossier, rapporteur.Email);
            // Ne pas throw - l'envoi d'email ne doit pas bloquer le processus métier
        }
    }

    public async Task SendDossierStatusChangedEmailAsync(DossierDto dossier, StatusDossier oldStatus, 
        StatusDossier newStatus, UserDto changedBy)
    {
        try
        {
            // Pour simplifier, envoyer seulement au rapporteur si défini
            if (!dossier.RapporteurId.HasValue || string.IsNullOrWhiteSpace(dossier.RapporteurNom))
            {
                _logger.LogInformation("Aucun rapporteur défini pour le dossier {NumeroDossier}", 
                    dossier.NumeroDossier);
                return;
            }

            // Note: Pour un système complet, il faudrait récupérer l'email du rapporteur
            // Pour l'instant, on log juste que la notification devrait être envoyée
            _logger.LogInformation("Notification de changement de statut à envoyer au rapporteur {RapporteurId} pour le dossier {NumeroDossier}",
                dossier.RapporteurId, dossier.NumeroDossier);

            var htmlBody = EmailTemplates.GetDossierStatusChangedTemplate(
                numeroDossier: dossier.NumeroDossier,
                titre: dossier.Titre,
                oldStatus: GetStatusDisplayName(oldStatus),
                newStatus: GetStatusDisplayName(newStatus),
                changedByNom: changedBy.NomComplet,
                dateChangement: DateTime.UtcNow.ToString("dd/MM/yyyy à HH:mm"),
                dossierId: dossier.Id.ToString()
            ).Replace("{{FRONTEND_URL}}", _frontendUrl);

            // TODO: Récupérer l'email du rapporteur et envoyer
            // Pour l'instant, on skip car DossierDto n'a pas l'email du rapporteur
            
            _logger.LogInformation(
                "Email de changement de statut préparé pour le dossier {NumeroDossier}",
                dossier.NumeroDossier);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Erreur lors de l'envoi des emails de changement de statut pour le dossier {NumeroDossier}",
                dossier.NumeroDossier);
        }
    }

    public async Task SendPasswordResetEmailAsync(User user, string resetToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(user.Email))
            {
                _logger.LogWarning("L'utilisateur {UserId} n'a pas d'email configuré", user.Id);
                return;
            }

            var resetLink = $"{_frontendUrl}/reset-password?token={resetToken}";
            var expirationHours = int.TryParse(_configuration["Security:PasswordResetTokenExpirationHours"], out var hours) ? hours : 24;

            var htmlBody = EmailTemplates.GetPasswordResetTemplate(
                userName: user.NomComplet,
                resetLink: resetLink,
                expirationHours: expirationHours
            );

            await _smtpEmailService.SendEmailAsync(
                toEmail: user.Email,
                toName: user.NomComplet,
                subject: "[SIGAC] Réinitialisation de votre mot de passe",
                body: htmlBody,
                isHtml: true
            );

            _logger.LogInformation(
                "Email de réinitialisation de mot de passe envoyé à {Email}",
                user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Erreur lors de l'envoi de l'email de réinitialisation de mot de passe à {Email}",
                user.Email);
        }
    }

    public async Task SendWelcomeEmailAsync(User user, string temporaryPassword)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(user.Email))
            {
                _logger.LogWarning("L'utilisateur {UserId} n'a pas d'email configuré", user.Id);
                return;
            }

            var loginUrl = $"{_frontendUrl}/login";

            var htmlBody = EmailTemplates.GetWelcomeTemplate(
                userName: user.NomComplet,
                userEmail: user.Email,
                temporaryPassword: temporaryPassword,
                loginUrl: loginUrl
            );

            await _smtpEmailService.SendEmailAsync(
                toEmail: user.Email,
                toName: user.NomComplet,
                subject: "[SIGAC] Bienvenue - Votre compte a été créé",
                body: htmlBody,
                isHtml: true
            );

            _logger.LogInformation(
                "Email de bienvenue envoyé à {Email}",
                user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Erreur lors de l'envoi de l'email de bienvenue à {Email}",
                user.Email);
        }
    }

    public async Task SendAudienceScheduledEmailAsync(Audience audience, List<User> concernedUsers)
    {
        try
        {
            var dossier = audience.Dossier;
            var htmlBody = EmailTemplates.GetAudienceScheduledTemplate(
                audienceDate: audience.DateAudience.ToString("dd MMMM yyyy"),
                audienceHeure: audience.DateAudience.ToString("HH:mm"),
                salle: audience.Lieu ?? "Non spécifiée",
                dossierNumero: dossier.NumeroDossier,
                dossierTitre: dossier.Titre,
                audienceId: audience.Id.ToString()
            ).Replace("{{FRONTEND_URL}}", _frontendUrl);

            foreach (var user in concernedUsers)
            {
                if (string.IsNullOrWhiteSpace(user.Email))
                    continue;

                await _smtpEmailService.SendEmailAsync(
                    toEmail: user.Email,
                    toName: user.NomComplet,
                    subject: $"[SIGAC] Audience programmée - {dossier.NumeroDossier}",
                    body: htmlBody,
                    isHtml: true
                );

                _logger.LogInformation(
                    "Email de programmation d'audience envoyé à {Email} pour le dossier {NumeroDossier}",
                    user.Email, dossier.NumeroDossier);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Erreur lors de l'envoi des emails de programmation d'audience");
        }
    }

    public async Task SendCustomEmailAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        try
        {
            await _smtpEmailService.SendEmailAsync(
                toEmail: toEmail,
                toName: toName,
                subject: subject,
                body: htmlBody,
                isHtml: true
            );

            _logger.LogInformation("Email personnalisé envoyé à {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de l'envoi d'un email personnalisé à {Email}", toEmail);
        }
    }

    #region Helper Methods

    private List<User> GetStatusChangeRecipients(Dossier dossier, StatusDossier newStatus)
    {
        var recipients = new List<User>();

        // Toujours notifier le rapporteur si défini
        if (dossier.Rapporteur != null)
        {
            recipients.Add(dossier.Rapporteur);
        }

        // Selon le statut, ajouter d'autres destinataires
        // TODO: Implémenter la logique pour récupérer le président et autres parties prenantes
        // Pour l'instant, on notifie uniquement le rapporteur

        return recipients;
    }

    private string GetStatusDisplayName(StatusDossier status)
    {
        return status switch
        {
            StatusDossier.Nouveau => "Nouveau",
            StatusDossier.EnInstruction => "En instruction",
            StatusDossier.EnDelibere => "En délibéré",
            StatusDossier.Juge => "Jugé",
            StatusDossier.Classe => "Classé",
            _ => status.ToString()
        };
    }

    private string GetTypeAffaireDisplayName(string? typeAffaireNom)
    {
        // Avec le modèle dynamique, on affiche directement le nom; fallback pour anciennes valeurs
        if (string.IsNullOrWhiteSpace(typeAffaireNom))
            return "(Type d'affaire non spécifié)";
        return typeAffaireNom;
    }

    #endregion
}
