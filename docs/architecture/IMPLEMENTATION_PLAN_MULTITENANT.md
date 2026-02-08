# 🔧 Plan Implémentation: SIGAC Multi-Tenant SaaS

**Statut**: Plan d'exécution détaillé  
**Date de démarrage estimée**: Phase suivante  
**Durée totale**: 7-10 semaines

---

## 📋 PHASE 1: Database & Entities (Semaine 1-2)

### Étape 1.1: Créer les Entités Tenant

**Fichier**: `sigac-backend/SIGAC.Core/Entities/Tenant.cs`

```csharp
public class Tenant
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Slug { get; set; }
    public string? LogoBase64 { get; set; }
    public string ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    
    public int MaxUsers { get; set; } = 10;
    public long MaxStorageGB { get; set; } = 5;
    public int MaxWorkspaces { get; set; } = 2;
    
    public int Plan { get; set; } = (int)TenantPlanEnum.Starter;
    public DateTime SubscriptionStartDate { get; set; } = DateTime.UtcNow;
    public DateTime? SubscriptionEndDate { get; set; }
    
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }
    
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
    
    // Relations
    public ICollection<Workspace> Workspaces { get; set; } = new List<Workspace>();
    public ICollection<TenantUser> Users { get; set; } = new List<TenantUser>();
    public ICollection<TenantSubscription> Subscriptions { get; set; } = new List<TenantSubscription>();
    public ICollection<TenantUsageEvent> UsageEvents { get; set; } = new List<TenantUsageEvent>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}

public enum TenantPlanEnum
{
    Starter = 0,
    Pro = 1,
    Enterprise = 2
}
```

**Fichier**: `sigac-backend/SIGAC.Core/Entities/TenantUser.cs`

```csharp
public class TenantUser
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Email { get; set; }
    public string FullName { get; set; }
    public string PasswordHash { get; set; }
    public string? PhoneNumber { get; set; }
    
    public int Role { get; set; } = (int)TenantRoleEnum.Member;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    
    // Relations
    public Tenant Tenant { get; set; } = null!;
    public ICollection<WorkspaceUser> WorkspaceAssignments { get; set; } = new List<WorkspaceUser>();
    public ICollection<AuditLog> Actions { get; set; } = new List<AuditLog>();
}

public enum TenantRoleEnum
{
    Admin = 0,
    Manager = 1,
    Member = 2
}
```

**Fichier**: `sigac-backend/SIGAC.Core/Entities/TenantSubscription.cs`

```csharp
public class TenantSubscription
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public int Plan { get; set; }
    
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }
    
    public decimal MonthlyCostEuro { get; set; }
    public string? StripeSubscriptionId { get; set; }
    public int Status { get; set; } = (int)SubscriptionStatusEnum.Active;
    
    public bool AutoRenew { get; set; } = true;
    public DateTime? RenewDate { get; set; }
    
    // Relations
    public Tenant Tenant { get; set; } = null!;
}

public enum SubscriptionStatusEnum
{
    Active = 0,
    PastDue = 1,
    Paused = 2,
    Canceled = 3
}
```

**Fichier**: `sigac-backend/SIGAC.Core/Entities/TenantUsageEvent.cs`

```csharp
public class TenantUsageEvent
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Feature { get; set; }           // "Dossier.Created", "Document.Upload"
    public string? Metadata { get; set; }         // JSON
    public int Count { get; set; } = 1;
    public DateTime EventDate { get; set; } = DateTime.UtcNow;
    
    // Relations
    public Tenant Tenant { get; set; } = null!;
}
```

### Étape 1.2: Adapter les Entités Existantes

**Fichier**: `sigac-backend/SIGAC.Core/Entities/Workspace.cs` (Ajouter)

```csharp
public class Workspace
{
    // ... existing properties ...
    
    // AJOUTER:
    public Guid TenantId { get; set; }
    
    // AJOUTER relation:
    public Tenant Tenant { get; set; } = null!;
}
```

