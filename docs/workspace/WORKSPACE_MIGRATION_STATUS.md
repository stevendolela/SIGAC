# Workspace Migration - Status

**Date**: 16 décembre 2024  
**Phase**: GED Transformation - Phase 1 (Backend Entities)  
**Status**: ✅ Entities créées, migration générée, **en attente d'application DB**

---

## ✅ Complété

### 1. Entities Backend (SIGAC.Core/Entities/)

**✅ Workspace.cs** - Organisation/Entreprise container
```csharp
public class Workspace
{
    public Guid Id { get; set; }
    public string Name { get; set; }              // Nom de l'organisation
    public string Slug { get; set; }              // URL-friendly identifier
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    
    // Limites
    public int MaxStorageGB { get; set; } = 100;
    public int MaxUsers { get; set; } = 50;
    public bool AllowGuestAccess { get; set; } = false;
    
    // État
    public bool IsActive { get; set; } = true;
    
    // Relations
    public Guid OwnerId { get; set; }
    public User Owner { get; set; }
    public ICollection<WorkspaceUser> Members { get; set; }
    public ICollection<Dossier> Projects { get; set; }
    public ICollection<Formation> Teams { get; set; }
    
    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedAt { get; set; }
}
```

**✅ WorkspaceUser.cs** - Junction table Many-to-Many
```csharp
public class WorkspaceUser
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; set; }
    
    public Guid UserId { get; set; }
    public User User { get; set; }
    
    public WorkspaceRole Role { get; set; }  // Owner, Admin, Member, Guest
    public DateTime JoinedAt { get; set; }
    public Guid? InvitedBy { get; set; }
    public bool IsActive { get; set; }
}
```

**✅ WorkspaceRole.cs** (Enum)
```csharp
public enum WorkspaceRole
{
    Owner = 0,   // Propriétaire (full control)
    Admin = 1,   // Administrateur (manage members, projects)
    Member = 2,  // Membre (access assigned projects)
    Guest = 3    // Invité (read-only)
}
```

### 2. Extensions Entities Existantes

**✅ Dossier.cs** - Ajout WorkspaceId
```csharp
// Nullable pour compatibilité backward avec données existantes
public Guid? WorkspaceId { get; set; }
public Workspace? Workspace { get; set; }
```

**✅ User.cs** - Ajout relations Workspace
```csharp
// Relations workspace (nouveau modèle GED)
public ICollection<WorkspaceUser> WorkspaceMemberships { get; set; }
public ICollection<Workspace> OwnedWorkspaces { get; set; }
```

**✅ Formation.cs** - Auto-détecté par EF Core
- Migration ajoute automatiquement `WorkspaceId` (nullable) sur table Formations

### 3. ApplicationDbContext Configuration

**✅ DbSets ajoutés**:
```csharp
public DbSet<Workspace> Workspaces { get; set; }
public DbSet<WorkspaceUser> WorkspaceUsers { get; set; }
```

**✅ Configurations EF Core**:
- `Workspace`: Slug unique, Name required (200 chars), Owner FK Restrict
- `WorkspaceUser`: Composite key (WorkspaceId, UserId), Cascade delete
- `Dossier`: Workspace FK optional (IsRequired(false))

### 4. Migration EF Core

**✅ Migration générée**: `20251216190719_AddWorkspaceSupport.cs`

**Tables créées**:
1. **Workspaces** (11 colonnes):
   - Id (PK, uuid)
   - Name (varchar(200), NOT NULL)
   - Slug (varchar(100), NOT NULL, UNIQUE)
   - Description (varchar(1000))
   - LogoUrl (varchar(500))
   - MaxStorageGB (int)
   - MaxUsers (int)
   - AllowGuestAccess (boolean)
   - IsActive (boolean)
   - OwnerId (FK → Users, Restrict)
   - CreatedAt, ModifiedAt (timestamp)

2. **WorkspaceUsers** (6 colonnes):
   - WorkspaceId (PK composite, FK → Workspaces, Cascade)
   - UserId (PK composite, FK → Users, Cascade)
   - Role (int - WorkspaceRole enum)
   - JoinedAt (timestamp)
   - InvitedBy (uuid?)
   - IsActive (boolean)

