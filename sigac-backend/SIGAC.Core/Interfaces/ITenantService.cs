using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;

namespace SIGAC.Core.Interfaces
{
    public interface ITenantService
    {
        // Read
        Task<TenantDto?> GetByIdAsync(Guid tenantId);
        Task<TenantDto?> GetBySlugAsync(string slug);
        Task<PaginatedResult<TenantListDto>> GetTenantsPaginatedAsync(int page, int pageSize, string? searchTerm = null);

        // Create
        Task<TenantDto> CreateTenantAsync(CreateTenantDto createDto, Guid operatorId);

        // Update
        Task<TenantDto> UpdateTenantAsync(Guid tenantId, UpdateTenantDto updateDto, Guid operatorId);

        // Delete (soft delete)
        Task DeleteTenantAsync(Guid tenantId, Guid operatorId);

        // Subscriptions
        Task AddSubscriptionAsync(Guid tenantId, CreateTenantSubscriptionDto subscriptionDto, Guid operatorId);
        Task<TenantSubscriptionDto?> GetActiveSubscriptionAsync(Guid tenantId);

        // Stats
        Task<TenantStatsDto> GetTenantStatsAsync(Guid tenantId);

        // Usage
        Task RecordUsageAsync(Guid tenantId, string feature, Dictionary<string, object>? metadata = null);
    }

    /// <summary>
    /// DTO for creating subscription
    /// </summary>
    public class CreateTenantSubscriptionDto
    {
        public TenantPlanEnum Plan { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? MonthlyCostEuro { get; set; }
        public string? StripeSubscriptionId { get; set; }
        public bool AutoRenew { get; set; } = true;
    }

    /// <summary>
    /// DTO for tenant statistics
    /// </summary>
    public class TenantStatsDto
    {
        public Guid TenantId { get; set; }
        public int UserCount { get; set; }
        public int WorkspaceCount { get; set; }
        public long StorageUsedGB { get; set; }
        public long StorageAvailableGB { get; set; }
        public double StoragePercentUsed { get; set; }
        public int DocumentCount { get; set; }
        public int DossierCount { get; set; }
        public DateTime LastActivityDate { get; set; }
    }
}
