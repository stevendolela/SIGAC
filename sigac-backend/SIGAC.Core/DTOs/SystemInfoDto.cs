namespace SIGAC.Core.DTOs
{
    /// <summary>
    /// DTO contenant les informations sur l'API et le système
    /// Accessible uniquement aux administrateurs
    /// </summary>
    public class SystemInfoDto
    {
        /// <summary>
        /// Nom de l'application
        /// </summary>
        public string ApplicationName { get; set; } = "SIGAC - Système de Gestion des Affaires Constitutionnelles";

        /// <summary>
        /// Version de l'API
        /// </summary>
        public string ApiVersion { get; set; } = "1.0.0";

        /// <summary>
        /// Version de .NET Runtime
        /// </summary>
        public string RuntimeVersion { get; set; } = string.Empty;

        /// <summary>
        /// Environnement (Production/Development/Staging)
        /// </summary>
        public string Environment { get; set; } = string.Empty;

        /// <summary>
        /// Statut de la base de données
        /// </summary>
        public string DatabaseStatus { get; set; } = string.Empty;

        /// <summary>
        /// Type de base de données
        /// </summary>
        public string DatabaseType { get; set; } = "PostgreSQL 15";

        /// <summary>
        /// Timestamp du démarrage de l'application
        /// </summary>
        public DateTime ApplicationStartTime { get; set; }

        /// <summary>
        /// Uptime de l'application en secondes
        /// </summary>
        public long UptimeSeconds { get; set; }

        /// <summary>
        /// Utilisation mémoire en MB
        /// </summary>
        public double MemoryUsageMB { get; set; }

        /// <summary>
        /// Nombre total de requêtes traitées
        /// </summary>
        public long TotalRequests { get; set; }

        /// <summary>
        /// Nombre d'utilisateurs actifs
        /// </summary>
        public int ActiveUsers { get; set; }

        /// <summary>
        /// Nombre de dossiers dans la base
        /// </summary>
        public int TotalDossiers { get; set; }

        /// <summary>
        /// Nombre de documents
        /// </summary>
        public int TotalDocuments { get; set; }

        /// <summary>
        /// URL de la base de données (host uniquement, pas le password!)
        /// </summary>
        public string DatabaseHost { get; set; } = string.Empty;

        /// <summary>
        /// Date/heure du dernier backup (si applicable)
        /// </summary>
        public DateTime? LastBackupTime { get; set; }

        /// <summary>
        /// Logs récents
        /// </summary>
        public List<string> RecentLogs { get; set; } = new();

        /// <summary>
        /// Statut des services externes
        /// </summary>
        public Dictionary<string, string> ExternalServices { get; set; } = new();

        /// <summary>
        /// Timestamp de génération
        /// </summary>
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }
}
