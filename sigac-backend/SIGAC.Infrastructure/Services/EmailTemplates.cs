namespace SIGAC.Infrastructure.Services;

/// <summary>
/// Templates HTML pour les emails du système SIGAC
/// </summary>
public static class EmailTemplates
{
    /// <summary>
    /// Template de base avec header et footer SIGAC
    /// </summary>
    public static string GetBaseTemplate(string content)
    {
        return $@"
<!DOCTYPE html>
<html lang=""fr"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>SIGAC - Notification</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }}
        .email-container {{
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .email-header {{
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
        }}
        .email-header h1 {{
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .email-header p {{
            margin: 5px 0 0;
            font-size: 14px;
            opacity: 0.9;
        }}
        .email-body {{
            padding: 30px 20px;
        }}
        .email-footer {{
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }}
        .button {{
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 15px 0;
        }}
        .button:hover {{
            background-color: #2563eb;
        }}
        .info-box {{
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .warning-box {{
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        table.details {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        table.details td {{
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
        }}
        table.details td:first-child {{
            font-weight: 600;
            width: 40%;
            color: #6b7280;
        }}
    </style>
</head>
<body>
    <div class=""email-container"">
        <div class=""email-header"">
            <h1>⚖️ SIGAC</h1>
            <p>Système Intégré de Gestion des Affaires Constitutionnelles</p>
        </div>
        <div class=""email-body"">
            {content}
        </div>
        <div class=""email-footer"">
            <p><strong>Cour Constitutionnelle de la République Démocratique du Congo</strong></p>
            <p>Cet email est généré automatiquement par le système SIGAC. Merci de ne pas y répondre.</p>
            <p>© {DateTime.Now.Year} Cour Constitutionnelle RDC - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>";
    }

    /// <summary>
    /// Template pour la création d'un nouveau dossier
    /// </summary>
    public static string GetDossierCreatedTemplate(string numeroDossier, string titre, string typeAffaire, 
        string rapporteurNom, string createurNom, string dateCreation, string dossierId)
    {
        var content = $@"
            <h2 style=""color: #1e3a8a; margin-top: 0;"">📂 Nouveau dossier créé</h2>
            <p>Un nouveau dossier a été créé dans le système SIGAC et vous a été assigné comme rapporteur.</p>
            
            <table class=""details"">
                <tr>
                    <td>Numéro de dossier</td>
                    <td><strong>{numeroDossier}</strong></td>
                </tr>
                <tr>
                    <td>Titre</td>
                    <td>{titre}</td>
                </tr>
                <tr>
                    <td>Type d'affaire</td>
                    <td>{typeAffaire}</td>
                </tr>
                <tr>
                    <td>Rapporteur assigné</td>
                    <td>{rapporteurNom}</td>
                </tr>
                <tr>
                    <td>Créé par</td>
                    <td>{createurNom}</td>
                </tr>
                <tr>
                    <td>Date de création</td>
                    <td>{dateCreation}</td>
                </tr>
            </table>

            <div class=""info-box"">
                <p style=""margin: 0;""><strong>ℹ️ Action requise</strong></p>
                <p style=""margin: 5px 0 0;"">Veuillez consulter le dossier pour commencer l'instruction.</p>
            </div>

            <center>
                <a href=""{{FRONTEND_URL}}/dossiers/{dossierId}"" class=""button"">📄 Voir le dossier</a>
            </center>

            <p style=""margin-top: 30px; color: #6b7280; font-size: 14px;"">
                Vous recevez cet email car vous êtes le juge rapporteur assigné à ce dossier.
            </p>
        ";

        return GetBaseTemplate(content);
    }

    /// <summary>
    /// Template pour le changement de statut d'un dossier
    /// </summary>
    public static string GetDossierStatusChangedTemplate(string numeroDossier, string titre, 
        string oldStatus, string newStatus, string changedByNom, string dateChangement, string dossierId)
    {
        var statusEmoji = newStatus switch
        {
            "EnInstruction" => "📝",
            "EnDelibere" => "👥",
            "Juge" => "⚖️",
            "Classe" => "✅",
            _ => "📋"
        };

        var content = $@"
            <h2 style=""color: #1e3a8a; margin-top: 0;"">{statusEmoji} Changement de statut</h2>
            <p>Le statut du dossier <strong>{numeroDossier}</strong> a été modifié.</p>
            
            <table class=""details"">
                <tr>
                    <td>Numéro de dossier</td>
                    <td><strong>{numeroDossier}</strong></td>
                </tr>
                <tr>
                    <td>Titre</td>
                    <td>{titre}</td>
                </tr>
                <tr>
                    <td>Ancien statut</td>
                    <td><span style=""color: #6b7280;"">{oldStatus}</span></td>
                </tr>
                <tr>
                    <td>Nouveau statut</td>
                    <td><strong style=""color: #3b82f6;"">{newStatus}</strong></td>
                </tr>
                <tr>
                    <td>Modifié par</td>
                    <td>{changedByNom}</td>
                </tr>
                <tr>
                    <td>Date de modification</td>
                    <td>{dateChangement}</td>
                </tr>
            </table>

            <center>
                <a href=""{{FRONTEND_URL}}/dossiers/{dossierId}"" class=""button"">📄 Voir le dossier</a>
            </center>

            <p style=""margin-top: 30px; color: #6b7280; font-size: 14px;"">
                Vous recevez cet email car vous êtes impliqué dans le traitement de ce dossier.
            </p>
        ";

        return GetBaseTemplate(content);
    }

    /// <summary>
    /// Template pour la réinitialisation de mot de passe
    /// </summary>
    public static string GetPasswordResetTemplate(string userName, string resetLink, int expirationHours = 24)
    {
        var content = $@"
            <h2 style=""color: #1e3a8a; margin-top: 0;"">🔐 Réinitialisation de mot de passe</h2>
            <p>Bonjour <strong>{userName}</strong>,</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe pour accéder au système SIGAC.</p>
            
            <div class=""warning-box"">
                <p style=""margin: 0;""><strong>⏱️ Important</strong></p>
                <p style=""margin: 5px 0 0;"">Ce lien est valide pendant <strong>{expirationHours} heures</strong>. Après ce délai, vous devrez faire une nouvelle demande.</p>
            </div>

            <center>
                <a href=""{resetLink}"" class=""button"">🔑 Réinitialiser mon mot de passe</a>
            </center>

            <p style=""margin-top: 30px; color: #6b7280; font-size: 14px;"">
                Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email et votre mot de passe restera inchangé.
            </p>

            <div style=""margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 4px;"">
                <p style=""margin: 0; font-size: 13px; color: #6b7280;"">
                    <strong>Pour votre sécurité :</strong><br>
                    • Ne partagez jamais ce lien avec qui que ce soit<br>
                    • Le lien ne peut être utilisé qu'une seule fois<br>
                    • Choisissez un mot de passe fort avec au moins 8 caractères
                </p>
            </div>
        ";

        return GetBaseTemplate(content);
    }

    /// <summary>
    /// Template pour l'email de bienvenue
    /// </summary>
    public static string GetWelcomeTemplate(string userName, string userEmail, string temporaryPassword, string loginUrl)
    {
        var content = $@"
            <h2 style=""color: #1e3a8a; margin-top: 0;"">👋 Bienvenue dans SIGAC !</h2>
            <p>Bonjour <strong>{userName}</strong>,</p>
            <p>Votre compte utilisateur a été créé avec succès dans le système SIGAC.</p>
            
            <table class=""details"">
                <tr>
                    <td>Nom d'utilisateur</td>
                    <td><strong>{userEmail}</strong></td>
                </tr>
                <tr>
                    <td>Mot de passe temporaire</td>
                    <td><code style=""background: #f3f4f6; padding: 5px 10px; border-radius: 4px; font-family: monospace;"">{temporaryPassword}</code></td>
                </tr>
            </table>

            <div class=""warning-box"">
                <p style=""margin: 0;""><strong>🔒 Sécurité importante</strong></p>
                <p style=""margin: 5px 0 0;"">Vous devrez changer ce mot de passe lors de votre première connexion.</p>
            </div>

            <center>
                <a href=""{loginUrl}"" class=""button"">🚀 Se connecter maintenant</a>
            </center>

            <div style=""margin-top: 30px; padding: 15px; background-color: #eff6ff; border-radius: 4px;"">
                <p style=""margin: 0; font-size: 14px;"">
                    <strong>📚 Ressources utiles :</strong><br>
                    • Guide d'utilisation du système<br>
                    • Support technique : support@sigac.cd<br>
                    • En cas de problème de connexion, contactez l'administrateur
                </p>
            </div>
        ";

        return GetBaseTemplate(content);
    }

    /// <summary>
    /// Template pour la notification d'audience programmée
    /// </summary>
    public static string GetAudienceScheduledTemplate(string audienceDate, string audienceHeure, 
        string salle, string dossierNumero, string dossierTitre, string audienceId)
    {
        var content = $@"
            <h2 style=""color: #1e3a8a; margin-top: 0;"">📅 Audience programmée</h2>
            <p>Une audience a été programmée pour le dossier dont vous êtes concerné.</p>
            
            <table class=""details"">
                <tr>
                    <td>Date de l'audience</td>
                    <td><strong style=""color: #3b82f6; font-size: 16px;"">{audienceDate}</strong></td>
                </tr>
                <tr>
                    <td>Heure</td>
                    <td><strong>{audienceHeure}</strong></td>
                </tr>
                <tr>
                    <td>Salle</td>
                    <td>{salle}</td>
                </tr>
                <tr>
                    <td>Dossier</td>
                    <td><strong>{dossierNumero}</strong> - {dossierTitre}</td>
                </tr>
            </table>

            <div class=""info-box"">
                <p style=""margin: 0;""><strong>📝 Rappel</strong></p>
                <p style=""margin: 5px 0 0;"">Merci d'être présent 15 minutes avant le début de l'audience.</p>
            </div>

            <center>
                <a href=""{{FRONTEND_URL}}/audiences/{audienceId}"" class=""button"">📋 Voir les détails</a>
            </center>

            <p style=""margin-top: 30px; color: #6b7280; font-size: 14px;"">
                Un rappel vous sera envoyé 24 heures avant l'audience.
            </p>
        ";

        return GetBaseTemplate(content);
    }
}
