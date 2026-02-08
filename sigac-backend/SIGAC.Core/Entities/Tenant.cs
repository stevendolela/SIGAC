using System;
using System.Collections.Generic;

namespace SIGAC.Core.Entities
{
    /// <summary>
    /// Tenant (Client SaaS) - Niveau 1 de la hiérarchie multi-tenant
    /// Représente une organisation/client qui utilise la plateforme SIGAC
    /// </summary>
    public class Tenant
    {
        public Guid Id { get; set; }
        
        // Identité Tenant
        public string Name { get; set; } = string.Empty;                    // "Cour Constitutionnelle RDC"
        public string Slug { get; set; } = string.Empty;                    // URL-friendly: "cour-rdc"
        public string? LogoBase64 { get; set; }                             // Logo encodé
        
        // Contact
        public string ContactEmail { get; set; } = string.Empty;
        public string? ContactPhone { get; set; }
        
        // Quotas & Limites (selon plan)
        public int MaxUsers { get; set; } = 10;
        public long MaxStorageGB { get; set; } = 5;
        public int MaxWorkspaces { get; set; } = 2;
        
        // Plan & Subscription
        public int Plan { get; set; } = (int)TenantPlanEnum.Starter;
        public DateTime SubscriptionStartDate { get; set; } = DateTime.UtcNow;
        public DateTime? SubscriptionEndDate { get; set; }
        
        // Stripe Integration
        public string? StripeCustomerId { get; set; }
        public string? StripeSubscriptionId { get; set; }
        
        // Status
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DeletedAt { get; set; }                            // Soft delete
        
        // Relations
        public ICollection<Workspace> Workspaces { get; set; } = new List<Workspace>();
        public ICollection<TenantUser> Users { get; set; } = new List<TenantUser>();
        public ICollection<TenantSubscription> Subscriptions { get; set; } = new List<TenantSubscription>();
        public ICollection<TenantUsageEvent> UsageEvents { get; set; } = new List<TenantUsageEvent>();
        public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    }
    
    /// <summary>
    /// Tenant Plan Enum - Pricing tiers pour SaaS
    /// </summary>
    public enum TenantPlanEnum
    {
        Starter = 0,      // €99/mois, 10 users, 5GB
        Pro = 1,          // €399/mois, 50 users, 100GB
        Enterprise = 2    // Custom pricing
    }
}
