# 🌐 SIGAC Multi-Tenant SaaS - Architecture Complète (Mix Optimal)

**Version**: 1.0 - Architecture Finale  
**Date**: 8 février 2026  
**Objectif**: Plateforme SaaS avec hiérarchie Tenant → Workspace (Département)

---

## 📐 Architecture Globale (Vue d'Ensemble)

```
╔════════════════════════════════════════════════════════════════════╗
║                     SIGAC SAAS PLATFORM (Public)                   ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  TENANT 1 (Client: Cour RDC)          TENANT 2 (Client: Avocat)  ║
║  ┌─────────────────────────────┐      ┌──────────────────────┐  ║
║  │ WORKSPACE A (Juridique)     │      │ WORKSPACE (Cabinet)  │  ║
║  │ ├─ 15 users                 │      │ ├─ 5 users           │  ║
║  │ ├─ Dossiers constitutionnels│      │ ├─ Dossiers clients  │  ║
║  │ └─ Documents                │      │ └─ Documents         │  ║
║  │                             │      │                      │  ║
║  │ WORKSPACE B (Contentieux)   │      └──────────────────────┘  ║
║  │ ├─ 10 users                 │                                 ║
║  │ └─ Dossiers contentieux     │      TENANT N (...)            ║
║  │                             │      ┌──────────────────────┐  ║
║  │ WORKSPACE C (Admin)         │      │ ...                  │  ║
║  │ └─ 5 users                  │      │                      │  ║
║  └─────────────────────────────┘      └──────────────────────┘  ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
                              ↑
                    API Gateway (Load balance)
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND SERVICES (Farm d'instances)                 │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│ │ Instance 1   │ │ Instance 2   │ │ Instance N   │ (Load Balanced)
│ │ (Render #1)  │ │ (Render #2)  │ │ (Render #N)  │              │
│ └──────────────┘ └──────────────┘ └──────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              ↑
            ┌─────────────────┴─────────────────┐
            ↓                                   ↓
   ┌─────────────────┐            ┌────────────────────┐
   │ PostgreSQL      │            │ Redis Cache        │
   │ (Prod DB)       │            │ (Sessions/Cache)   │
   │ Schema-Per      │            │                    │
   │ -Tenant         │            └────────────────────┘
   └─────────────────┘
            ↑
   Backup nightly
   (Auto-restore)

╔════════════════════════════════════════════════════════════════════╗
║           ADMIN META-TENANT (Système - Accès Restreint)            ║
╠════════════════════════════════════════════════════════════════════╣
║  Dashboard Admin (https://admin.taajii.fr)                        ║
║  ├─ 📊 Monitoring tous les tenants (CPU, Memory, DB)             ║
║  ├─ 💳 Gestion subscriptions & facturation (Stripe)              ║
║  ├─ 👥 Provision/Déprovision tenants                             ║
║  ├─ 📈 Analytics & usage metrics                                 ║
║  └─ 🔐 Security & audit logs (cross-tenant)                      ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 🗄️ Modèle de Données Complet

### LEVEL 1: TENANT (Client SaaS)

```csharp
// SIGAC.Core/Entities/Tenant.cs
public class Tenant
{
    public Guid Id { get; set; }
    public string Name { get; set; }                        // "Cour Constitutionnelle RDC"
    public string Slug { get; set; }                        // URL: app.taajii.fr?tenant=cour-rdc
    public string LogoBase64 { get; set; }
    public string ContactEmail { get; set; }
    public string ContactPhone { get; set; }
    
    // Quotas & Limits
    public int MaxUsers { get; set; }
    public long MaxStorageGB { get; set; }
    public int MaxWorkspaces { get; set; }
    
    // Plan & Subscription
    public TenantPlanEnum Plan { get; set; }                // Starter, Pro, Enterprise
    public DateTime SubscriptionStartDate { get; set; }
    public DateTime? SubscriptionEndDate { get; set; }
    public string StripeCustomerId { get; set; }
    public string StripeSubscriptionId { get; set; }
    
    // Status
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }                // Soft delete
    
    // Relations
    public ICollection<Workspace> Workspaces { get; set; }
    public ICollection<TenantUser> Users { get; set; }
    public ICollection<TenantSubscription> Subscriptions { get; set; }
    public ICollection<TenantUsageEvent> UsageEvents { get; set; }
    public ICollection<AuditLog> AuditLogs { get; set; }
}

