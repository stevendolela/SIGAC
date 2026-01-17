using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces;

/// <summary>
/// Interface pour le service OCR (reconnaissance optique de caractères)
/// </summary>
public interface IOcrService
{
    /// <summary>
    /// Analyse un document image/PDF et extrait le texte
    /// </summary>
    /// <param name="fileData">Données du fichier en bytes</param>
    /// <param name="mimeType">Type MIME du fichier</param>
    /// <returns>Résultat OCR avec texte et métadonnées extraites</returns>
    Task<OcrResultDto> AnalyzeDocumentAsync(byte[] fileData, string mimeType);
    
    /// <summary>
    /// Analyse un document depuis une chaîne Base64
    /// </summary>
    Task<OcrResultDto> AnalyzeDocumentFromBase64Async(string base64Data, string mimeType);
}
