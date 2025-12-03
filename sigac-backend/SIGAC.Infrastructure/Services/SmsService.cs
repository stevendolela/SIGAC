using Microsoft.Extensions.Logging;
using SIGAC.Core.Interfaces;

namespace SIGAC.Infrastructure.Services;

public class SmsService : ISmsService
{
    private readonly ILogger<SmsService> _logger;

    public SmsService(ILogger<SmsService> logger)
    {
        _logger = logger;
    }

    public async Task<bool> SendVerificationCodeAsync(string phoneNumber, string code)
    {
        // TODO: Intégrer un vrai service SMS (Twilio, AWS SNS, Africa's Talking, etc.)
        // Pour l'instant, on log seulement le code
        
        _logger.LogInformation(
            "SMS envoyé au numéro {PhoneNumber}: Votre code de vérification SIGAC est {Code}. Ce code expire dans 15 minutes.",
            phoneNumber, code);

        // Simuler un envoi réussi
        await Task.Delay(100);
        
        return true;
    }
}