// Enum
public enum TenantPlanEnum
{
    Starter = 0,      // €99/mois, 10 users, 5GB storage
    Pro = 1,          // €299/mois, 50 users, 100GB storage
    Enterprise = 2    // Custom
}
```

### LEVEL 2: WORKSPACE (Département/Division)

```csharp
// SIGAC.Core/Entities/Workspace.cs (Adapté)
public class Workspace
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }                      // ← NOUVEAU: Référence Tenant
    public string Name { get; set; }                        // "Département Juridique"
    public string Description { get; set; }
    public string IconColor { get; set; }                   // Pour UI
    
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Relations
    public Tenant Tenant { get; set; }
    public ICollection<WorkspaceUser> Members { get; set; }
    public ICollection<Dossier> Dossiers { get; set; }
    public ICollection<Document> Documents { get; set; }
    public ICollection<ChatConversation> ChatConversations { get; set; }
}
```

### LEVEL 3: IDENTITY & ACCESS (Hiérarchie Utilisateurs)

```csharp
// SIGAC.Core/Entities/TenantUser.cs (NOUVEAU)
public class TenantUser
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Email { get; set; }
    public string FullName { get; set; }
    public string PasswordHash { get; set; }
    public string? PhoneNumber { get; set; }
    
    // Tenant-Level Role
    public TenantRoleEnum Role { get; set; }               // Admin, Manager, Member
    
    // Status
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    
    // JWT
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    
    // Relations
    public Tenant Tenant { get; set; }
    public ICollection<WorkspaceUser> WorkspaceAssignments { get; set; }  // Assignations aux depts
    public ICollection<AuditLog> AuditLogs { get; set; }
}

public enum TenantRoleEnum
{
    Admin = 0,        // Tous les droits au tenant
    Manager = 1,      // Gestion workspaces & users
    Member = 2        // Accès selon workspace assignment
}

// SIGAC.Core/Entities/WorkspaceUser.cs (Adapter)
public class WorkspaceUser
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }                   // Department/Division assignment
    public Guid TenantUserId { get; set; }                  // ← Référence TenantUser
    public WorkspaceRoleEnum Role { get; set; }            // Admin, Collaborator, Assistant, Consultant
    
    public DateTime AssignedAt { get; set; }
    
    // Relations
    public Workspace Workspace { get; set; }
    public TenantUser TenantUser { get; set; }
}

public enum WorkspaceRoleEnum
{
    Admin = 0,
    Manager = 1,
    Collaborator = 2,
    Assistant = 3,
    AssistantJunior = 4,
    Consultant = 5          // Lecture seule
}
```

### LEVEL 4: MONETIZATION & METRICS

```csharp
// SIGAC.Core/Entities/TenantSubscription.cs
public class TenantSubscription
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public TenantPlanEnum Plan { get; set; }
    
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    
    public decimal MonthlyCostEuro { get; set; }
    public string StripeSubscriptionId { get; set; }
    public SubscriptionStatusEnum Status { get; set; }     // Active, Paused, Canceled
    
    // Auto-renewal
    public bool AutoRenew { get; set; }
    public DateTime? RenewDate { get; set; }
    
    public Tenant Tenant { get; set; }
}

public enum SubscriptionStatusEnum
{
    Active = 0,
    PastDue = 1,
    Paused = 2,
    Canceled = 3
}

// SIGAC.Core/Entities/TenantUsageEvent.cs
public class TenantUsageEvent
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Feature { get; set; }                     // "Dossier.Created", "Document.Upload"
    public string Metadata { get; set; }                    // JSON custom data
    public int Count { get; set; }
    public DateTime EventDate { get; set; }
    
    public Tenant Tenant { get; set; }
}

