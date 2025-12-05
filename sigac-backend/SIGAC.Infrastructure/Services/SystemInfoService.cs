using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using SIGAC.Core.DTOs;
using SIGAC.Core.Interfaces;
using SIGAC.Infrastructure.Data;

namespace SIGAC.Infrastructure.Services
{
    /// <summary>
    /// Service pour récupérer les informations système et API
    /// </summary>
    public class SystemInfoServiceImpl : ISystemInfoService
    {
        private readonly ApplicationDbContext _context;
        private static readonly DateTime ApplicationStartTime = DateTime.UtcNow;
        private static long TotalRequestCount = 0;

        public SystemInfoServiceImpl(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Récupère les informations système complètes
        /// </summary>
        public async Task<SystemInfoDto> GetSystemInfoAsync()
        {
            try
            {
                var process = Process.GetCurrentProcess();
                var databaseStatus = await GetDatabaseStatusAsync();

                var info = new SystemInfoDto
                {
                    ApplicationName = "SIGAC - Système de Gestion des Affaires Constitutionnelles",
                    ApiVersion = "1.0.0",
                    RuntimeVersion = $".NET {GetDotNetVersion()}",
                    Environment = GetEnvironment(),
                    DatabaseStatus = databaseStatus,
                    DatabaseType = "PostgreSQL 15",
                    ApplicationStartTime = ApplicationStartTime,
                    UptimeSeconds = (long)(DateTime.UtcNow - ApplicationStartTime).TotalSeconds,
                    MemoryUsageMB = Math.Round(process.WorkingSet64 / (1024.0 * 1024.0), 2),
                    TotalRequests = TotalRequestCount,
                    DatabaseHost = ExtractDatabaseHost(),
                    LastBackupTime = null,
                    ExternalServices = new Dictionary<string, string>
                    {
                        { "CORS", "Configured" },
                        { "JWT", "Active" },
                        { "SSL/TLS", "Enabled" },
                        { "Audit Logging", "Active" }
                    },
                    GeneratedAt = DateTime.UtcNow
                };

                // Compter les entités
                info.ActiveUsers = await _context.Users.CountAsync();
                info.TotalDossiers = await _context.Dossiers.CountAsync();
                info.TotalDocuments = await _context.Documents.CountAsync();

                return info;
            }
            catch (Exception)
            {
                throw;
            }
        }

        /// <summary>
        /// Obtient le statut de la base de données
        /// </summary>
        public async Task<string> GetDatabaseStatusAsync()
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync("SELECT 1");
                return "Connected";
            }
            catch
            {
                return "Disconnected";
            }
        }

        /// <summary>
        /// Extrait le host de la connexion PostgreSQL
        /// </summary>
        private string ExtractDatabaseHost()
        {
            try
            {
                var connection = _context.Database.GetConnectionString();
                if (string.IsNullOrEmpty(connection))
                    return "Unknown";

                var hostPart = connection.Split(';')
                    .FirstOrDefault(x => x.StartsWith("Host="));

                return hostPart?.Replace("Host=", "") ?? "Unknown";
            }
            catch
            {
                return "Unknown";
            }
        }

        /// <summary>
        /// Récupère la version de .NET
        /// </summary>
        private string GetDotNetVersion()
        {
            return System.Runtime.InteropServices.RuntimeInformation
                .FrameworkDescription ?? "Unknown";
        }

        /// <summary>
        /// Récupère l'environnement actuel
        /// </summary>
        private string GetEnvironment()
        {
            return System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
        }

        /// <summary>
        /// Incrémente le compteur de requêtes
        /// </summary>
        public static void IncrementRequestCount()
        {
            Interlocked.Increment(ref TotalRequestCount);
        }
    }
}
