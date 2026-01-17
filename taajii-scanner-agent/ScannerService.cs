using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;

namespace TaajiiScannerAgent
{
    public class ScannerInfo
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
    }

    public static class ScannerService
    {
        // WIA Constants
        private const string WIA_DEVICE_PROPERTY_DEVICE_NAME = "Name";
        private const string WIA_FORMAT_PNG = "{B96B3CAF-0728-11D3-9D7B-0000F81EF32E}";

        /// <summary>
        /// Liste les scanners disponibles via WIA (COM Interop dynamique)
        /// </summary>
        public static List<ScannerInfo> GetAvailableScanners()
        {
            var scanners = new List<ScannerInfo>();

            try
            {
                // Créer DeviceManager via COM dynamique
                Type? deviceManagerType = Type.GetTypeFromProgID("WIA.DeviceManager");
                if (deviceManagerType == null)
                {
                    Console.WriteLine("WIA non disponible sur ce système");
                    return scanners;
                }

                dynamic deviceManager = Activator.CreateInstance(deviceManagerType)!;
                
                foreach (dynamic deviceInfo in deviceManager.DeviceInfos)
                {
                    // Type 1 = Scanner
                    if ((int)deviceInfo.Type == 1)
                    {
                        string deviceId = deviceInfo.DeviceID;
                        string deviceName = deviceId;

                        // Essayer de récupérer le nom
                        try
                        {
                            foreach (dynamic prop in deviceInfo.Properties)
                            {
                                if (prop.Name == WIA_DEVICE_PROPERTY_DEVICE_NAME)
                                {
                                    deviceName = prop.get_Value()?.ToString() ?? deviceId;
                                    break;
                                }
                            }
                        }
                        catch { /* Ignore */ }

                        scanners.Add(new ScannerInfo
                        {
                            Id = deviceId,
                            Name = deviceName
                        });
                    }
                }
            }
            catch (COMException ex)
            {
                Console.WriteLine($"Erreur WIA: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur liste scanners: {ex.Message}");
            }

            return scanners;
        }

        /// <summary>
        /// Scan un document et retourne l'image en Base64 (avec retry automatique)
        /// </summary>
        public static string? ScanDocument(string? scannerId = null, int maxRetries = 3)
        {
            Exception? lastException = null;
            
            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    return PerformScan(scannerId);
                }
                catch (COMException ex)
                {
                    uint errorCode = (uint)ex.ErrorCode;
                    lastException = ex;
                    
                    // Si scanner occupé et qu'on a encore des tentatives, attendre et réessayer
                    if (errorCode == 0x80210006 && attempt < maxRetries)
                    {
                        Console.WriteLine($"Scanner occupé, tentative {attempt}/{maxRetries}. Réessai dans 2s...");
                        Thread.Sleep(2000);
                        continue;
                    }
                    
                    // Sinon, lever l'exception avec message lisible
                    string message = errorCode switch
                    {
                        0x80210006 => "Le scanner est occupé. Fermez les autres applications qui l'utilisent et réessayez.",
                        0x80210016 => "Le capot du scanner est ouvert.",
                        0x8021000C => "Pas de papier dans le chargeur automatique. Placez un document.",
                        0x80210005 => "Le scanner est hors ligne. Vérifiez la connexion USB/réseau.",
                        0x80210001 => "Erreur générale du scanner. Redémarrez-le.",
                        0x80004005 => "Erreur d'accès au scanner. Vérifiez qu'il est allumé.",
                        _ => $"Erreur scanner (0x{errorCode:X8}): {ex.Message}"
                    };
                    throw new Exception(message);
                }
                catch (Exception ex)
                {
                    lastException = ex;
                    if (attempt < maxRetries)
                    {
                        Console.WriteLine($"Erreur scan, tentative {attempt}/{maxRetries}. Réessai...");
                        Thread.Sleep(1000);
                        continue;
                    }
                    throw;
                }
            }
            
            throw lastException ?? new Exception("Échec du scan après plusieurs tentatives");
        }

        /// <summary>
        /// Effectue le scan proprement dit
        /// </summary>
        private static string? PerformScan(string? scannerId)
        {
            Type? deviceManagerType = Type.GetTypeFromProgID("WIA.DeviceManager");
            if (deviceManagerType == null)
            {
                throw new Exception("WIA n'est pas disponible sur ce système.");
            }

            dynamic deviceManager = Activator.CreateInstance(deviceManagerType)!;
            dynamic? scanner = null;

            // Chercher le scanner
            foreach (dynamic deviceInfo in deviceManager.DeviceInfos)
            {
                if ((int)deviceInfo.Type == 1) // Scanner
                {
                    if (string.IsNullOrEmpty(scannerId) || deviceInfo.DeviceID == scannerId)
                    {
                        scanner = deviceInfo.Connect();
                        break;
                    }
                }
            }

            if (scanner == null)
            {
                throw new Exception("Aucun scanner trouvé. Vérifiez que votre scanner est allumé et connecté.");
            }

            // Récupérer l'item de scan (première source)
            dynamic scannerItem = scanner.Items[1];

            // Configurer les propriétés de scan
            SetScannerProperties(scannerItem);

            // Effectuer le scan - format PNG
            dynamic imageFile = scannerItem.Transfer(WIA_FORMAT_PNG);

            // Récupérer les données binaires
            byte[] imageBytes = (byte[])imageFile.FileData.get_BinaryData();
            
            return Convert.ToBase64String(imageBytes);
        }

        /// <summary>
        /// Configure les propriétés de scan (résolution, couleur, etc.)
        /// </summary>
        private static void SetScannerProperties(dynamic scannerItem)
        {
            try
            {
                // Propriétés WIA courantes
                foreach (dynamic prop in scannerItem.Properties)
                {
                    try
                    {
                        switch ((int)prop.PropertyID)
                        {
                            case 6147: // Horizontal Resolution
                            case 6148: // Vertical Resolution
                                prop.set_Value(200); // 200 DPI
                                break;
                            case 6146: // Color Mode (1=Color, 2=Grayscale, 4=BW)
                                prop.set_Value(1);
                                break;
                        }
                    }
                    catch { /* Ignorer si la propriété n'est pas modifiable */ }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Avertissement config scanner: {ex.Message}");
            }
        }
    }
}