// SIGAC.Core/Entities/AuditLog.cs (Adapter pour Cross-Tenant)
public class AuditLog
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }                      // ← Pour audit cross-tenant
    public Guid? UserId { get; set; }
    public string Action { get; set; }                      // "CREATE", "UPDATE", "DELETE"
    public string EntityType { get; set; }                  // "Dossier", "User"
    public string EntityId { get; set; }
    public string? OldValues { get; set; }                  // JSON
    public string? NewValues { get; set; }                  // JSON
    public string IpAddress { get; set; }
    public string UserAgent { get; set; }
    public DateTime Timestamp { get; set; }
    
    public Tenant Tenant { get; set; }
    public TenantUser? User { get; set; }
}
```

---

## 🏗️ Architecture des Services (3 Couches)

### Couche 1: Services Métier Tenant-Aware

```csharp
// SIGAC.Core/Services/TenantService.cs
public class TenantService : ITenantService
{
    private readonly ITenantRepository _tenantRepository;
    private readonly IStripeService _stripeService;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IMapper _mapper;
    
    // Provision d'un nouveau tenant
    public async Task<TenantDto> ProvisionTenantAsync(ProvisionTenantDto dto, Guid adminUserId)
    {
        ValidateTenant(dto);
        
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Slug = GenerateSlug(dto.Name),
            Plan = TenantPlanEnum.Starter,
            MaxUsers = 10,
            MaxStorageGB = 5,
            ContactEmail = dto.ContactEmail,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        
        // Créer compte Stripe
        var stripeCustomer = await _stripeService.CreateCustomerAsync(
            tenant.Name, 
            dto.ContactEmail
        );
        tenant.StripeCustomerId = stripeCustomer.Id;
        
        await _tenantRepository.AddAsync(tenant);
        
        // Créer workspace par défaut
        var defaultWorkspace = new Workspace
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Name = "Département Par Défaut",
            IsActive = true
        };
        await _workspaceRepository.AddAsync(defaultWorkspace);
        
        // Créer admin user du tenant
        var adminPassword = GenerateSecurePassword();
        var tenantAdmin = new TenantUser
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = dto.AdminEmail,
            FullName = dto.AdminName,
            PasswordHash = BcryptHash(adminPassword),
            Role = TenantRoleEnum.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        await _tenantUserRepository.AddAsync(tenantAdmin);
        
        // Assign au workspace par défaut
        await _workspaceUserRepository.AddAsync(new WorkspaceUser
        {
            WorkspaceId = defaultWorkspace.Id,
            TenantUserId = tenantAdmin.Id,
            Role = WorkspaceRoleEnum.Admin,
            AssignedAt = DateTime.UtcNow
        });
        
        // Audit log
        await _auditLogRepository.LogActionAsync(
            tenant.Id,
            adminUserId,
            "CREATE_TENANT",
            "Tenant",
            tenant.Id.ToString(),
            null,
            JsonConvert.SerializeObject(tenant)
        );
        
        return _mapper.Map<TenantDto>(tenant);
    }
    
    // Upgrade plan
    public async Task<TenantDto> UpgradePlanAsync(Guid tenantId, TenantPlanEnum newPlan, Guid adminUserId)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant == null) throw new KeyNotFoundException();
        
        var oldPlan = tenant.Plan;
        tenant.Plan = newPlan;
        
        // Mettre à jour quotas
        var planConfig = GetPlanConfig(newPlan);
        tenant.MaxUsers = planConfig.MaxUsers;
        tenant.MaxStorageGB = planConfig.MaxStorageGB;
        
        // Mettre à jour en Stripe
        if (!string.IsNullOrEmpty(tenant.StripeSubscriptionId))
        {
            await _stripeService.UpdateSubscriptionAsync(
                tenant.StripeSubscriptionId,
                newPlan.ToString()
            );
        }
        
        await _tenantRepository.UpdateAsync(tenant);
        
        // Audit
        await _auditLogRepository.LogActionAsync(
            tenantId,
            adminUserId,
            "UPGRADE_PLAN",
            "Tenant",
            tenantId.ToString(),
            JsonConvert.SerializeObject(new { Plan = oldPlan }),
            JsonConvert.SerializeObject(new { Plan = newPlan })
        );
        
        return _mapper.Map<TenantDto>(tenant);
    }
}