**Fichier**: `sigac-backend/SIGAC.Core/Entities/WorkspaceUser.cs` (Ajouter)

```csharp
public class WorkspaceUser
{
    // ... existing properties ...
    
    // REMPLACER User -> TenantUser:
    // AVANT:
    // public Guid UserId { get; set; }
    // public User User { get; set; }
    
    // APRÈS:
    public Guid TenantUserId { get; set; }
    public TenantUser TenantUser { get; set; } = null!;
}
```

### Étape 1.3: Créer Migration EF Core

```bash
cd sigac-backend

# Create migration
dotnet ef migrations add AddTenantMultiTenancy \
    --project SIGAC.Infrastructure \
    --startup-project SIGAC.API

# Review generated migration, then apply
dotnet ef database update \
    --project SIGAC.Infrastructure \
    --startup-project SIGAC.API
```

**Migration Preview**: Le fichier généré ressemblera à:

```csharp
public partial class AddTenantMultiTenancy : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Créer table Tenants
        migrationBuilder.CreateTable(
            name: "Tenants",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "text", nullable: false),
                // ... autres colonnes
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Tenants", x => x.Id);
            });
        
        // Ajouter TenantId à Workspaces
        migrationBuilder.AddColumn<Guid>(
            name: "TenantId",
            table: "Workspaces",
            type: "uuid",
            nullable: false,
            defaultValue: Guid.Empty);
        
        // Créer table TenantUsers
        migrationBuilder.CreateTable(
            name: "TenantUsers",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                // ... autres colonnes
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TenantUsers", x => x.Id);
                table.ForeignKey(
                    name: "FK_TenantUsers_Tenants_TenantId",
                    column: x => x.TenantId,
                    principalTable: "Tenants",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });
        
        // ... etc
    }
}
```

### Étape 1.4: Seed Data Migration

**Fichier**: `sigac-backend/SIGAC.Infrastructure/Data/DbInitializer.cs`

```csharp
public static async Task InitializeTenantData(ApplicationDbContext context)
{
    // Créer Tenant "Default" pour les données existantes
    var defaultTenant = new Tenant
    {
        Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
        Name = "Default Tenant (Cour Constitutionnelle RDC)",
        Slug = "cour-rdc",
        ContactEmail = "admin@example.com",
        MaxUsers = 50,
        MaxStorageGB = 100,
        Plan = (int)TenantPlanEnum.Enterprise,
        IsActive = true
    };
    
    if (!context.Tenants.Any(t => t.Id == defaultTenant.Id))
    {
        context.Tenants.Add(defaultTenant);
        await context.SaveChangesAsync();
    }
    
    // Migrer existing Workspaces → Tenant "Default"
    var orphanedWorkspaces = context.Workspaces.Where(w => w.TenantId == Guid.Empty);
    foreach (var ws in orphanedWorkspaces)
    {
        ws.TenantId = defaultTenant.Id;
    }
    
    // Migrer existing Users → TenantUsers (dans Tenant "Default")
    var existingUsers = context.Users.ToList();  // Si User existe encore
    foreach (var user in existingUsers)
    {
        var tenantUser = new TenantUser
        {
            Id = user.Id,  // ou générer nouveau Guid
            TenantId = defaultTenant.Id,
            Email = user.Email,
            FullName = user.FullName,
            PasswordHash = user.PasswordHash,
            IsActive = user.IsActive
        };
        context.TenantUsers.Add(tenantUser);
    }
    
    await context.SaveChangesAsync();
}
```

---

## 🎯 PHASE 2: Services & Business Logic (Semaine 3-4)

### Étape 2.1: Créer Service Tenant

**Fichier**: `sigac-backend/SIGAC.Core/Services/TenantService.cs`

