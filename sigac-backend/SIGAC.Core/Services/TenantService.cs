using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Core.DTOs;
using AutoMapper;

namespace SIGAC.Core.Services
{
    public class TenantService : ITenantService
    {
        private readonly ITenantRepository _tenantRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly IMapper _mapper;

        public TenantService(
            ITenantRepository tenantRepository,
            IAuditLogRepository auditLogRepository,
            IMapper mapper)
        {
            _tenantRepository = tenantRepository;
            _auditLogRepository = auditLogRepository;
            _mapper = mapper;
        }

        public async Task<TenantDto?> GetByIdAsync(Guid tenantId)
        {
            var tenant = await _tenantRepository.GetByIdAsync(tenantId);
            if (tenant == null) return null;

            var dto = _mapper.Map<TenantDto>(tenant);
            dto.UserCount = await _tenantRepository.GetUserCountAsync(tenantId);
            dto.WorkspaceCount = await _tenantRepository.GetWorkspaceCountAsync(tenantId);
            dto.StorageUsedGB = await _tenantRepository.GetStorageUsedAsync(tenantId);

            return dto;
        }

        public async Task<TenantDto?> GetBySlugAsync(string slug)
        {
            var tenant = await _tenantRepository.GetBySlugAsync(slug);
            if (tenant == null) return null;

            var dto = _mapper.Map<TenantDto>(tenant);
            dto.UserCount = await _tenantRepository.GetUserCountAsync(tenant.Id);
            dto.WorkspaceCount = await _tenantRepository.GetWorkspaceCountAsync(tenant.Id);
            dto.StorageUsedGB = await _tenantRepository.GetStorageUsedAsync(tenant.Id);

            return dto;
        }

        public async Task<PaginatedResult<TenantListDto>> GetTenantsPaginatedAsync(int page, int pageSize, string? searchTerm = null)
        {
            return await _tenantRepository.GetPaginatedAsync(page, pageSize, searchTerm, includeInactive: false);
        }

        public async Task<TenantDto> CreateTenantAsync(CreateTenantDto createDto, Guid operatorId)
        {
            // Validation
            if (string.IsNullOrWhiteSpace(createDto.Name))
                throw new ArgumentException("Tenant name is required");

            if (string.IsNullOrWhiteSpace(createDto.Slug))
                throw new ArgumentException("Tenant slug is required");

            // Ensure slug is unique
            var existingSlug = await _tenantRepository.GetBySlugAsync(createDto.Slug);
            if (existingSlug != null)
                throw new ArgumentException($"Slug '{createDto.Slug}' already exists");

            // Create tenant
            var tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Name = createDto.Name,
                Slug = createDto.Slug.ToLower(),
                LogoBase64 = createDto.LogoBase64,
                Plan = (int)createDto.Plan,
                MaxUsers = createDto.MaxUsers,
                MaxStorageGB = createDto.MaxStorageGB,
                MaxWorkspaces = createDto.MaxWorkspaces,
                StripeCustomerId = createDto.StripeCustomerId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _tenantRepository.AddAsync(tenant);
            await _tenantRepository.SaveChangesAsync();

            // Log audit
            await _auditLogRepository.LogActionAsync(
                operatorId, 
                "CREATE", 
                nameof(Tenant), 
                tenant.Id.ToString(),
                oldValues: null,
                newValues: System.Text.Json.JsonSerializer.Serialize(createDto)
            );

            var dto = _mapper.Map<TenantDto>(tenant);
            dto.UserCount = 0;
            dto.WorkspaceCount = 0;
            dto.StorageUsedGB = 0;

            return dto;
        }

        public async Task<TenantDto> UpdateTenantAsync(Guid tenantId, UpdateTenantDto updateDto, Guid operatorId)
        {
            var tenant = await _tenantRepository.GetByIdAsync(tenantId);
            if (tenant == null)
                throw new KeyNotFoundException($"Tenant '{tenantId}' not found");

            // Store old values for audit
            var oldValues = System.Text.Json.JsonSerializer.Serialize(new
            {
                tenant.Name,
                tenant.Plan,
                tenant.MaxUsers,
                tenant.MaxStorageGB,
                tenant.MaxWorkspaces,
                tenant.IsActive
            });

            // Update
            if (!string.IsNullOrWhiteSpace(updateDto.Name))
                tenant.Name = updateDto.Name;

            if (updateDto.Plan.HasValue)
                tenant.Plan = (int)updateDto.Plan.Value;

            if (updateDto.MaxUsers.HasValue)
                tenant.MaxUsers = updateDto.MaxUsers.Value;

            if (updateDto.MaxStorageGB.HasValue)
                tenant.MaxStorageGB = updateDto.MaxStorageGB.Value;

            if (updateDto.MaxWorkspaces.HasValue)
                tenant.MaxWorkspaces = updateDto.MaxWorkspaces.Value;

            if (updateDto.IsActive.HasValue)
                tenant.IsActive = updateDto.IsActive.Value;

            if (!string.IsNullOrWhiteSpace(updateDto.LogoBase64))
                tenant.LogoBase64 = updateDto.LogoBase64;

            await _tenantRepository.UpdateAsync(tenant);
            await _tenantRepository.SaveChangesAsync();

            // Log audit
            await _auditLogRepository.LogActionAsync(
                operatorId,
                "UPDATE",
                nameof(Tenant),
                tenantId.ToString(),
                oldValues: oldValues,
                newValues: System.Text.Json.JsonSerializer.Serialize(new { tenant.Name, tenant.Plan, tenant.MaxUsers, tenant.MaxStorageGB, tenant.MaxWorkspaces, tenant.IsActive })
            );

            return await GetByIdAsync(tenantId) ?? throw new InvalidOperationException("Failed to retrieve updated tenant");
        }

