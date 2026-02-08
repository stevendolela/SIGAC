using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SIGAC.Core.Interfaces;
using SIGAC.Core.DTOs;
using System.Security.Claims;

namespace SIGAC.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TenantsController : ControllerBase
    {
        private readonly ITenantService _tenantService;
        private readonly ILogger<TenantsController> _logger;

        public TenantsController(ITenantService tenantService, ILogger<TenantsController> logger)
        {
            _tenantService = tenantService;
            _logger = logger;
        }

        /// <summary>
        /// Get all tenants (paginated)
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<PaginatedResult<TenantListDto>>> GetTenants(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var result = await _tenantService.GetTenantsPaginatedAsync(page, pageSize, searchTerm);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching tenants");
                return StatusCode(500, new { message = "Error fetching tenants", error = ex.Message });
            }
        }

        /// <summary>
        /// Get tenant by ID
        /// </summary>
        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<TenantDto>> GetTenantById(Guid id)
        {
            try
            {
                var tenant = await _tenantService.GetByIdAsync(id);
                if (tenant == null)
                    return NotFound(new { message = $"Tenant '{id}' not found" });

                return Ok(tenant);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching tenant {tenantId}", id);
                return StatusCode(500, new { message = "Error fetching tenant", error = ex.Message });
            }
        }

        /// <summary>
        /// Get tenant by slug
        /// </summary>
        [HttpGet("slug/{slug}")]
        [AllowAnonymous]
        public async Task<ActionResult<TenantDto>> GetTenantBySlug(string slug)
        {
            try
            {
                var tenant = await _tenantService.GetBySlugAsync(slug);
                if (tenant == null)
                    return NotFound(new { message = $"Tenant with slug '{slug}' not found" });

                return Ok(tenant);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching tenant by slug {slug}", slug);
                return StatusCode(500, new { message = "Error fetching tenant", error = ex.Message });
            }
        }

        /// <summary>
        /// Create new tenant (Admin only)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<TenantDto>> CreateTenant([FromBody] CreateTenantDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var operatorId))
                    return Unauthorized(new { message = "Invalid user context" });

                var tenant = await _tenantService.CreateTenantAsync(createDto, operatorId);
                return CreatedAtAction(nameof(GetTenantById), new { id = tenant.Id }, tenant);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating tenant");
                return StatusCode(500, new { message = "Error creating tenant", error = ex.Message });
            }
        }

        /// <summary>
        /// Update tenant (Admin only)
        /// </summary>
        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<TenantDto>> UpdateTenant(Guid id, [FromBody] UpdateTenantDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var operatorId))
                    return Unauthorized(new { message = "Invalid user context" });

                var tenant = await _tenantService.UpdateTenantAsync(id, updateDto, operatorId);
                return Ok(tenant);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating tenant {tenantId}", id);
                return StatusCode(500, new { message = "Error updating tenant", error = ex.Message });
            }
        }

        /// <summary>
        /// Delete tenant (soft delete, Admin only)
        /// </summary>
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTenant(Guid id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var operatorId))
                    return Unauthorized(new { message = "Invalid user context" });

                await _tenantService.DeleteTenantAsync(id, operatorId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting tenant {tenantId}", id);
                return StatusCode(500, new { message = "Error deleting tenant", error = ex.Message });
            }
        }

        /// <summary>
        /// Get tenant statistics
        /// </summary>
        [HttpGet("{id:guid}/stats")]
        [AllowAnonymous]
        public async Task<ActionResult<TenantStatsDto>> GetTenantStats(Guid id)
        {
            try
            {
                var stats = await _tenantService.GetTenantStatsAsync(id);
                return Ok(stats);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching tenant stats {tenantId}", id);
                return StatusCode(500, new { message = "Error fetching statistics", error = ex.Message });
            }
        }

        /// <summary>
        /// Add subscription to tenant (Admin only)
        /// </summary>
        [HttpPost("{id:guid}/subscriptions")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> AddSubscription(Guid id, [FromBody] CreateTenantSubscriptionDto subscriptionDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var operatorId))
                    return Unauthorized(new { message = "Invalid user context" });

                await _tenantService.AddSubscriptionAsync(id, subscriptionDto, operatorId);
                return CreatedAtAction(nameof(GetTenantById), new { id }, null);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding subscription to tenant {tenantId}", id);
                return StatusCode(500, new { message = "Error adding subscription", error = ex.Message });
            }
        }

        /// <summary>
        /// Get active subscription for tenant
        /// </summary>
        [HttpGet("{id:guid}/subscriptions/active")]
        [AllowAnonymous]
        public async Task<ActionResult<TenantSubscriptionDto>> GetActiveSubscription(Guid id)
        {
            try
            {
                var subscription = await _tenantService.GetActiveSubscriptionAsync(id);
                if (subscription == null)
                    return NotFound(new { message = "No active subscription found" });

                return Ok(subscription);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching active subscription {tenantId}", id);
                return StatusCode(500, new { message = "Error fetching subscription", error = ex.Message });
            }
        }
    }
}
