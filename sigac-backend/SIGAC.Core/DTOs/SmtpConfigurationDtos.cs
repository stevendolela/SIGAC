namespace SIGAC.Core.DTOs;

/// <summary>
/// DTO pour afficher la configuration SMTP (sans le mot de passe)
/// </summary>
public class SmtpConfigurationDto
{
    public Guid Id { get; set; }
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public string? Username { get; set; }
    public string From { get; set; } = string.Empty;
    public string? FromName { get; set; }
    public bool EnableSsl { get; set; }
    public bool IsEnabled { get; set; }
    public DateTime ModifiedAt { get; set; }
    public Guid ModifiedBy { get; set; }
    public DateTime? LastTestedAt { get; set; }
    public bool? LastTestSuccess { get; set; }
    public string? LastTestError { get; set; }
    
    /// <summary>
    /// Indique si un mot de passe est configuré (sans l'exposer)
    /// </summary>
    public bool HasPassword { get; set; }
}

/// <summary>
/// DTO pour mettre à jour la configuration SMTP
/// </summary>
public class UpdateSmtpConfigurationDto
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public string? Username { get; set; }
    
    /// <summary>
    /// Mot de passe en clair (sera chiffré avant stockage)
    /// Si null/vide, le mot de passe existant n'est pas modifié
    /// </summary>
    public string? Password { get; set; }
    
    public string From { get; set; } = string.Empty;
    public string? FromName { get; set; }
    public bool EnableSsl { get; set; }
    public bool IsEnabled { get; set; }
}

/// <summary>
/// DTO pour tester la connexion SMTP
/// </summary>
public class TestSmtpConnectionDto
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }
    public bool EnableSsl { get; set; }
    public string? From { get; set; }
    public string? FromName { get; set; }
    
    /// <summary>
    /// Email de test pour vérifier l'envoi (optionnel)
    /// </summary>
    public string? TestEmailTo { get; set; }
}

/// <summary>
/// Résultat du test de connexion SMTP
/// </summary>
public class SmtpTestResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime TestedAt { get; set; }
    public string? ErrorDetails { get; set; }
}