```csharp
public interface ITenantService
{
    Task<TenantDto> ProvisionTenantAsync(ProvisionTenantDto dto, Guid adminUserId);
    Task<TenantDto> GetTenantAsync(Guid tenantId);
    Task<PaginatedResult<TenantListDto>> GetAllTenantsAsync(int page, int pageSize);
    Task<TenantDto> UpgradePlanAsync(Guid tenantId, TenantPlanEnum newPlan, Guid adminUserId);
}

public class TenantService : ITenantService
{
    private readonly ITenantRepository _tenantRepository;
    private readonly ITenantUserRepository _tenantUserRepository;
    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly IWorkspaceUserRepository _workspaceUserRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IMapper _mapper;
    // private readonly IStripeService _stripeService;  // À intégrer
    
    public TenantService(
        ITenantRepository tenantRepository,
        ITenantUserRepository tenantUserRepository,
        IWorkspaceRepository workspaceRepository,
        IWorkspaceUserRepository workspaceUserRepository,
        IAuditLogRepository auditLogRepository,
        IMapper mapper
    )
    {
        _tenantRepository = tenantRepository;
        _tenantUserRepository = tenantUserRepository;
        _workspaceRepository = workspaceRepository;
        _workspaceUserRepository = workspaceUserRepository;
        _auditLogRepository = auditLogRepository;
        _mapper = mapper;
    }
    
    public async Task<TenantDto> ProvisionTenantAsync(ProvisionTenantDto dto, Guid adminUserId)
    {
        // Validate
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Tenant name required");
        
        // Create Tenant
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Slug = GenerateSlug(dto.Name),
            ContactEmail = dto.ContactEmail,
            Plan = (int)TenantPlanEnum.Starter,
            MaxUsers = 10,
            MaxStorageGB = 5,
            IsActive = true
        };
        
        await _tenantRepository.AddAsync(tenant);
        
        // Create default Workspace
        var defaultWorkspace = new Workspace
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Name = "Département Par Défaut",
            IsActive = true
        };
        await _workspaceRepository.AddAsync(defaultWorkspace);
        
        // Create admin TenantUser
        var adminPassword = BCrypt.Net.BCrypt.HashPassword(dto.AdminPassword);
        var tenantAdmin = new TenantUser
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Email = dto.AdminEmail,
            FullName = dto.AdminName,
            PasswordHash = adminPassword,
            Role = (int)TenantRoleEnum.Admin,
            IsActive = true
        };
        await _tenantUserRepository.AddAsync(tenantAdmin);
        
        // Assign admin to default workspace
        var wsUser = new WorkspaceUser
        {
            Id = Guid.NewGuid(),
            WorkspaceId = defaultWorkspace.Id,
            TenantUserId = tenantAdmin.Id,
            Role = (int)WorkspaceRoleEnum.Admin
        };
        await _workspaceUserRepository.AddAsync(wsUser);
        
        // Save all
        await _tenantRepository.SaveChangesAsync();
        
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
    
    // ... Autres méthodes
}
```

### Étape 2.2: Adapter DossierService

**Fichier**: `sigac-backend/SIGAC.Core/Services/DossierService.cs` (Modifier signature)

