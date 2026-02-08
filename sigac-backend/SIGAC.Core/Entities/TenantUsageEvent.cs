using System;

namespace SIGAC.Core.Entities
{
    /// <summary>
    /// TenantUsageEvent - Évènement d'utilisation pour tracking SaaS
    /// Suivi des actions pour facturation et analytics
    /// </summary>
    public class TenantUsageEvent
    {
        public Guid Id { get; set; }
        
        public Guid TenantId { get; set; }
        
        /// <summary>
        /// Feature utilisée - Format: "Entity.Action"
        /// Exemples: "Dossier.Created", "Document.Upload", "User.Added"
        /// </summary>
        public string Feature { get; set; } = string.Empty;
        
        /// <summary>
        /// Métadonnées JSON personnalisées
        /// Ex: {"size": 5242880, "mimeType": "application/pdf"}
        /// </summary>
        public string? Metadata { get; set; }
        
        /// <summary>
        /// Nombre d'occurrences de cet évènement
        /// </summary>
        public int Count { get; set; } = 1;
        
        /// <summary>
        /// Timestamp de l'évènement
        /// </summary>
        public DateTime EventDate { get; set; } = DateTime.UtcNow;
        
        // Relations
        public Tenant Tenant { get; set; } = null!;
    }
}
