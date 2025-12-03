namespace SIGAC.Core.Interfaces;

public interface ISmsService
{
    /// <summary>
    /// Envoie un SMS avec un code de vérification
    /// </summary>
    /// <param name="phoneNumber">Numéro de téléphone du destinataire</param>
    /// <param name="code">Code de vérification à envoyer</param>
    /// <returns>True si l'envoi a réussi, sinon False</returns>
    Task<bool> SendVerificationCodeAsync(string phoneNumber, string code);
}