```csharp
public interface IDossierService
{
    Task<PaginatedResult<DossierListDto>> GetDossiersAsync(
        Guid tenantId,
        Guid workspaceId,
        int page, int pageSize,
        Guid userId,
        TenantRoleEnum userRole,
        DossierFilters? filters = null
    );
    
    Task<DossierDetailDto> GetDossierByIdAsync(Guid tenantId, Guid dossierId, Guid userId);
    
    Task<DossierDto> CreateDossierAsync(
        Guid tenantId,
        Guid workspaceId,
        CreateDossierDto dto,
        Guid userId,
        TenantRoleEnum userRole
    );
}

public class DossierService : IDossierService
{
    private readonly IDossierRepository _dossierRepository;
    private readonly IHistoriqueRepository _historiqueRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IMapper _mapper;
    
    public async Task<DossierDetailDto> GetDossierByIdAsync(Guid tenantId, Guid dossierId, Guid userId)
    {
        // Vérifier isolation: Dossier doit être dans Workspace du Tenant
        var dossier = await _dossierRepository.GetByIdAsync(dossierId);
        
        if (dossier == null)
            throw new KeyNotFoundException("Dossier not found");
        
        // Vérifier Tenant isolation
        var workspace = dossier.Workspace;
        if (workspace.TenantId != tenantId)
            throw new UnauthorizedAccessException("Tenant access denied");
        
        return _mapper.Map<DossierDetailDto>(dossier);
    }
    
    public async Task<DossierDto> CreateDossierAsync(
        Guid tenantId,
        Guid workspaceId,
        CreateDossierDto dto,
        Guid userId,
        TenantRoleEnum userRole
    )
    {
        // Vérifier workspace appartient au tenant
        var workspace = await _workspaceRepository.GetByIdAsync(workspaceId);
        if (workspace?.TenantId != tenantId)
            throw new UnauthorizedAccessException("Workspace not in tenant");
        
        // Créer dossier
        var dossier = new Dossier
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            NumeroDossier = GenerateNumeroDossier(),
            Titre = dto.Titre,
            RapporteurId = dto.RapporteurId,
            Status = (int)StatusDossier.Nouveau,
            CreatedAt = DateTime.UtcNow
        };
        
        await _dossierRepository.AddAsync(dossier);
        
        // Ajouter historique
        await _historiqueRepository.AddAsync(new Historique
        {
            DossierId = dossier.Id,
            Action = "Création",
            Details = $"Dossier créé avec le titre: {dossier.Titre}",
            UserId = userId,
            DateAction = DateTime.UtcNow
        });
        
        // Audit log (avec TenantId)
        await _auditLogRepository.LogActionAsync(
            tenantId,
            userId,
            "CREATE",
            "Dossier",
            dossier.Id.ToString(),
            null,
            JsonConvert.SerializeObject(dossier)
        );
        
        await _dossierRepository.SaveChangesAsync();
        
        return _mapper.Map<DossierDto>(dossier);
    }
}
```

### Étape 2.3: Créer Admin Dashboard Service

**Fichier**: `sigac-backend/SIGAC.Core/Services/AdminDashboardService.cs`

```csharp
public interface IAdminDashboardService
{
    Task<AdminDashboardMetricsDto> GetMetricsAsync();
    Task<TenantDashboardDto> GetTenantMetricsAsync(Guid tenantId);
    Task<List<TenantHealthDto>> GetHealthCheckAsync();
}

public class AdminDashboardService : IAdminDashboardService
{
    private readonly ITenantRepository _tenantRepository;
    private readonly ITenantUsageRepository _usageRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    
    public async Task<AdminDashboardMetricsDto> GetMetricsAsync()
    {
        var tenants = await _tenantRepository.GetAllAsync();
        
        var metrics = new AdminDashboardMetricsDto
        {
            TotalTenants = tenants.Count,
            ActiveTenants = tenants.Count(t => t.IsActive),
            TotalUsers = await _tenantUserRepository.Query().CountAsync(),
            MonthlyRecurringRevenue = CalculateMRR(tenants),
            TenantsByPlan = tenants
                .GroupBy(t => t.Plan)
                .Select(g => new PlanMetricDto
                {
                    Plan = ((TenantPlanEnum)g.Key).ToString(),
                    Count = g.Count()
                })
                .ToList()
        };
        
        return metrics;
    }
    
    public async Task<TenantDashboardDto> GetTenantMetricsAsync(Guid tenantId)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant == null) throw new KeyNotFoundException();
        
        var userCount = tenant.Users.Count;
        var usage = await _usageRepository.Query()
            .Where(u => u.TenantId == tenantId && u.EventDate > DateTime.UtcNow.AddDays(-30))
            .ToListAsync();
        
        return new TenantDashboardDto
        {
            TenantId = tenant.Id,
            Name = tenant.Name,
            Plan = ((TenantPlanEnum)tenant.Plan).ToString(),
            Users = userCount,
            MaxUsers = tenant.MaxUsers,
            UsageEvents30D = usage.Count,
            SubscriptionExpires = tenant.SubscriptionEndDate
        };
    }
    
    // ...
}
```