**Colonnes ajoutées** (nullable pour backward compat):
- `Dossiers.WorkspaceId` (uuid?, FK → Workspaces, Restrict)
- `Formations.WorkspaceId` (uuid?, FK → Workspaces)

**Index**:
- `IX_Workspaces_Slug` (UNIQUE)
- `IX_Workspaces_OwnerId`
- `IX_Dossiers_WorkspaceId`
- `IX_Formations_WorkspaceId`
- `IX_WorkspaceUsers_UserId`

### 5. Build Status

**✅ Compilation réussie** avec avertissements bénins (nullable references CS8601/CS8603/CS8604)

```
SIGAC.Core: ✅ Réussi
SIGAC.Infrastructure: ✅ Réussi
```

---

## ⏳ En Attente

### 1. Application Migration DB

**❌ Bloqué**: PostgreSQL local non démarré

**Commande à exécuter** (quand PostgreSQL sera up):
```bash
cd /Users/steve/Projects/SIGAC/sigac-backend
DOTNET_ROLL_FORWARD=LatestMajor dotnet ef database update \
  --project SIGAC.Infrastructure \
  --startup-project SIGAC.API
```

**Prérequis**:
- Démarrer Docker Desktop
- OU démarrer PostgreSQL: `docker-compose up -d postgres`
- Vérifier connexion: `psql -h localhost -p 5434 -U sigac_user -d sigac_db`

**Vérification post-migration**:
```sql
-- Vérifier tables créées
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Workspaces', 'WorkspaceUsers');

-- Vérifier colonnes ajoutées
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'Dossiers' AND column_name = 'WorkspaceId';
```

### 2. DTOs à Créer

**WorkspaceDto.cs** (SIGAC.Core/DTOs/):
```csharp
public class WorkspaceDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Slug { get; set; }
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public int MaxStorageGB { get; set; }
    public int MaxUsers { get; set; }
    public int CurrentMemberCount { get; set; }
    public int CurrentProjectCount { get; set; }
    public WorkspaceRole UserRole { get; set; }  // Rôle de l'utilisateur connecté
    public DateTime CreatedAt { get; set; }
}

public class CreateWorkspaceDto
{
    [Required, StringLength(200)]
    public string Name { get; set; }
    
    [Required, StringLength(100), RegularExpression(@"^[a-z0-9-]+$")]
    public string Slug { get; set; }
    
    [StringLength(1000)]
    public string? Description { get; set; }
}

public class UpdateWorkspaceDto
{
    [StringLength(200)]
    public string? Name { get; set; }
    
    [StringLength(1000)]
    public string? Description { get; set; }
    
    [Url]
    public string? LogoUrl { get; set; }
    
    public int? MaxStorageGB { get; set; }
    public int? MaxUsers { get; set; }
    public bool? AllowGuestAccess { get; set; }
}

public class WorkspaceMemberDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public string NomComplet { get; set; }
    public WorkspaceRole Role { get; set; }
    public DateTime JoinedAt { get; set; }
    public bool IsActive { get; set; }
}

public class AddWorkspaceMemberDto
{
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    public WorkspaceRole Role { get; set; } = WorkspaceRole.Member;
}
```

### 3. AutoMapper Profile

**WorkspaceMappingProfile.cs** (SIGAC.Core/Mapping/):
```csharp
public class WorkspaceMappingProfile : Profile
{
    public WorkspaceMappingProfile()
    {
        CreateMap<Workspace, WorkspaceDto>()
            .ForMember(d => d.CurrentMemberCount, 
                opt => opt.MapFrom(s => s.Members.Count(m => m.IsActive)))
            .ForMember(d => d.CurrentProjectCount, 
                opt => opt.MapFrom(s => s.Projects.Count))
            .ForMember(d => d.UserRole, 
                opt => opt.Ignore()); // Set manually in service
        
        CreateMap<CreateWorkspaceDto, Workspace>();
        
        CreateMap<WorkspaceUser, WorkspaceMemberDto>()
            .ForMember(d => d.Username, opt => opt.MapFrom(s => s.User.Username))
            .ForMember(d => d.Email, opt => opt.MapFrom(s => s.User.Email))
            .ForMember(d => d.NomComplet, opt => opt.MapFrom(s => s.User.NomComplet));
    }
}
```

