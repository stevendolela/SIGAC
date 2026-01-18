using System.Drawing;
using System.Drawing.Imaging;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;
using Tesseract;
using Tesseract.Interop;

namespace SIGAC.Core.Services;

/// <summary>
/// Service OCR utilisant Tesseract pour l'extraction de texte
/// </summary>
public class OcrService : IOcrService
{
    private readonly string _tessDataPath;
    private readonly string _language;

    public OcrService()
    {
        // Chemin vers les données Tesseract (tessdata)
        // En production, configurez via appsettings.json
        _tessDataPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "tessdata");
        _language = "fra+eng"; // Français + Anglais
        
        // Créer le dossier tessdata s'il n'existe pas
        if (!Directory.Exists(_tessDataPath))
        {
            Directory.CreateDirectory(_tessDataPath);
        }
    }

    public async Task<OcrResultDto> AnalyzeDocumentAsync(byte[] fileData, string mimeType)
    {
        return await Task.Run(() =>
        {
            try
            {
                // Vérifier si c'est un PDF ou une image
                if (mimeType.Contains("pdf"))
                {
                    return AnalyzePdf(fileData);
                }
                else
                {
                    return AnalyzeImage(fileData);
                }
            }
            catch (Exception ex)
            {
                return new OcrResultDto
                {
                    Success = false,
                    Erreur = $"Erreur OCR: {ex.Message}"
                };
            }
        });
    }

    public async Task<OcrResultDto> AnalyzeDocumentFromBase64Async(string base64Data, string mimeType)
    {
        var fileData = Convert.FromBase64String(base64Data);
        return await AnalyzeDocumentAsync(fileData, mimeType);
    }

    private OcrResultDto AnalyzeImage(byte[] imageData)
    {
        try
        {
            // Vérifier si tessdata existe
            if (!Directory.Exists(_tessDataPath) || !File.Exists(Path.Combine(_tessDataPath, "fra.traineddata")))
            {
                // Fallback: extraction basique sans Tesseract
                return ExtractWithoutTesseract(imageData);
            }

            // Conversion en Bitmap pour crop
            using (var ms = new MemoryStream(imageData))
            using (var bmp = new System.Drawing.Bitmap(ms))
            {
                int headerHeight = (int)(bmp.Height * 0.2);
                if (headerHeight < 40) headerHeight = Math.Min(40, bmp.Height); // minimum 40px
                var rect = new System.Drawing.Rectangle(0, 0, bmp.Width, headerHeight);
                using (var headerBmp = bmp.Clone(rect, bmp.PixelFormat))
                using (var croppedStream = new MemoryStream())
                {
                    headerBmp.Save(croppedStream, System.Drawing.Imaging.ImageFormat.Png);
                    croppedStream.Position = 0;
                    using var headerImg = Pix.LoadFromMemory(croppedStream.ToArray());
                    using var engine = new TesseractEngine(_tessDataPath, _language, EngineMode.Default);
                    using var page = engine.Process(headerImg);
                    var text = page.GetText();
                    var confidence = (int)(page.GetMeanConfidence() * 100);

                    var result = new OcrResultDto
                    {
                        Success = true,
                        TexteComplet = text,
                        Confiance = confidence
                    };

                    // Extraire les métadonnées de l'en-tête
                    ExtractMetadata(text, result);

                    return result;
                }
            }
        }
        catch (Exception ex)
        {
            // Si Tesseract échoue, utiliser l'extraction basique
            Console.WriteLine($"Tesseract error: {ex.Message}, using fallback");
            return ExtractWithoutTesseract(imageData);
        }
    }

    private OcrResultDto AnalyzePdf(byte[] pdfData)
    {
        // Extraction de l'en-tête du PDF (haut de la première page) via PdfPig
        try
        {
            using (var ms = new MemoryStream(pdfData))
            {
                var headerText = string.Empty;
                int confidence = 100; // PdfPig ne fournit pas de score, on met 100 par défaut
                using (var pdf = UglyToad.PdfPig.PdfDocument.Open(ms))
                {
                    var firstPage = pdf.GetPage(1);
                    // On récupère les textes du haut de la page (top 20%)
                    var pageHeight = firstPage.Height;
                    var headerZone = pageHeight * 0.2;
                    var words = firstPage.GetWords();
                    var headerWords = words
                        .Where(w => w.BoundingBox.Bottom >= (pageHeight - headerZone))
                        .OrderBy(w => w.BoundingBox.Left)
                        .ThenByDescending(w => w.BoundingBox.Bottom)
                        .Select(w => w.Text);
                    headerText = string.Join(" ", headerWords);

                    var result = new OcrResultDto
                    {
                        Success = true,
                        TexteComplet = headerText,
                        Confiance = confidence
                    };
                    // Extraction des métadonnées de l'en-tête si besoin
                    ExtractMetadata(headerText, result);
                    return result;
                }
            }
        }
        catch (Exception ex)
        {
            return new OcrResultDto
            {
                Success = false,
                TexteComplet = string.Empty,
                Confiance = 0,
                Erreur = $"Erreur extraction PDF: {ex.Message}"
            };
        }
    }

    private OcrResultDto ExtractWithoutTesseract(byte[] imageData)
    {
        // Extraction simulée sans Tesseract
        // En production, vous pouvez utiliser Azure Cognitive Services ou Google Cloud Vision
        return new OcrResultDto
        {
            Success = true,
            TexteComplet = "[OCR non disponible - Tesseract non installé. Veuillez saisir manuellement les informations.]",
            Confiance = 0,
            Erreur = "Tesseract OCR n'est pas configuré. Veuillez installer les fichiers tessdata ou saisir les informations manuellement."
        };
    }

    /// <summary>
    /// Extrait les métadonnées depuis le texte OCR (en-tête du document)
    /// </summary>
    private void ExtractMetadata(string text, OcrResultDto result)
    {
        if (string.IsNullOrWhiteSpace(text))
            return;

        var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                       .Select(l => l.Trim())
                       .Where(l => !string.IsNullOrWhiteSpace(l))
                       .ToList();

        // Recherche de l'objet (généralement après "Objet:", "Sujet:", "Concernant:", "Re:", "Ref:")
        result.ObjetDetecte = ExtractField(text, new[] { 
            @"(?:Objet|Sujet|Concernant|Re|Ref)\s*[:\-]\s*(.+)",
            @"(?:OBJET|SUJET)\s*[:\-]\s*(.+)"
        });

        // Recherche de l'expéditeur
        result.ExpediteurDetecte = ExtractField(text, new[] {
            @"(?:De|From|Expéditeur|Expediteur)\s*[:\-]\s*(.+)",
            @"(?:DE|FROM)\s*[:\-]\s*(.+)"
        });

        // Recherche du destinataire
        result.DestinataireDetecte = ExtractField(text, new[] {
            @"(?:À|A|To|Destinataire|Pour)\s*[:\-]\s*(.+)",
            @"(?:Monsieur|Madame|M\.|Mme)\s+(?:le|la)?\s*(?:Directeur|Président|Ministre|Secrétaire)?.+",
            @"(?:À L'ATTENTION DE|ATTENTION)\s*[:\-]?\s*(.+)"
        });

        // Recherche de la date
        result.DateDetectee = ExtractDate(text);

        // Recherche de la référence
        result.ReferenceDetectee = ExtractField(text, new[] {
            @"(?:Réf|Ref|Référence|Reference|N°|N/Réf|V/Réf)\s*[:\-]?\s*([A-Z0-9\-\/]+)",
            @"(?:REF|N°)\s*[:\-]?\s*([A-Z0-9\-\/\.]+)"
        });

        // Si l'objet n'est pas trouvé, prendre les premières lignes significatives
        if (string.IsNullOrEmpty(result.ObjetDetecte) && lines.Count > 3)
        {
            // Chercher une ligne qui pourrait être l'objet (généralement après l'en-tête)
            for (int i = 3; i < Math.Min(lines.Count, 10); i++)
            {
                var line = lines[i];
                if (line.Length > 20 && line.Length < 200 && !IsHeaderLine(line))
                {
                    result.ObjetDetecte = line;
                    break;
                }
            }
        }
    }

    private string? ExtractField(string text, string[] patterns)
    {
        foreach (var pattern in patterns)
        {
            var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase | RegexOptions.Multiline);
            if (match.Success && match.Groups.Count > 1)
            {
                var value = match.Groups[1].Value.Trim();
                if (!string.IsNullOrWhiteSpace(value) && value.Length > 2)
                {
                    // Nettoyer la valeur
                    value = Regex.Replace(value, @"\s+", " ");
                    // Limiter la longueur
                    if (value.Length > 200)
                        value = value.Substring(0, 200);
                    return value;
                }
            }
        }
        return null;
    }

    private DateTime? ExtractDate(string text)
    {
        // Patterns de date français et anglais
        var datePatterns = new[]
        {
            // Format: Le 15 janvier 2026, Kinshasa le 15/01/2026
            @"(?:le\s+)?(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})",
            // Format: 15/01/2026, 15-01-2026
            @"(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})",
            // Format: 2026-01-15 (ISO)
            @"(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})",
            // Format anglais: January 15, 2026
            @"(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})"
        };

        var monthsFr = new Dictionary<string, int>
        {
            {"janvier", 1}, {"février", 2}, {"mars", 3}, {"avril", 4},
            {"mai", 5}, {"juin", 6}, {"juillet", 7}, {"août", 8},
            {"septembre", 9}, {"octobre", 10}, {"novembre", 11}, {"décembre", 12}
        };

        var monthsEn = new Dictionary<string, int>
        {
            {"january", 1}, {"february", 2}, {"march", 3}, {"april", 4},
            {"may", 5}, {"june", 6}, {"july", 7}, {"august", 8},
            {"september", 9}, {"october", 10}, {"november", 11}, {"december", 12}
        };

        // Pattern 1: Date française avec mois en lettres
        var match = Regex.Match(text, datePatterns[0], RegexOptions.IgnoreCase);
        if (match.Success)
        {
            var day = int.Parse(match.Groups[1].Value);
            var monthStr = match.Groups[2].Value.ToLower();
            var year = int.Parse(match.Groups[3].Value);
            
            if (monthsFr.TryGetValue(monthStr, out var month))
            {
                try { return new DateTime(year, month, day); }
                catch { }
            }
        }

        // Pattern 2: Date numérique JJ/MM/AAAA
        match = Regex.Match(text, datePatterns[1]);
        if (match.Success)
        {
            var day = int.Parse(match.Groups[1].Value);
            var month = int.Parse(match.Groups[2].Value);
            var year = int.Parse(match.Groups[3].Value);
            
            try { return new DateTime(year, month, day); }
            catch { }
        }

        // Pattern 3: Date ISO AAAA-MM-JJ
        match = Regex.Match(text, datePatterns[2]);
        if (match.Success)
        {
            var year = int.Parse(match.Groups[1].Value);
            var month = int.Parse(match.Groups[2].Value);
            var day = int.Parse(match.Groups[3].Value);
            
            try { return new DateTime(year, month, day); }
            catch { }
        }

        // Pattern 4: Date anglaise
        match = Regex.Match(text, datePatterns[3], RegexOptions.IgnoreCase);
        if (match.Success)
        {
            var monthStr = match.Groups[1].Value.ToLower();
            var day = int.Parse(match.Groups[2].Value);
            var year = int.Parse(match.Groups[3].Value);
            
            if (monthsEn.TryGetValue(monthStr, out var month))
            {
                try { return new DateTime(year, month, day); }
                catch { }
            }
        }

        return null;
    }

    private bool IsHeaderLine(string line)
    {
        // Lignes à ignorer (en-têtes typiques)
        var headerPatterns = new[]
        {
            @"^(REPUBLIQUE|RÉPUBLIQUE)",
            @"^(MINISTERE|MINISTÈRE)",
            @"^(DIRECTION|SERVICE)",
            @"^(BP|B\.P\.|Tél|Tel|Fax|Email|E-mail)",
            @"^\d{5}\s+\w+", // Code postal
            @"^www\.",
            @"^\+\d"
        };

        return headerPatterns.Any(p => Regex.IsMatch(line, p, RegexOptions.IgnoreCase));
    }
}
