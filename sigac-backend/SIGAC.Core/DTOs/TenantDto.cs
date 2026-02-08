using SIGAC.Core.Entities;

namespace SIGAC.Core.DTOs
{
    /// <summary>
    /// DTO for Tenant (SaaS Client) - Detail view with full information
    /// </summary>
    public class TenantDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? LogoBase64 { get; set; }
        public TenantPlanEnum Plan { get; set; }
        public int MaxUsers { get; set; }
        public long MaxStorageGB { get; set; }
        public int MaxWorkspaces { get; set; }
        public string? StripeCustomerId { get; set; }
        public string? StripeSubscriptionId { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }

        // Stats
        public int UserCount { get; set; }
        public int WorkspaceCount { get; set; }
        public long StorageUsedGB { get; set; }
    }

    /// <summary>
    /// List view - Lean version without nested data
    /// </summary>
    public class TenantListDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? LogoBase64 { get; set; }
        public TenantPlanEnum Plan { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int UserCount { get; set; }
        public int WorkspaceCount { get; set; }
    }

    /// <summary>
    /// Create new Tenant
    /// </summary>
    public class CreateTenantDto
    {
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? LogoBase64 { get; set; }
        public TenantPlanEnum Plan { get; set; } = TenantPlanEnum.Starter;
        public int MaxUsers { get; set; } = 10;
        public long MaxStorageGB { get; set; } = 5;
        public int MaxWorkspaces { get; set; } = 3;
        public string? StripeCustomerId { get; set; }
    }

    /// <summary>
    /// Update existing Tenant
    /// </summary>
    public class UpdateTenantDto
    {
        public string? Name { get; set; }
        public string? LogoBase64 { get; set; }
        public TenantPlanEnum? Plan { get; set; }
        public int? MaxUsers { get; set; }
        public long? MaxStorageGB { get; set; }
        public int? MaxWorkspaces { get; set; }
        public bool? IsActive { get; set; }
    }

    /// <summary>
    /// Subscription status for Tenant
    /// </summary>
    public class TenantSubscriptionDto
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public TenantPlanEnum Plan { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? MonthlyCostEuro { get; set; }
        public string? StripeSubscriptionId { get; set; }
        public int Status { get; set; }
        public bool AutoRenew { get; set; }
        public DateTime? RenewDate { get; set; }
    }

    /// <summary>
    /// Usage event for Tenant
    /// </summary>
    public class TenantUsageEventDto
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public string Feature { get; set; } = string.Empty;
        public Dictionary<string, object>? Metadata { get; set; }
        public int Count { get; set; }
        public DateTime EventDate { get; set; }
    }
}