### 4. Service Interface & Implementation

**IWorkspaceService.cs** (SIGAC.Core/Interfaces/):
```csharp
public interface IWorkspaceService
{
    Task<WorkspaceDto> CreateWorkspaceAsync(CreateWorkspaceDto dto, Guid userId);
    Task<List<WorkspaceDto>> GetUserWorkspacesAsync(Guid userId);
    Task<WorkspaceDto> GetWorkspaceByIdAsync(Guid workspaceId, Guid userId);
    Task<WorkspaceDto> GetWorkspaceBySlugAsync(string slug, Guid userId);
    Task<WorkspaceDto> UpdateWorkspaceAsync(Guid workspaceId, UpdateWorkspaceDto dto, Guid userId);
    Task DeleteWorkspaceAsync(Guid workspaceId, Guid userId);
    
    Task<List<WorkspaceMemberDto>> GetWorkspaceMembersAsync(Guid workspaceId, Guid userId);
    Task AddMemberAsync(Guid workspaceId, AddWorkspaceMemberDto dto, Guid userId);
    Task UpdateMemberRoleAsync(Guid workspaceId, Guid memberId, WorkspaceRole newRole, Guid userId);
    Task RemoveMemberAsync(Guid workspaceId, Guid memberId, Guid userId);
    
    Task<bool> HasPermissionAsync(Guid workspaceId, Guid userId, WorkspaceRole minimumRole);
}
```

**WorkspaceService.cs** (SIGAC.Core/Services/):
```csharp
public class WorkspaceService : IWorkspaceService
{
    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IMapper _mapper;
    
    public WorkspaceService(
        IWorkspaceRepository workspaceRepository,
        IAuditLogRepository auditLogRepository,
        IMapper mapper)
    {
        _workspaceRepository = workspaceRepository;
        _auditLogRepository = auditLogRepository;
        _mapper = mapper;
    }
    
    public async Task<WorkspaceDto> CreateWorkspaceAsync(CreateWorkspaceDto dto, Guid userId)
    {
        // Validation: slug unique
        if (await _workspaceRepository.SlugExistsAsync(dto.Slug))
            throw new ArgumentException($"Slug '{dto.Slug}' déjà utilisé");
        
        var workspace = _mapper.Map<Workspace>(dto);
        workspace.OwnerId = userId;
        workspace.CreatedAt = DateTime.UtcNow;
        
        // Ajouter le créateur comme Owner dans Members
        workspace.Members = new List<WorkspaceUser>
        {
            new WorkspaceUser
            {
                UserId = userId,
                Role = WorkspaceRole.Owner,
                JoinedAt = DateTime.UtcNow,
                IsActive = true
            }
        };
        
        await _workspaceRepository.AddAsync(workspace);
        await _workspaceRepository.SaveChangesAsync();
        
        await _auditLogRepository.LogActionAsync(
            userId, "CREATE", "Workspace", workspace.Id.ToString(),
            null, JsonSerializer.Serialize(workspace));
        
        var result = _mapper.Map<WorkspaceDto>(workspace);
        result.UserRole = WorkspaceRole.Owner;
        return result;
    }
    
    // ... autres méthodes
}
```

### 5. Repository Interface & Implementation

**IWorkspaceRepository.cs** (SIGAC.Core/Interfaces/):
```csharp
public interface IWorkspaceRepository
{
    Task<Workspace?> GetByIdAsync(Guid id, bool includeMembers = false, bool includeProjects = false);
    Task<Workspace?> GetBySlugAsync(string slug, bool includeMembers = false);
    Task<List<Workspace>> GetUserWorkspacesAsync(Guid userId);
    Task<bool> SlugExistsAsync(string slug);
    Task AddAsync(Workspace workspace);
    Task UpdateAsync(Workspace workspace);
    Task DeleteAsync(Guid id);
    Task SaveChangesAsync();
    
    Task<WorkspaceUser?> GetMembershipAsync(Guid workspaceId, Guid userId);
    Task<List<WorkspaceUser>> GetWorkspaceMembersAsync(Guid workspaceId);
}
```

