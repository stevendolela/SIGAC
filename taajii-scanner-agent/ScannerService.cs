using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

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
        /// Scan un document et retourne l'image en Base64
        /// </summary>
        public static string? ScanDocument(string? scannerId = null)
        {
            try
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
            catch (COMException ex)
            {
                // Codes d'erreur WIA courants
                uint errorCode = (uint)ex.ErrorCode;
                string message = errorCode switch
                {
                    0x80210006 => "Le scanner est occupé. Veuillez réessayer.",
                    0x80210016 => "Le capot du scanner est ouvert.",
                    0x8021000C => "Pas de papier dans le chargeur automatique.",
                    0x80210005 => "Le scanner est hors ligne. Vérifiez la connexion.",
                    0x80210001 => "Erreur générale du scanner.",
                    _ => $"Erreur scanner (0x{errorCode:X8}): {ex.Message}"
                };
                throw new Exception(message);
            }
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