### Étape 2.4: Créer Repositories

**Fichier**: `sigac-backend/SIGAC.Infrastructure/Repositories/TenantRepository.cs`

```csharp
public interface ITenantRepository
{
    Task<Tenant?> GetByIdAsync(Guid id);
    Task<Tenant?> GetBySlugAsync(string slug);
    Task<List<Tenant>> GetAllAsync();
    Task AddAsync(Tenant entity);
    Task UpdateAsync(Tenant entity);
    Task DeleteAsync(Guid id);
    Task SaveChangesAsync();
    IQueryable<Tenant> Query();
}

public class TenantRepository : ITenantRepository
{
    private readonly ApplicationDbContext _context;
    
    public TenantRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<Tenant?> GetByIdAsync(Guid id)
    {
        return await _context.Tenants
            .Include(t => t.Workspaces)
            .Include(t => t.Users)
            .FirstOrDefaultAsync(t => t.Id == id);
    }
    
    public async Task<Tenant?> GetBySlugAsync(string slug)
    {
        return await _context.Tenants
            .FirstOrDefaultAsync(t => t.Slug == slug);
    }
    
    public async Task<List<Tenant>> GetAllAsync()
    {
        return await _context.Tenants
            .Where(t => t.IsActive)
            .ToListAsync();
    }
    
    public async Task AddAsync(Tenant entity)
    {
        _context.Tenants.Add(entity);
    }
    
    public async Task UpdateAsync(Tenant entity)
    {
        _context.Tenants.Update(entity);
    }
    
    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null)
        {
            entity.IsActive = false;
            entity.DeletedAt = DateTime.UtcNow;
            _context.Tenants.Update(entity);
        }
    }
    
    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
    
    public IQueryable<Tenant> Query()
    {
        return _context.Tenants.AsQueryable();
    }
}
```

### Étape 2.5: Enregistrer en DI

**Fichier**: `sigac-backend/SIGAC.API/Program.cs` (Ajouter)

```csharp
// Services
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IAdminDashboardService, AdminDashboardService>();

// Repositories
builder.Services.AddScoped<ITenantRepository, TenantRepository>();
builder.Services.AddScoped<ITenantUserRepository, TenantUserRepository>();
builder.Services.AddScoped<ITenantUsageRepository, TenantUsageRepository>();
builder.Services.AddScoped<ITenantSubscriptionRepository, TenantSubscriptionRepository>();
```

---

## 🌐 PHASE 3: API Controllers (Semaine 5)

### Étape 3.1: Adapter DossiersController

**Fichier**: `sigac-backend/SIGAC.API/Controllers/DossiersController.cs`

```csharp
[ApiController]
[Route("api/tenants/{tenantId}/workspaces/{workspaceId}/dossiers")]
[Authorize]
public class DossiersController : ControllerBase
{
    private readonly IDossierService _dossierService;
    
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<DossierListDto>>> GetDossiers(
        Guid tenantId,
        Guid workspaceId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10
    )
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var userRoleStr = User.FindFirst("tenant_role")?.Value ?? "Member";
        var userRole = Enum.Parse<TenantRoleEnum>(userRoleStr);
        
        var result = await _dossierService.GetDossiersAsync(
            tenantId, workspaceId, page, pageSize, userId, userRole
        );
        
        return Ok(result);
    }
    
    [HttpPost]
    public async Task<ActionResult<DossierDto>> CreateDossier(
        Guid tenantId,
        Guid workspaceId,
        [FromBody] CreateDossierDto dto
    )
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var userRoleStr = User.FindFirst("tenant_role")?.Value ?? "Member";
        var userRole = Enum.Parse<TenantRoleEnum>(userRoleStr);
        
        var result = await _dossierService.CreateDossierAsync(
            tenantId, workspaceId, dto, userId, userRole
        );
        
        return CreatedAtAction(nameof(GetDossier), new { tenantId, workspaceId, id = result.Id }, result);
    }
}
```