**WorkspaceRepository.cs** (SIGAC.Infrastructure/Repositories/):
```csharp
public class WorkspaceRepository : IWorkspaceRepository
{
    private readonly ApplicationDbContext _context;
    
    public WorkspaceRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<Workspace?> GetByIdAsync(Guid id, bool includeMembers = false, bool includeProjects = false)
    {
        var query = _context.Workspaces.AsQueryable();
        
        if (includeMembers)
            query = query.Include(w => w.Members).ThenInclude(m => m.User);
        
        if (includeProjects)
            query = query.Include(w => w.Projects);
        
        return await query.FirstOrDefaultAsync(w => w.Id == id);
    }
    
    public async Task<List<Workspace>> GetUserWorkspacesAsync(Guid userId)
    {
        return await _context.Workspaces
            .Include(w => w.Members)
            .Where(w => w.Members.Any(m => m.UserId == userId && m.IsActive))
            .ToListAsync();
    }
    
    public async Task<bool> SlugExistsAsync(string slug)
    {
        return await _context.Workspaces.AnyAsync(w => w.Slug == slug);
    }
    
    // ... autres méthodes
}
```

### 6. API Controller

**WorkspacesController.cs** (SIGAC.API/Controllers/):
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkspacesController : ControllerBase
{
    private readonly IWorkspaceService _workspaceService;
    
    public WorkspacesController(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }
    
    [HttpPost]
    public async Task<ActionResult<WorkspaceDto>> CreateWorkspace([FromBody] CreateWorkspaceDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var workspace = await _workspaceService.CreateWorkspaceAsync(dto, userId);
        return CreatedAtAction(nameof(GetWorkspace), new { id = workspace.Id }, workspace);
    }
    
    [HttpGet]
    public async Task<ActionResult<List<WorkspaceDto>>> GetUserWorkspaces()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var workspaces = await _workspaceService.GetUserWorkspacesAsync(userId);
        return Ok(workspaces);
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<WorkspaceDto>> GetWorkspace(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var workspace = await _workspaceService.GetWorkspaceByIdAsync(id, userId);
        return Ok(workspace);
    }
    
    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<WorkspaceDto>> GetWorkspaceBySlug(string slug)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var workspace = await _workspaceService.GetWorkspaceBySlugAsync(slug, userId);
        return Ok(workspace);
    }
    
    // Members endpoints
    [HttpGet("{id}/members")]
    public async Task<ActionResult<List<WorkspaceMemberDto>>> GetMembers(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var members = await _workspaceService.GetWorkspaceMembersAsync(id, userId);
        return Ok(members);
    }
    
    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddWorkspaceMemberDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        await _workspaceService.AddMemberAsync(id, dto, userId);
        return NoContent();
    }
    
    [HttpDelete("{id}/members/{memberId}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid memberId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        await _workspaceService.RemoveMemberAsync(id, memberId, userId);
        return NoContent();
    }
}
```

### 7. Dependency Injection

**Program.cs** (SIGAC.API/):
```csharp
// Dans la section services
builder.Services.AddScoped<IWorkspaceService, WorkspaceService>();
builder.Services.AddScoped<IWorkspaceRepository, WorkspaceRepository>();
```

---

## 📋 Prochaines Étapes

### Immédiat (Cette session)
1. ✅ ~~Créer entities Workspace, WorkspaceUser, WorkspaceRole~~
2. ✅ ~~Étendre Dossier, User, Formation~~
3. ✅ ~~Configurer ApplicationDbContext~~
4. ✅ ~~Générer migration EF Core~~
5. ⏳ **Appliquer migration DB locale** (bloqué - PostgreSQL down)
6. ⏳ Créer DTOs Workspace
7. ⏳ Créer AutoMapper profile
8. ⏳ Créer WorkspaceService + Repository
9. ⏳ Créer WorkspacesController
10. ⏳ Enregistrer en DI

### Court Terme (Prochaines heures)
- Tester API endpoints Workspace
- Créer workspace de test via Swagger
- Implémenter gestion permissions (Owner/Admin/Member)
- Ajouter validation métier (max users, max storage)

### Moyen Terme (Prochains jours)
- Frontend: WorkspaceSelector component
- Frontend: WorkspaceContext store (Zustand)
- Frontend: WorkspaceSettings page
- Étendre DossiersController pour filtrer par workspace
- Migration données existantes vers workspace par défaut

### Long Terme (Selon GED_TRANSFORMATION_PLAN.md)
- Folder hierarchy entity
- Document versioning
- Tags system
- Advanced search
- Task management
- Workflow automation

---

## 🔧 Commandes Utiles

### Démarrer PostgreSQL
```bash
# Démarrer Docker Desktop first
cd /Users/steve/Projects/SIGAC
docker-compose up -d postgres

