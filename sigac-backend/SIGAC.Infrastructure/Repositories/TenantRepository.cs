using Microsoft.EntityFrameworkCore;
using SIGAC.Core.Entities;
using SIGAC.Core.Interfaces;
using SIGAC.Core.DTOs;
using SIGAC.Infrastructure.Data;
using System.Collections.Generic;
using System.Linq;

namespace SIGAC.Infrastructure.Repositories
{
    public class TenantRepository : ITenantRepository
    {
        private readonly ApplicationDbContext _context;

        public TenantRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Tenant?> GetByIdAsync(Guid tenantId)
        {
            return await _context.Tenants
                .Include(t => t.Workspaces)
                .FirstOrDefaultAsync(t => t.Id == tenantId);
        }

        public async Task<Tenant?> GetBySlugAsync(string slug)
        {
            return await _context.Tenants
                .Include(t => t.Workspaces)
                .FirstOrDefaultAsync(t => t.Slug == slug);
        }

        public async Task<List<Tenant>> GetAllAsync(bool includeInactive = false)
        {
            IQueryable<Tenant> query = _context.Tenants
                .Include(t => t.Workspaces);
            
            if (!includeInactive)
                query = query.Where(t => t.IsActive && t.DeletedAt == null);

            return await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        }

        public async Task<PaginatedResult<TenantListDto>> GetPaginatedAsync(int page, int pageSize, string? searchTerm = null, bool includeInactive = false)
        {
            var query = _context.Tenants
                .Include(t => t.Workspaces)
                .Include(t => t.Users);

            // Filter
            IQueryable<Tenant> filteredQuery = query;
            if (!includeInactive)
                filteredQuery = filteredQuery.Where(t => t.IsActive && t.DeletedAt == null);

            if (!string.IsNullOrWhiteSpace(searchTerm))
                filteredQuery = filteredQuery.Where(t => t.Name.Contains(searchTerm) || t.Slug.Contains(searchTerm));

            // Count total
            var totalItems = await filteredQuery.CountAsync();

            // Paginate & Map
            var tenants = await filteredQuery
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var dtos = tenants.Select(t => new TenantListDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                LogoBase64 = t.LogoBase64,
                Plan = (TenantPlanEnum)t.Plan,
                IsActive = t.IsActive,
                CreatedAt = t.CreatedAt,
                UserCount = t.Users?.Count ?? 0,
                WorkspaceCount = t.Workspaces?.Count ?? 0
            }).ToList();

            return new PaginatedResult<TenantListDto>
            {
                Data = dtos,
                Pagination = new PaginationMetadata
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalItems = totalItems,
                    TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
                }
            };
        }

        public async Task<int> GetUserCountAsync(Guid tenantId)
        {
            return await _context.TenantUsers
                .Where(tu => tu.TenantId == tenantId && tu.IsActive)
                .CountAsync();
        }

        public async Task<int> GetWorkspaceCountAsync(Guid tenantId)
        {
            return await _context.Workspaces
                .Where(w => w.TenantId == tenantId && w.IsActive)
                .CountAsync();
        }

        public async Task<long> GetStorageUsedAsync(Guid tenantId)
        {
            return await _context.Documents
                .Where(d => d.Dossier.Workspace.TenantId == tenantId)
                .SumAsync(d => d.TailleFichier);
        }

        public async Task<int> GetDocumentCountAsync(Guid tenantId)
        {
            return await _context.Documents
                .Where(d => d.Dossier.Workspace.TenantId == tenantId)
                .CountAsync();
        }

        public async Task<int> GetDossierCountAsync(Guid tenantId)
        {
            return await _context.Dossiers
                .Where(d => d.Workspace.TenantId == tenantId)
                .CountAsync();
        }

        public async Task<DateTime?> GetLastActivityDateAsync(Guid tenantId)
        {
            return await _context.AuditLogs
                .Where(a => a.TenantId == tenantId)
                .OrderByDescending(a => a.Timestamp)
                .Select(a => a.Timestamp)
                .FirstOrDefaultAsync();
        }

        public async Task<TenantSubscription?> GetActiveSubscriptionAsync(Guid tenantId)
        {
            return await _context.TenantSubscriptions
                .Where(ts => ts.TenantId == tenantId && ts.Status == 1 && ts.EndDate == null)
                .OrderByDescending(ts => ts.StartDate)
                .FirstOrDefaultAsync();
        }

        public async Task<List<TenantSubscription>> GetSubscriptionHistoryAsync(Guid tenantId)
        {
            return await _context.TenantSubscriptions
                .Where(ts => ts.TenantId == tenantId)
                .OrderByDescending(ts => ts.StartDate)
                .ToListAsync();
        }

        public async Task<List<TenantUsageEvent>> GetUsageEventsAsync(Guid tenantId, string? feature = null, int days = 30)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-days);
            var query = _context.TenantUsageEvents
                .Where(tue => tue.TenantId == tenantId && tue.EventDate >= cutoffDate);

            if (!string.IsNullOrWhiteSpace(feature))
                query = query.Where(tue => tue.Feature == feature);

            return await query
                .OrderByDescending(tue => tue.EventDate)
                .ToListAsync();
        }

        public async Task RecordUsageEventAsync(Guid tenantId, string feature, Dictionary<string, object>? metadata = null, int count = 1)
        {
            var usageEvent = new TenantUsageEvent
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Feature = feature,
                Metadata = metadata != null ? System.Text.Json.JsonSerializer.Serialize(metadata) : null,
                Count = count,
                EventDate = DateTime.UtcNow
            };

            await _context.TenantUsageEvents.AddAsync(usageEvent);
            await SaveChangesAsync();
        }

        public async Task AddAsync(Tenant entity)
        {
            entity.CreatedAt = DateTime.UtcNow;
            await _context.Tenants.AddAsync(entity);
        }

        public async Task UpdateAsync(Tenant entity)
        {
            var existing = await _context.Tenants.FindAsync(entity.Id);
            if (existing != null)
            {
                _context.Entry(existing).CurrentValues.SetValues(entity);
            }
        }

        public async Task DeleteAsync(Guid tenantId, bool hardDelete = false)
        {
            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant == null) return;

            if (hardDelete)
            {
                _context.Tenants.Remove(tenant);
            }
            else
            {
                tenant.DeletedAt = DateTime.UtcNow;
                tenant.IsActive = false;
            }
        }

        public async Task AddSubscriptionAsync(TenantSubscription subscription)
        {
            subscription.Id = Guid.NewGuid();
            await _context.TenantSubscriptions.AddAsync(subscription);
        }

        public async Task UpdateSubscriptionAsync(TenantSubscription subscription)
        {
            _context.TenantSubscriptions.Update(subscription);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