// SIGAC.Core/Services/DossierService.cs (Adapté)
public class DossierService : IDossierService
{
    // Signature modifiée: extraction TenantId obligatoire
    public async Task<PaginatedResult<DossierListDto>> GetDossiersAsync(
        Guid tenantId,
        Guid workspaceId,
        int page, int pageSize,
        Guid userId,
        TenantRoleEnum userRole,
        DossierFilters? filters = null
    )
    {
        // 1. Vérifier l'accès du user au tenant/workspace
        var tenantUser = await _tenantUserRepository.GetByIdAsync(userId);
        if (tenantUser?.TenantId != tenantId)
            throw new UnauthorizedAccessException("Tenant access denied");
            
        var workspaceUser = await _workspaceUserRepository.GetAsync(
            wu => wu.TenantUserId == userId && wu.WorkspaceId == workspaceId
        );
        if (workspaceUser == null && userRole != TenantRoleEnum.Admin)
            throw new UnauthorizedAccessException("Workspace access denied");
        
        // 2. Appliquer les filtres
        var query = _dossierRepository.Query()
            .Where(d => d.Workspace.TenantId == tenantId)  // ← Isolation Tenant
            .Where(d => d.WorkspaceId == workspaceId);      // ← Filtre Workspace
        
        // Collaborator: voir seulement leurs propres dossiers
        if (userRole == TenantRoleEnum.Member)
        {
            query = query.Where(d => d.RapporteurId == userId);
        }
        
        // Appliquer autres filtres
        if (filters != null)
        {
            if (filters.Status.HasValue)
                query = query.Where(d => d.Status == filters.Status);
            if (!string.IsNullOrEmpty(filters.Search))
                query = query.Where(d => d.Titre.Contains(filters.Search) || 
                                        d.NumeroDossier.Contains(filters.Search));
        }
        
        // 3. Paginer
        var totalItems = await query.CountAsync();
        var dossiers = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        
        return new PaginatedResult<DossierListDto>
        {
            Data = _mapper.Map<List<DossierListDto>>(dossiers),
            PaginationMetadata = new PaginationMetadata
            {
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling((double)totalItems / pageSize)
            }
        };
    }
}
```

### Couche 2: Admin Services (Gestion Multi-Tenant)

```csharp
// SIGAC.Core/Services/AdminDashboardService.cs (NOUVEAU)
public class AdminDashboardService : IAdminDashboardService
{
    private readonly ITenantRepository _tenantRepository;
    private readonly IStripeService _stripeService;
    
    // Métriques agrégées tous tenants
    public async Task<AdminDashboardMetricsDto> GetMetricsAsync()
    {
        var tenants = await _tenantRepository.GetAllAsync();
        var metrics = new AdminDashboardMetricsDto
        {
            TotalTenants = tenants.Count,
            ActiveTenants = tenants.Count(t => t.IsActive),
            TotalUsers = tenants.Sum(t => t.Users.Count),
            TotalStorage = tenants.Sum(t => t.UsageEvents
                .Where(e => e.Feature == "Document.Upload")
                .Sum(e => e.Count)),  // Approximatif
            MonthlyRecurringRevenue = CalculateMRR(tenants),
            TenantsByPlan = tenants.GroupBy(t => t.Plan)
                .Select(g => new PlanMetricDto
                {
                    Plan = g.Key.ToString(),
                    Count = g.Count(),
                    Revenue = g.Sum(t => GetPlanPrice(t.Plan))
                })
                .ToList()
        };
        return metrics;
    }
    
