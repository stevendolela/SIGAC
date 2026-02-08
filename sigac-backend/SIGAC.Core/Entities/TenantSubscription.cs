using System;

namespace SIGAC.Core.Entities
{
    /// <summary>
    /// TenantSubscription - Historique des souscriptions d'un Tenant
    /// Suivi des plans, dates de renouvellement et statuts
    /// </summary>
    public class TenantSubscription
    {
        public Guid Id { get; set; }
        
        public Guid TenantId { get; set; }
        
        // Plan Details
        public int Plan { get; set; }                                        // TenantPlanEnum
        
        // Dates
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? EndDate { get; set; }
        
        // Pricing
        public decimal MonthlyCostEuro { get; set; }
        
        // Stripe Integration
        public string? StripeSubscriptionId { get; set; }
        public int Status { get; set; } = (int)SubscriptionStatusEnum.Active;
        
        // Auto-renewal
        public bool AutoRenew { get; set; } = true;
        public DateTime? RenewDate { get; set; }
        
        // Relations
        public Tenant Tenant { get; set; } = null!;
    }
    
    /// <summary>
    /// Subscription Status Enum
    /// Statuts possibles d'une souscription Stripe
    /// </summary>
    public enum SubscriptionStatusEnum
    {
        Active = 0,
        PastDue = 1,
        Paused = 2,
        Canceled = 3
    }
}
