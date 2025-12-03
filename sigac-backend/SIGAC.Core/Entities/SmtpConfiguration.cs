namespace SIGAC.Core.Entities;

/// <summary>
/// Configuration SMTP pour l'envoi d'emails.
/// Stockée en base de données pour permettre la modification via l'interface admin.
/// </summary>
public class SmtpConfiguration
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Hôte SMTP (ex: smtp.gmail.com, smtp.office365.com)
    /// </summary>
    public string Host { get; set; } = string.Empty;
    
    /// <summary>
    /// Port SMTP (généralement 587 pour TLS, 465 pour SSL, 25 pour non-sécurisé)
    /// </summary>
    public int Port { get; set; }
    
    /// <summary>
    /// Nom d'utilisateur pour l'authentification SMTP
    /// </summary>
    public string? Username { get; set; }
    
    /// <summary>
    /// Mot de passe chiffré pour l'authentification SMTP
    /// IMPORTANT: Chiffré avec Data Protection API avant stockage
    /// </summary>
    public string? EncryptedPassword { get; set; }
    
    /// <summary>
    /// Adresse email d'expédition (FROM)
    /// </summary>
    public string From { get; set; } = string.Empty;
    
    /// <summary>
    /// Nom d'affichage de l'expéditeur
    /// </summary>
    public string? FromName { get; set; }
    
    /// <summary>
    /// Activer SSL/TLS
    /// </summary>
    public bool EnableSsl { get; set; } = true;
    
    /// <summary>
    /// Configuration activée (si false, utilise fallback vers appsettings.json)
    /// </summary>
    public bool IsEnabled { get; set; } = false;
    
    /// <summary>
    /// Date de dernière modification
    /// </summary>
    public DateTime ModifiedAt { get; set; }
    
    /// <summary>
    /// Utilisateur ayant effectué la dernière modification
    /// </summary>
    public Guid ModifiedBy { get; set; }
    
    /// <summary>
    /// Date du dernier test de connexion réussi
    /// </summary>
    public DateTime? LastTestedAt { get; set; }
    
    /// <summary>
    /// Résultat du dernier test (null = jamais testé, true = succès, false = échec)
    /// </summary>
    public bool? LastTestSuccess { get; set; }
    
    /// <summary>
    /// Message d'erreur du dernier test (si échec)
    /// </summary>
    public string? LastTestError { get; set; }
}
