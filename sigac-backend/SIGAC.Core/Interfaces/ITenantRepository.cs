using SIGAC.Core.Entities;
using SIGAC.Core.DTOs;

namespace SIGAC.Core.Interfaces
{
    public interface ITenantRepository
    {
        // Read
        Task<Tenant?> GetByIdAsync(Guid tenantId);
        Task<Tenant?> GetBySlugAsync(string slug);
        Task<List<Tenant>> GetAllAsync(bool includeInactive = false);
        Task<PaginatedResult<TenantListDto>> GetPaginatedAsync(int page, int pageSize, string? searchTerm = null, bool includeInactive = false);

        // Stats
        Task<int> GetUserCountAsync(Guid tenantId);
        Task<int> GetWorkspaceCountAsync(Guid tenantId);
        Task<long> GetStorageUsedAsync(Guid tenantId);
        Task<int> GetDocumentCountAsync(Guid tenantId);
        Task<int> GetDossierCountAsync(Guid tenantId);
        Task<DateTime?> GetLastActivityDateAsync(Guid tenantId);

        // Subscriptions
        Task<TenantSubscription?> GetActiveSubscriptionAsync(Guid tenantId);
        Task<List<TenantSubscription>> GetSubscriptionHistoryAsync(Guid tenantId);

        // Usage Events
        Task<List<TenantUsageEvent>> GetUsageEventsAsync(Guid tenantId, string? feature = null, int days = 30);
        Task RecordUsageEventAsync(Guid tenantId, string feature, Dictionary<string, object>? metadata = null, int count = 1);

        // Create/Update/Delete
        Task AddAsync(Tenant entity);
        Task UpdateAsync(Tenant entity);
        Task DeleteAsync(Guid tenantId, bool hardDelete = false);

        // Subscription management
        Task AddSubscriptionAsync(TenantSubscription subscription);
        Task UpdateSubscriptionAsync(TenantSubscription subscription);

        // Save changes
        Task SaveChangesAsync();
    }
}