    // Dashboard par tenant
    public async Task<TenantDashboardDto> GetTenantMetricsAsync(Guid tenantId)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant == null) throw new KeyNotFoundException();
        
        var subscription = await _stripeService.GetSubscriptionAsync(tenant.StripeSubscriptionId);
        var usageEvents = await _tenantUsageRepository.GetAsync(t => t.TenantId == tenantId);
        
        return new TenantDashboardDto
        {
            Name = tenant.Name,
            Plan = tenant.Plan.ToString(),
            Status = subscription?.Status ?? "Unknown",
            Users = tenant.Users.Count,
            MaxUsers = tenant.MaxUsers,
            StorageUsedGB = CalculateStorageUsage(usageEvents),
            MaxStorageGB = tenant.MaxStorageGB,
            SubscriptionEndDate = tenant.SubscriptionEndDate,
            MonthlyCost = GetPlanPrice(tenant.Plan),
            LastActivity = usageEvents.Max(e => e.EventDate) ?? tenant.CreatedAt
        };
    }
    
    // Health check cross-tenant
    public async Task<List<TenantHealthDto>> GetHealthCheckAsync()
    {
        var tenants = await _tenantRepository.GetAllAsync();
        var healthMetrics = new List<TenantHealthDto>();
        
        foreach (var tenant in tenants.Where(t => t.IsActive))
        {
            var recentErrors = await _auditLogRepository.GetAsync(
                a => a.TenantId == tenant.Id && 
                     a.Action.Contains("ERROR") &&
                     a.Timestamp > DateTime.UtcNow.AddHours(-24)
            );
            
            healthMetrics.Add(new TenantHealthDto
            {
                TenantId = tenant.Id,
                Name = tenant.Name,
                Status = recentErrors.Any() ? "WARNING" : "HEALTHY",
                LastCheckAt = DateTime.UtcNow,
                ErrorCount24H = recentErrors.Count
            });
        }
        
        return healthMetrics;
    }
}
```

### Couche 3: API Controllers

```csharp
// SIGAC.API/Controllers/DossiersController.cs (Adapté)
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DossiersController : ControllerBase
{
    private readonly IDossierService _dossierService;
    
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<DossierListDto>>> GetDossiers(
        [FromQuery] Guid tenantId,
        [FromQuery] Guid workspaceId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null
    )
    {
        // Extraire userId et role du JWT
        var userId = User.FindFirst(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirst("role");  // TenantRoleEnum
        
        if (userId == null || userRole == null)
            return Unauthorized();
        
        var filters = new DossierFilters { Search = search };
        
        var result = await _dossierService.GetDossiersAsync(
            tenantId,
            workspaceId,
            page, pageSize,
            Guid.Parse(userId.Value),
            Enum.Parse<TenantRoleEnum>(userRole.Value),
            filters
        );
        
        return Ok(result);
    }
}

// SIGAC.API/Controllers/Admin/TenantsController.cs (NOUVEAU)
[ApiController]
[Route("api/admin/tenants")]
[Authorize(Roles = "Admin")]  // Système admin only
public class AdminTenantsController : ControllerBase
{
    private readonly ITenantService _tenantService;
    private readonly IAdminDashboardService _adminDasboardService;
    
    // Provision tenant
    [HttpPost]
    public async Task<ActionResult<TenantDto>> ProvisionTenant([FromBody] ProvisionTenantDto dto)
    {
        var adminUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        var result = await _tenantService.ProvisionTenantAsync(dto, adminUserId);
        return CreatedAtAction(nameof(GetTenant), new { id = result.Id }, result);
    }
    
    // Liste tenants
    [HttpGet]
    public async Task<ActionResult<List<TenantListDto>>> ListTenants()
    {
        var result = await _tenantService.GetAllTenantsAsync();
        return Ok(result);
    }
    
    // Details tenant
    [HttpGet("{id}")]
    public async Task<ActionResult<TenantDto>> GetTenant(Guid id)
    {
        var result = await _tenantService.GetTenantAsync(id);
        return Ok(result);
    }
    
    // Upgrade plan
    [HttpPut("{id}/plan")]
    public async Task<ActionResult<TenantDto>> UpgradePlan(Guid id, [FromBody] UpgradePlanDto dto)
    {
        var adminUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        var result = await _tenantService.UpgradePlanAsync(id, dto.Plan, adminUserId);
        return Ok(result);
    }
    
    // Dashboard admin
    [HttpGet("dashboard/metrics")]
    public async Task<ActionResult<AdminDashboardMetricsDto>> GetMetrics()
    {
        var result = await _adminDasboardService.GetMetricsAsync();
        return Ok(result);
    }
    
    // Health check
    [HttpGet("health")]
    public async Task<ActionResult<List<TenantHealthDto>>> HealthCheck()
    {
        var result = await _adminDasboardService.GetHealthCheckAsync();
        return Ok(result);
    }
}
```

---

## 🌐 Frontend Architecture

### App Structure

```typescript
// src/App.tsx
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Tenant App (Protected) */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route path="/" element={<TenantLayout />}>
            {/* Workspace Level */}
            <Route index element={<DashboardPage />} />
            <Route path="workspace/:workspaceId" element={<WorkspaceLayout />}>
              <Route path="dossiers" element={<DossiersPage />} />
              <Route path="dossiers/:dossierId" element={<DossierDetailPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="chat" element={<ChatPage />} />
            </Route>
            
            {/* Tenant Admin */}
            <Route path="admin" element={<AdminRoute />}>
              <Route path="workspaces" element={<WorkspacesManagementPage />} />
              <Route path="users" element={<UsersManagementPage />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="settings" element={<TenantSettingsPage />} />
            </Route>
          </Route>
        </Route>
        
        {/* Admin Meta-Tenant (Accès Restreint) */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route path="/" element={<AdminDashboardPage />} />
          <Route path="tenants" element={<TenantsManagementPage />} />
          <Route path="tenants/:tenantId" element={<TenantDetailPage />} />
          <Route path="metrics" element={<MetricsPage />} />
          <Route path="health" element={<HealthCheckPage />} />
          <Route path="billing" element={<BillingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### Context & Stores

```typescript
// src/store/tenantStore.ts (Zustand)
interface TenantState {
  currentTenant: Tenant | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  
  setCurrentTenant: (tenant: Tenant) => void;
  setCurrentWorkspace: (workspace: Workspace) => void;
  loadWorkspaces: (tenantId: Guid) => Promise<void>;
}

export const useTenantStore = create<TenantState>((set) => ({
  currentTenant: null,
  currentWorkspace: null,
  workspaces: [],
  
  setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  
  loadWorkspaces: async (tenantId) => {
    const response = await tenantApi.getWorkspaces(tenantId);
    set({ workspaces: response });
  }
}));

// src/store/authStore.ts (Zustand)
interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: TenantUser | null;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: null,
  
  login: async (email, password) => {
    const result = await authApi.login(email, password);
    localStorage.setItem('token', result.token);
    localStorage.setItem('refreshToken', result.refreshToken);
    set({ token: result.token, user: result.user });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({ token: null, user: null });
  },
  
  refreshAccessToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const result = await authApi.refresh(refreshToken!);
    localStorage.setItem('token', result.token);
    set({ token: result.token });
  }
}));
```

---

## 💳 Straité Monetization

### Plan Pricing Structure

```
┌─────────────────────────────────────────────────────────┐
│ PLAN PRICING STRATEGY                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ STARTER: €99/mois                                       │
│ ├─ 10 utilisateurs                                      │
│ ├─ 5 GB storage                                         │
│ ├─ 2 workspaces                                         │
│ ├─ Email support                                        │
│ └─ Modules: Core (Dossiers, Documents)                 │
│                                                         │
│ PRO: €399/mois (€348 annual)                            │
│ ├─ 50 utilisateurs                                      │
│ ├─ 100 GB storage                                       │
│ ├─ 10 workspaces                                        │
│ ├─ Priority email support                               │
│ ├─ API access                                           │
│ └─ Modules: Core + Chat + Calendar + VideoCall          │
│                                                         │
│ ENTERPRISE: Custom pricing                              │
│ ├─ Utilisateurs illimités                               │
│ ├─ Storage illimité                                     │
│ ├─ Workspaces illimités                                 │
│ ├─ Dedicated support + SLA 99.9%                        │
│ ├─ White-label option                                   │
│ ├─ Custom integrations                                  │
│ └─ Modules: All + Custom                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Facturation Flow

```
1. Provision Tenant
   → Create Stripe Customer
   
2. Select Plan
   → Create Stripe Subscription
   → Store StripeSubscriptionId in DB
   → Send confirmation email
   
3. Monthly Billing
   → Stripe webhooks → UpdateSubscriptionStatus
   → Track usage metrics
   → Alert if near limits
   
4. Upgrade/Downgrade
   → Call Stripe API
   → Update plan in DB
   → Proration handled by Stripe
   
5. Churn Prevention
   → Failed payment → Alert tenant admin
   → 3 attempts → Pause subscription
   → 7 days → Delete data (soft)
```

---

## 🔒 Sécurité & Isolation

### Multi-Tenant Data Isolation

```sql
-- Pattern sécurisé: TOUJOURS vérifier TenantId
SELECT d.* FROM Dossiers d
JOIN Workspaces w ON d.WorkspaceId = w.Id
WHERE w.TenantId = @tenantId        -- ← Isolation Tenant
  AND d.WorkspaceId = @workspaceId  -- ← Filtre Workspace
  AND EXISTS (
    SELECT 1 FROM TenantUsers tu
    JOIN WorkspaceUsers wu ON tu.Id = wu.TenantUserId
    WHERE tu.Id = @userId
      AND tu.TenantId = @tenantId
      AND wu.WorkspaceId = @workspaceId
  );
  
-- DANGER: Cette requête breacherait isolation!
-- SELECT d.* FROM Dossiers WHERE Id = @dossierId
-- (Toujours ajouter WHERE clause tenant!)
```

### Row-Level Security Policy (PostgreSQL)

```sql
-- Enable RLS
ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;

-- Policy: Current user can only see dossiers de son tenant/workspace
CREATE POLICY dossiers_isolation ON dossiers
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT wu.workspace_id 
      FROM workspace_users wu
      JOIN tenant_users tu ON wu.tenant_user_id = tu.id
      WHERE tu.id = current_user_id()
        AND tu.tenant_id = workspaces.tenant_id
    )
  );
```

### JWT Claims Structure

```json
{
  "sub": "user-id-guid",
  "email": "user@example.com",
  "tenant_id": "tenant-guid",
  "tenant_role": "Admin",      // TenantRoleEnum
  "workspaces": [              // List des workspaces accessibles
    {
      "workspace_id": "guid",
      "role": "Admin"           // WorkspaceRoleEnum
    },
    {
      "workspace_id": "guid",
      "role": "Collaborator"
    }
  ],
  "exp": 1707..."
}
```

---

## 🚀 Plan de Déploiement (Phases)

### Phase 1: Database Migration (1-2 semaines)

- [ ] Créer entités Tenant, TenantUser
- [ ] Créer migrations EF Core
- [ ] Adapter Workspace (ajouter TenantId)
- [ ] Adapter WorkspaceUser (ajouter TenantUserId)
- [ ] Seed data: migrer existing users/workspaces → Tenant "default"
- [ ] Tests d'isolation

### Phase 2: Backend Refactoring (2-3 semaines)

- [ ] Adapter tous les services (+ extraire tenantId, userId, userRole)
- [ ] Créer TenantService + AdminDashboardService
- [ ] Adapter tous les controllers
- [ ] Intégration Stripe (webhooks, subscriptions)
- [ ] Ajouter usage tracking
- [ ] Tests & validation

### Phase 3: Frontend Multi-Tenant (2 semaines)

- [ ] Créer TenantLayout + TenantSelector
- [ ] Adapter stores (tenantStore, authStore)
- [ ] Créer AdminDashboardPage
- [ ] Créer SubscriptionPage
- [ ] Affichage quotas usages
- [ ] Tests

### Phase 4: Admin Meta-Tenant (1-2 semaines)

- [ ] Créer AdminDashboardPage
- [ ] Créer TenantsManagementPage
- [ ] Créer MetricsPage
- [ ] Créer HealthCheckPage
- [ ] Intégration DataDog/Prometheus

### Phase 5: Production Deployment (1 semaine)

- [ ] Pre-prod testing
- [ ] Database backup strategy
- [ ] Monitoring setup
- [ ] Launch!

**Total: 7-10 semaines**

---

## 📊 Résumé: À Retenir

| Concept | Ancien | Nouveau |
|---------|--------|---------|
| **Tenant** | Workspace | Entité SaaS commerciale |
| **Workspace** | Tenant interne | Département/Division client |
| **User** | Global | `TenantUser` (niveau client) |
| **Role** | WorkspaceRole | Hiérarchie 2 niveaux (Tenant + Workspace) |
| **Isolation** | Workspace-based | Tenant-based (plus fort) |
| **Facturation** | N/A | Par Tenant (Stripe) |
| **Admin** | Admin local | Admin Meta-Tenant centralisé |

---

**Cette architecture est prête pour vendre SIGAC comme plateforme SaaS!** 🚀