# Vérifier statut
docker-compose ps

# Logs
docker-compose logs -f postgres
```

### Appliquer Migration
```bash
cd /Users/steve/Projects/SIGAC/sigac-backend
DOTNET_ROLL_FORWARD=LatestMajor dotnet ef database update \
  --project SIGAC.Infrastructure \
  --startup-project SIGAC.API
```

### Vérifier DB
```bash
# Connection string: postgres://sigac_user:SecurePassword2024!@localhost:5434/sigac_db
psql -h localhost -p 5434 -U sigac_user -d sigac_db

# Dans psql:
\dt                    # Lister tables
\d "Workspaces"       # Décrire table Workspaces
\d "WorkspaceUsers"   # Décrire table WorkspaceUsers
SELECT * FROM "Workspaces";
```

### Rollback Migration (Si besoin)
```bash
DOTNET_ROLL_FORWARD=LatestMajor dotnet ef migrations remove \
  --project SIGAC.Infrastructure \
  --startup-project SIGAC.API
```

---

## 📊 Statistiques

- **Entities créées**: 3 (Workspace, WorkspaceUser, WorkspaceRole)
- **Entities modifiées**: 3 (Dossier, User, Formation)
- **Tables DB créées**: 2 (Workspaces, WorkspaceUsers)
- **Colonnes ajoutées**: 2 (Dossiers.WorkspaceId, Formations.WorkspaceId)
- **Index créés**: 5
- **Lignes de code**: ~250+ (entities + config)
- **Temps écoulé**: ~30 minutes

---

## ✅ Backward Compatibility

**Garanties**:
- ✅ `WorkspaceId` nullable sur Dossiers/Formations → données existantes non affectées
- ✅ FK Restrict sur Dossier.Workspace → pas de cascade delete
- ✅ Aucune contrainte NOT NULL sur nouvelles colonnes
- ✅ Migration Down() disponible pour rollback

**Migration données existantes** (future):
```sql
-- Créer workspace par défaut
INSERT INTO "Workspaces" (Id, Name, Slug, OwnerId, CreatedAt, IsActive, MaxStorageGB, MaxUsers, AllowGuestAccess)
VALUES (
    gen_random_uuid(),
    'Cour Constitutionnelle RDC',
    'cc-rdc',
    (SELECT Id FROM "Users" WHERE "Role" = 0 LIMIT 1),  -- Premier admin
    NOW(),
    true,
    100,
    50,
    false
);

-- Assigner tous les dossiers existants au workspace par défaut
UPDATE "Dossiers"
SET "WorkspaceId" = (SELECT Id FROM "Workspaces" WHERE Slug = 'cc-rdc')
WHERE "WorkspaceId" IS NULL;

-- Ajouter tous les utilisateurs comme membres
INSERT INTO "WorkspaceUsers" (WorkspaceId, UserId, Role, JoinedAt, IsActive)
SELECT 
    (SELECT Id FROM "Workspaces" WHERE Slug = 'cc-rdc'),
    Id,
    CASE 
        WHEN "Role" = 0 THEN 1  -- Admin → WorkspaceRole.Admin
        ELSE 2                   -- Autres → WorkspaceRole.Member
    END,
    NOW(),
    true
FROM "Users";
```

---

**Dernière mise à jour**: 16 décembre 2024 19:15 UTC  
**Auteur**: Steve (avec GitHub Copilot)  
**Statut**: ✅ Prêt pour application migration (quand PostgreSQL sera up)