        public async Task DeleteTenantAsync(Guid tenantId, Guid operatorId)
        {
            var tenant = await _tenantRepository.GetByIdAsync(tenantId);
            if (tenant == null)
                throw new KeyNotFoundException($"Tenant '{tenantId}' not found");

            // Soft delete
            await _tenantRepository.DeleteAsync(tenantId, hardDelete: false);
            await _tenantRepository.SaveChangesAsync();

            // Log audit
            await _auditLogRepository.LogActionAsync(
                operatorId,
                "DELETE",
                nameof(Tenant),
                tenantId.ToString(),
                oldValues: System.Text.Json.JsonSerializer.Serialize(new { tenant.Name, tenant.IsActive }),
                newValues: null
            );
        }

        public async Task AddSubscriptionAsync(Guid tenantId, CreateTenantSubscriptionDto subscriptionDto, Guid operatorId)
        {
            var tenant = await _tenantRepository.GetByIdAsync(tenantId);
            if (tenant == null)
                throw new KeyNotFoundException($"Tenant '{tenantId}' not found");

            var subscription = new TenantSubscription
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Plan = (int)subscriptionDto.Plan,
                StartDate = subscriptionDto.StartDate,
                EndDate = subscriptionDto.EndDate,
                MonthlyCostEuro = subscriptionDto.MonthlyCostEuro ?? 0,
                StripeSubscriptionId = subscriptionDto.StripeSubscriptionId,
                Status = 1, // Active
                AutoRenew = subscriptionDto.AutoRenew,
                RenewDate = subscriptionDto.EndDate.HasValue 
                    ? subscriptionDto.EndDate.Value.AddDays(-30) 
                    : (DateTime?)null
            };

            await _tenantRepository.AddSubscriptionAsync(subscription);
            await _tenantRepository.SaveChangesAsync();

            // Log audit
            await _auditLogRepository.LogActionAsync(
                operatorId,
                "CREATE_SUBSCRIPTION",
                nameof(TenantSubscription),
                subscription.Id.ToString(),
                oldValues: null,
                newValues: System.Text.Json.JsonSerializer.Serialize(subscriptionDto)
            );
        }

        public async Task<TenantSubscriptionDto?> GetActiveSubscriptionAsync(Guid tenantId)
        {
            var subscription = await _tenantRepository.GetActiveSubscriptionAsync(tenantId);
            if (subscription == null) return null;

            return new TenantSubscriptionDto
            {
                Id = subscription.Id,
                TenantId = subscription.TenantId,
                Plan = (TenantPlanEnum)subscription.Plan,
                StartDate = subscription.StartDate,
                EndDate = subscription.EndDate,
                MonthlyCostEuro = subscription.MonthlyCostEuro,
                StripeSubscriptionId = subscription.StripeSubscriptionId,
                Status = subscription.Status,
                AutoRenew = subscription.AutoRenew,
                RenewDate = subscription.RenewDate
            };
        }

        public async Task<TenantStatsDto> GetTenantStatsAsync(Guid tenantId)
        {
            var userCount = await _tenantRepository.GetUserCountAsync(tenantId);
            var workspaceCount = await _tenantRepository.GetWorkspaceCountAsync(tenantId);
            var storageUsedGB = await _tenantRepository.GetStorageUsedAsync(tenantId);
            var documentCount = await _tenantRepository.GetDocumentCountAsync(tenantId);
            var dossierCount = await _tenantRepository.GetDossierCountAsync(tenantId);
            var lastActivityDate = await _tenantRepository.GetLastActivityDateAsync(tenantId);

            var tenant = await _tenantRepository.GetByIdAsync(tenantId);
            if (tenant == null)
                throw new KeyNotFoundException($"Tenant '{tenantId}' not found");

            var storagePercentUsed = tenant.MaxStorageGB > 0
                ? (double)storageUsedGB / tenant.MaxStorageGB * 100
                : 0;

            return new TenantStatsDto
            {
                TenantId = tenantId,
                UserCount = userCount,
                WorkspaceCount = workspaceCount,
                StorageUsedGB = storageUsedGB,
                StorageAvailableGB = tenant.MaxStorageGB,
                StoragePercentUsed = storagePercentUsed,
                DocumentCount = documentCount,
                DossierCount = dossierCount,
                LastActivityDate = lastActivityDate ?? DateTime.UtcNow
            };
        }

        public async Task RecordUsageAsync(Guid tenantId, string feature, Dictionary<string, object>? metadata = null)
        {
            await _tenantRepository.RecordUsageEventAsync(tenantId, feature, metadata);
        }
    }
}