### Étape 3.2: Créer TenantsController (Admin)

**Fichier**: `sigac-backend/SIGAC.API/Controllers/Admin/TenantsController.cs` (NOUVEAU)

```csharp
[ApiController]
[Route("api/admin/tenants")]
[Authorize(Roles = "Admin")]  // Système admin only
public class AdminTenantsController : ControllerBase
{
    private readonly ITenantService _tenantService;
    private readonly IAdminDashboardService _adminService;
    
    [HttpPost]
    public async Task<ActionResult<TenantDto>> ProvisionTenant([FromBody] ProvisionTenantDto dto)
    {
        var adminUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var result = await _tenantService.ProvisionTenantAsync(dto, adminUserId);
        return CreatedAtAction(nameof(GetTenant), new { id = result.Id }, result);
    }
    
    [HttpGet]
    public async Task<ActionResult<List<TenantListDto>>> ListTenants()
    {
        // À implémenter
        return Ok(new List<TenantListDto>());
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<TenantDto>> GetTenant(Guid id)
    {
        var result = await _tenantService.GetTenantAsync(id);
        return Ok(result);
    }
    
    [HttpGet("dashboard/metrics")]
    public async Task<ActionResult<AdminDashboardMetricsDto>> GetMetrics()
    {
        var result = await _adminService.GetMetricsAsync();
        return Ok(result);
    }
}
```

---

## 📝 DTOs Requis

**Fichier**: `sigac-backend/SIGAC.Core/DTOs/Tenant/`.

```csharp
public class TenantDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Slug { get; set; }
    public string Plan { get; set; }
    public int MaxUsers { get; set; }
    public int UsersCount { get; set; }
    public DateTime SubscriptionStartDate { get; set; }
    public DateTime? SubscriptionEndDate { get; set; }
}

public class ProvisionTenantDto
{
    public string Name { get; set; }
    public string ContactEmail { get; set; }
    public string ContactPhone { get; set; }
    public string AdminName { get; set; }
    public string AdminEmail { get; set; }
    public string AdminPassword { get; set; }
}

public class AdminDashboardMetricsDto
{
    public int TotalTenants { get; set; }
    public int ActiveTenants { get; set; }
    public int TotalUsers { get; set; }
    public decimal MonthlyRecurringRevenue { get; set; }
    public List<PlanMetricDto> TenantsByPlan { get; set; }
}
```

---

## 📝 Checklist Implémentation

### Phase 1: Database
- [ ] Créer Tenant.cs
- [ ] Créer TenantUser.cs
- [ ] Créer TenantSubscription.cs
- [ ] Créer TenantUsageEvent.cs
- [ ] Adapter Workspace.cs
- [ ] Adapter WorkspaceUser.cs
- [ ] Migration EF Core
- [ ] Seed data migration
- [ ] Tests isolation

### Phase 2: Services
- [ ] TenantService (CRUD + provision)
- [ ] ITenantRepository
- [ ] AdminDashboardService
- [ ] Adapter DossierService
- [ ] Adapter tous autres services métier
- [ ] DTOs pour Tenant
- [ ] Enregistrer en DI

### Phase 3: API
- [ ] TenantsController (Admin)
- [ ] Adapter DossiersController (+ tenantId)
- [ ] Adapter tous autres controllers
- [ ] JWT claims (tenant_role)
- [ ] Tests d'isolation

### Phase 4: Frontend (Prochaine itération)
- [ ] TenantLayout
- [ ] TenantSelector
- [ ] tenantStore (Zustand)
- [ ] AdminDashboard
- [ ] SubscriptionManagement

### Phase 5: Monetization
- [ ] Intégration Stripe
- [ ] Webhooks subscriptions
- [ ] Usage tracking
- [ ] Billing page

---

**Estimé**: 7-10 semaines pour version 1.0 commercialisable!

Commencer par Phase 1 (Database) maintenant? 🚀
