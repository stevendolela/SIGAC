# SIGAC - Instructions pour les Agents IA

## Architecture Générale

SIGAC est un système de gestion des affaires constitutionnelles pour la Cour Constitutionnelle RDC. Architecture 3-tier :

- **Backend** (.NET 8, C#): API REST avec Entity Framework Core + PostgreSQL
  - `SIGAC.API`: Contrôleurs, middleware, configuration startup
  - `SIGAC.Core`: DTOs, Entities, Services métier, Interfaces, Enums
  - `SIGAC.Infrastructure`: DbContext, Repositories, Migrations EF Core
- **Frontend** (React, TypeScript): SPA avec hooks customs, store global, API client
- **Database**: PostgreSQL 15 avec migrations EF Core managées

### Flux de Données Clés

1. **Requêtes authentifiées**: Client → Bearer JWT → Controller → Service → Repository → DbContext
2. **Audit complet**: Tous les CRUD enregistrés dans `AuditLog` (IP, user, timestamp, old/new values)
3. **Historiques métier**: Chaque action sur Dossier ajoute une entrée `Historique` (traçabilité complète)
4. **Pagination standardisée**: `PaginatedResult<T>` avec `PaginationMetadata` (page, pageSize, totalItems, totalPages)

---

## Patterns d'Implémentation

### 1. Service → Repository → DbContext

**Toujours** utiliser cette chaîne - jamais bypasser:

```csharp
// Service (SIGAC.Core/Services/DossierService.cs)
public class DossierService : IDossierService
{
    private readonly IDossierRepository _dossierRepository;
    private readonly IMapper _mapper;
    
    public async Task<DossierDto> CreateDossierAsync(CreateDossierDto dto, Guid userId)
    {
        ValidateCreateDossier(dto);  // Validation métier
        var dossier = new Dossier { /* map from dto */ };
        await _dossierRepository.AddAsync(dossier);
        await _dossierRepository.SaveChangesAsync();
        // Log audit immédiatement après
        await _auditLogRepository.LogActionAsync(...);
        return _mapper.Map<DossierDto>(dossier);
    }
}

// Repository (SIGAC.Infrastructure/Repositories/DossierRepository.cs)
public class DossierRepository : IDossierRepository
{
    private readonly ApplicationDbContext _context;
    public async Task AddAsync(Dossier entity) => _context.Dossiers.Add(entity);
    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}
```

### 2. Contrôle d'Accès par Rôle

**Pattern fondamental** - tous les services reçoivent `userId` + `userRole`:

```csharp
// Dans IDossierService.cs
Task<PaginatedResult<DossierListDto>> GetDossiersAsync(
    int page, int pageSize, string? search, TypeAffaire? type, 
    StatusDossier? status, PrioriteDossier? priorite, 
    DateTime? dateDebutMin, DateTime? dateDebutMax, 
    Guid? rapporteurId, Guid userId, UserRole userRole);  // ← Requis!

// Implémentation: Les juges ne voient que LEURS dossiers
if (userRole == UserRole.JugeConstitutionnel) {
    filtreRapporteur = userId;  // Force le filtre au utilisateur connecté
}
```

**Rôles définis** (en `SIGAC.Core/Enums/UserRole.cs`):
- `Admin`: Accès complet
- `President`: Gestion globale des dossiers
- `JugeConstitutionnel`: Accès restreint à ses dossiers assignés

### 3. DTOs et Entities Séparés

**Toujours** utiliser des DTOs pour les API responses, **jamais** exposer les Entities:

```csharp
// Entities (SIGAC.Core/Entities/): Source de vérité DB
public class Dossier { 
    public string PasswordHash { get; set; }  // Sensible, ne JAMAIS inclure en DTO
    public ICollection<Historique> Historiques { get; set; }
}

// DTOs (SIGAC.Core/DTOs/): Contrats publics
public class DossierDto {
    // Uniquement les données non-sensibles
    public string Titre { get; set; }
    public DossierListDto : Lean version (sans Documents, Historiques)
    public DossierDetailDto : Full version (avec relations)
}
```

### 4. AutoMapper pour Mapping Entity → DTO

Configuration auto-découverte dans `Program.cs`:

```csharp
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
```

Utilisation dans services:

```csharp
var dossierDtos = _mapper.Map<List<DossierListDto>>(dossiers);
```

Profils de mapping à créer en `SIGAC.Core/Mapping/` avec convention:

```csharp
public class DossierMappingProfile : Profile
{
    public DossierMappingProfile()
    {
        CreateMap<Dossier, DossierDto>().ReverseMap();
        CreateMap<Dossier, DossierDetailDto>()
            .ForMember(d => d.Documents, opt => opt.MapFrom(s => s.Documents));
    }
}
```

### 5. Transitions d'État Métier Validées

**Toujours** valider les transitions de statut:

```csharp
// En DossierService.ChangerStatutAsync()
var allowedTransitions = new Dictionary<StatusDossier, List<StatusDossier>>
{
    { StatusDossier.Nouveau, new List<StatusDossier> { StatusDossier.EnInstruction } },
    { StatusDossier.EnInstruction, new List<StatusDossier> { StatusDossier.EnDelibere, StatusDossier.Nouveau } },
    // ...
};

if (!allowedTransitions[currentStatus].Contains(newStatus))
    throw new ArgumentException($"Transition invalide");
```

Statuts définis en `SIGAC.Core/Enums/StatusDossier.cs`.

### 6. Historiques et Audit Traces

**Chaque mutation** doit enregistrer:

1. **Historique métier** (`Dossier.Historiques`): Pour l'UI, traçabilité utilisateur
   ```csharp
   dossier.Historiques.Add(new Historique {
       DateAction = DateTime.UtcNow,
       Action = "Modification du dossier",
       Details = "Mise à jour du titre",
       UserId = userId
   });
   ```

2. **Audit log** (`AuditLog`): Pour la conformité, old/new values sérialisés JSON
   ```csharp
   var oldValues = JsonSerializer.Serialize(dossier);
   // ... mutation ...
   await _auditLogRepository.LogActionAsync(
       userId, "UPDATE", "Dossier", dossier.Id.ToString(), 
       oldValues, JsonSerializer.Serialize(dossier));
   ```

---

## Workflows de Développement

### Démarrage Rapide

```bash
# 1. Démarrer PostgreSQL (une fois)
cd /Users/steve/Projects/SIGAC
docker-compose up -d

# 2. Backend (Terminal 1)
cd sigac-backend
dotnet restore
dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API
dotnet run --project SIGAC.API
# Écoute sur http://localhost:5000 + Swagger sur http://localhost:5000/swagger

# 3. Frontend (Terminal 2)
cd sigac-frontend
npm install
npm run dev
# Écoute sur http://localhost:5173
```

### Vérifier PostgreSQL

```bash
# Logs
docker-compose logs -f postgres

# Redémarrer si besoin
docker-compose restart postgres

# Arrêter
docker-compose down
```

### Comptes de Test

- Admin: `admin` / `Admin@2024!`
- President: `president.benoit` / `President@2024!`
- Juge: `juge.mbala` / `Juge@2024!`

### Ajouter une Entité + Service + API

1. **Créer l'Entity** en `SIGAC.Core/Entities/MonEntity.cs`
2. **Ajouter au DbContext** en `SIGAC.Infrastructure/Data/ApplicationDbContext.cs`
3. **Créer le DTO** en `SIGAC.Core/DTOs/MonEntityDto.cs`
4. **Créer l'Interface** en `SIGAC.Core/Interfaces/IMonEntityService.cs`
5. **Implémenter le Service** en `SIGAC.Core/Services/MonEntityService.cs`
   - Injection: `IMonEntityRepository`, `IAuditLogRepository`, `IMapper`
   - Méthodes: GetAsync, GetByIdAsync, CreateAsync, UpdateAsync, DeleteAsync
   - Validation métier avant mutations
   - Logging audit après mutations
6. **Implémenter le Repository** en `SIGAC.Infrastructure/Repositories/MonEntityRepository.cs`
   - Hérité de `IDossierRepository`-like pattern
   - Include() ses relations nécessaires
7. **Créer le Controller** en `SIGAC.API/Controllers/MonEntityController.cs`
   - Extraction `userId` + `userRole` depuis `User` claims
   - Passage au service
   - Gestion d'erreurs (voir ExceptionHandlingMiddleware)
8. **Enregistrer en DI** en `Program.cs`:
   ```csharp
   builder.Services.AddScoped<IMonEntityService, MonEntityService>();
   builder.Services.AddScoped<IMonEntityRepository, MonEntityRepository>();
   ```

### Ajouter une Migration EF Core

```bash
cd sigac-backend

# Créer migration
dotnet ef migrations add NomMigration \
    --project SIGAC.Infrastructure \
    --startup-project SIGAC.API

# Appliquer
dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API
```

---

## Conventions Critiques

### Nommage

| Concept | Convention | Exemple |
|---------|-----------|---------|
| Entities | PascalCase, Singulier | `Dossier`, `User` |
| DTOs | `[Entity]Dto` ou `[Verb]Dto` | `DossierDto`, `CreateDossierDto` |
| Services | `[Entity]Service` | `DossierService` |
| Interfaces | `I[Entity]Service/Repository` | `IDossierService`, `IDossierRepository` |
| Controllers | `[Entity]Controller` | `DossierController` |
| DbSet | Pluriel | `DbSet<Dossier> Dossiers` |

### Code

- **Async/Await obligatoire**: Tous les I/O sont `async Task`
- **Null checks**: Utiliser `?` pour nullable, toujours vérifier avant access
- **Validation**: Avant mutations (services), jamais dans repos
- **Logging**: Serilog (`Log.Information`, `Log.Error`) - jamais Console.WriteLine()
- **Commentaires XML**: Sur interfaces publiques (`///`)

### Enums

Toujours en `SIGAC.Core/Enums/`. Pattern Dossier:
- `StatusDossier`: Workflow states (Nouveau → EnInstruction → EnDelibere → Juge → Classe)
- `PrioriteDossier`: Urgency (Normale, Haute, Critique)
- `TypeAffaire`: Case types (ContestatieElection, RecourseConstitu, etc.)
- `UserRole`: Access levels (Admin, President, JugeConstitutionnel)

---

## Points d'Intégration Critiques

### 1. JWT Authentication

Configuration dans `Program.cs`:
- Token issuer/audience défini en `appsettings.json`
- Expiré après 30 min (configurable)
- Refresh token en user.RefreshToken (expiry: 7 jours)
- Vérification claims: `ClaimTypes.NameIdentifier` = UserId

### 2. CORS

Whitelist en `appsettings.json` → `Cors:AllowedOrigins`. **Jamais** AllowAnyOrigin en production.

### 3. Error Handling

`ExceptionHandlingMiddleware` mappe les exceptions:
- `UnauthorizedAccessException` → 403 Forbidden
- `ArgumentException` → 400 BadRequest
- `KeyNotFoundException` → 404 NotFound
- Other → 500 InternalServerError avec RequestId

### 4. Middleware Chain

`Program.cs` → (order matters):
```
1. ExceptionHandlingMiddleware
2. AuditMiddleware
3. Authentication
4. Authorization
5. Controllers
```

AuditMiddleware skip: GET (200), /health, /swagger, /favicon.ico.

---

## Gestion des Documents

### Document Entity

```csharp
public class Document
{
    public Guid Id { get; set; }
    public Guid DossierId { get; set; }
    public string NomFichier { get; set; }          // Original filename
    public string CheminFichier { get; set; }       // Physical path /uploads/...
    public string TypeDocument { get; set; }        // "Requête", "Pièces justificatives", etc.
    public long TailleFichier { get; set; }         // Bytes
    public string MimeType { get; set; }            // application/pdf, image/png
    public int NumeroVersion { get; set; }          // For versioning
    public bool EstConfidentiel { get; set; }       // Access control
    public string HashSHA256 { get; set; }          // File integrity
    public Guid UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; }
    public Dossier Dossier { get; set; }
}
```

### Patterns DocumentService

- **Stockage**: Fichiers en `/uploads/year/month/` (configurable `FileStorage:BasePath`)
- **Validations**: 
  - MaxFileSize par défaut 50MB (configurable en `appsettings.json`)
  - MIME types whitelist: PDF, images seulement
  - SHA256 pour intégrité fichier et détection doublons
- **Confidentialité**: `EstConfidentiel=true` → Accès via service seulement, jamais endpoint public
- **Versioning**: `NumeroVersion` pour amendments/corrections
- **Audit**: Upload/Delete toujours tracé dans `AuditLog` avec UserId

### Workflow Upload Document

```csharp
// Dans DocumentService.UploadAsync()
public async Task<DocumentDto> UploadAsync(IFormFile file, Guid dossierId, string typeDocument, Guid userId)
{
    // 1. Validation
    ValidateFile(file); // Size, MIME type
    
    // 2. Calcul SHA256 pour intégrité
    var hash = CalculateSHA256(file);
    
    // 3. Stockage disque
    var relativePath = $"uploads/{DateTime.Now.Year}/{DateTime.Now.Month}/{Guid.NewGuid()}_{file.FileName}";
    await SaveFileAsync(file, relativePath);
    
    // 4. Entity + Audit
    var document = new Document { ... };
    await _documentRepository.AddAsync(document);
    await _auditLogRepository.LogActionAsync(userId, "UPLOAD", "Document", document.Id.ToString(), ...);
    
    return _mapper.Map<DocumentDto>(document);
}
```

---

## Frontend Patterns (React/TypeScript)

### Structure du Projet

```
sigac-frontend/src/
├── api/              # API client classes (typés, avec Bearer token)
│   └── dossierApi.ts # Singleton pattern, gestion erreurs 401
├── hooks/            # Custom React hooks
│   ├── useDossiers.ts        # Fetch + cache + pagination
│   ├── useAuth.ts            # Auth store + token refresh
│   └── usePagination.ts      # Pagination logic réutilisable
├── store/            # Global state (Zustand recommended)
│   ├── authStore.ts          # JWT + user info
│   └── dossierStore.ts       # Dossiers cache + filters
├── types/            # TypeScript interfaces
│   ├── dossier.ts            # Mirror les DTOs backend
│   └── auth.ts
├── utils/            # Helpers
│   ├── api-client.ts         # Fetch wrapper avec Bearer + refresh
│   ├── format.ts             # Format dates, statuts
│   └── validation.ts
├── components/
│   ├── auth/         # LoginForm, ChangePassword
│   ├── dossiers/     # DossierList, DossierDetail, DossierForm
│   ├── common/       # Button, Modal, Loading, ErrorBoundary
│   └── layout/       # Header, Sidebar, Footer, ProtectedRoute
├── pages/            # Route components
└── App.tsx           # Routes setup + theme provider
```

### API Client Pattern

```typescript
// src/api/dossierApi.ts
export class DossierApi {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  async getDossiers(page: number, pageSize: number, filters?: DossierFilters) {
    const response = await this.fetchWithAuth(
      `${this.baseUrl}/dossiers?page=${page}&pageSize=${pageSize}`,
      { 
        method: 'GET',
        headers: this.getHeaders()
      }
    );
    return response.json() as Promise<PaginatedResult<DossierListDto>>;
  }
  
  private async fetchWithAuth(url: string, options: RequestInit) {
    const token = localStorage.getItem('token');
    if (!token) throw new UnauthorizedError();
    
    const response = await fetch(url, {
      ...options,
      headers: { ...options.headers, 'Authorization': `Bearer ${token}` }
    });
    
    // Auto-refresh si 401
    if (response.status === 401) {
      await this.refreshToken();
      return fetch(url, options); // Retry
    }
    
    return response;
  }
  
  private async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
  }
}
```

### Global Store Pattern (Zustand)

```typescript
// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: UserDto | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, user: UserDto) => void;
  logout: () => void;
  setUser: (user: UserDto) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: (token, refreshToken, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },
  
  setUser: (user) => set({ user })
}));
```

### Conventions Frontend

- **DTOs**: Créer `src/types/*.ts` exactement matching DTOs C# (noms camelCase côté frontend)
- **API Calls**: Via classe DossierApi singleton, jamais fetch() direct dans components
- **State Management**: Zustand pour auth + dossiers, pas de Context drilling
- **Components**: Functional + hooks seulement (no class components)
- **Error Handling**: Try/catch avec toast notifications (react-toastify ou similaire)
- **Loading States**: Loading skeleton ou spinner pendant requêtes
- **TypeScript**: Strict mode toujours (`tsconfig.json` → `strict: true`)

### Hook Custom Example

```typescript
// src/hooks/useDossiers.ts
export function useDossiers(page: number = 1, pageSize: number = 10, filters?: DossierFilters) {
  const [dossiers, setDossiers] = useState<DossierListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  
  const api = useMemo(() => new DossierApi(), []);
  
  useEffect(() => {
    setLoading(true);
    api.getDossiers(page, pageSize, filters)
      .then(result => {
        setDossiers(result.data);
        setPagination(result.pagination);
        setError(null);
      })
      .catch((error) => {
        setError(error.message);
        if (error instanceof UnauthorizedError) {
          // Redirect to login
          window.location.href = '/login';
        }
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, filters, api]);
  
  return { dossiers, loading, error, pagination };
}
```

---

## Test & Debugging

### Backend Debugging

```bash
# 1. Breakpoints en VS Code
# Fichier: .vscode/launch.json (configuré pour C#)
# F5 pour démarrer debugger
# Breakpoints dans SIGAC.API/Controllers/ et Services/

# 2. Logs en développement
# Niveau: Information par défaut
# Fichier: sigac-backend/logs/sigac-YYYY-MM-DD.txt (rolling daily)
# Modifier log level en appsettings.json: Serilog → MinimumLevel

# 3. Inspection DB pendant debug
# Tool: DBeaver ou pgAdmin
# Connection: postgres://sigac_user:SecurePassword2024!@localhost:5432/sigac_db
```

### Test d'une API (Swagger)

```bash
# 1. Ouvrir Swagger
# http://localhost:5000/swagger

# 2. Login d'abord
# POST /api/auth/login
# Body: {"username":"juge.mbala","password":"Juge@2024!"}
# Récupère: { "token": "eyJhbG...", "refreshToken": "..." }

# 3. Authoriser Swagger avec Bearer token
# Cliquer "Authorize" → Entrer "Bearer eyJhbG..." → Authorize

# 4. Tester les endpoints
# Try out → Execute
```

### Unit Tests Structure

À implémenter en `SIGAC.Tests/Unit/`:

```csharp
// SIGAC.Tests/Unit/Services/DossierServiceTests.cs
[TestFixture]
public class DossierServiceTests
{
    private Mock<IDossierRepository> _dossierRepositoryMock;
    private Mock<IMapper> _mapperMock;
    private DossierService _service;
    
    [SetUp]
    public void Setup()
    {
        _dossierRepositoryMock = new Mock<IDossierRepository>();
        _mapperMock = new Mock<IMapper>();
        _service = new DossierService(_dossierRepositoryMock.Object, ..., _mapperMock.Object);
    }
    
    [Test]
    public async Task CreateDossierAsync_ValidInput_ReturnsDossierDto()
    {
        // Arrange
        var createDto = new CreateDossierDto { ... };
        var userId = Guid.NewGuid();
        
        // Act
        var result = await _service.CreateDossierAsync(createDto, userId);
        
        // Assert
        Assert.IsNotNull(result);
        _dossierRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }
    
    [Test]
    public async Task ChangerStatutAsync_InvalidTransition_ThrowsException()
    {
        // Transition invalide
        Assert.ThrowsAsync<ArgumentException>(
            () => _service.ChangerStatutAsync(dossierId, StatusDossier.Juge, null, userId, userRole)
        );
    }
}
```

### Checklist: Déboguer une Erreur

1. **Backend Error**: Vérifier `sigac-backend/logs/sigac-*.txt` pour stack trace
2. **403 Forbidden**: Vérifier `userRole` + filtres RBAC en Service
3. **404 NotFound**: `.Include()` manquant en Repository ?
4. **500 InternalServerError**: RequestId en réponse → chercher dans logs
5. **401 Unauthorized**: JWT expiré ? Refresh token valide ?
6. **Database Lock**: Redémarrer PostgreSQL: `docker-compose restart postgres`
7. **Migration Failed**: Check `SIGAC.Infrastructure/Data/Migrations/` - migration incomplète ?

---

## Anti-Patterns à Éviter

❌ **Ne pas faire**:
- Exposer Entity directement en API response
- Bypasser service → repository
- Validation seulement côté client
- Mutations sans historique/audit
- `new()` services au lieu d'injection DI
- Mixin logique métier dans controllers
- Ignorer `userRole` en filtrant données
- Secrets/passwords en logs

✅ **Faire à la place**:
- Utiliser DTOs + AutoMapper
- Respecter chain Service → Repo → DbContext
- Validation métier dans Services
- Tracer chaque mutation (Historique + Audit)
- Tout via DI container (Program.cs)
- Métier en Services, API in Controllers
- Appliquer RBAC systematiquement
- Log data non-sensibles seulement

---

## Configuration appsettings.json

```json
{
  "Jwt": {
    "SecretKey": "VotreCleSecreteJWTDoitFaireAuMoins256BitsChangezLaEnProduction123456",
    "Issuer": "SIGAC.CourConstitutionnelle.RDC",
    "Audience": "SIGAC.Client",
    "ExpirationMinutes": 30,
    "RefreshTokenExpirationDays": 7
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173", "https://sigac.courconstitutionnelle.cd"]
  },
  "FileStorage": {
    "BasePath": "./uploads",
    "MaxFileSize": 52428800
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=sigac_db;Username=sigac_user;Password=SecurePassword2024!"
  },
  "Serilog": {
    "MinimumLevel": "Information",
    "WriteTo": [
      { "Name": "Console" },
      { "Name": "File", "Args": { "path": "logs/sigac-.txt", "rollingInterval": "Day" } }
    ]
  }
}
```

---

## Rôles Utilisateurs Étendus

Au-delà des 3 rôles principaux en `SIGAC.Core/Enums/UserRole.cs`:
- `Admin`: Accès système complet
- `President`: Gestion globale des dossiers
- `JugeConstitutionnel`: Accès en lecture/écriture dossiers assignés seulement
- `Greffier`: Gestion administrative des dossiers (optionnel)
- `GreffierAdjoint`: Support du greffier (optionnel)
- `Consultant`: Accès en lecture sur dossiers assignés (optionnel)

**Chaque service reçoit userId + userRole et applique filtrage automatique.**

---

## Historique vs AuditLog

### Historique (Métier - Visible en UI)

- Timeline du dossier visible aux utilisateurs
- Traçabilité métier avec commentaires lisibles
- Exemples: "Dépôt", "Attribution Rapporteur", "Changement de statut"

### AuditLog (Conformité - Admin View)

- Trace complète pour conformité, jamais supprimée
- Old/New values en JSON pour comparaisons avant/après
- Capture IP, UserAgent pour analyse sécurité
- Exemples: "CREATE", "UPDATE", "DELETE", "LOGIN_SUCCESS"

---

## Données de Test - DbInitializer

`SIGAC.Tests/Integration/DbInitializer.cs` popule la base en développement avec:

**Utilisateurs de Test**:
```
admin / Admin@2024! → Admin
president.benoit / President@2024! → President
juge.mbala / Juge@2024! → JugeConstitutionnel
juge.tshisekedi / Juge@2024! → JugeConstitutionnel
juge.kabongo / Juge@2024! → JugeConstitutionnel
```

**Dossiers de Test**: 5 dossiers exemples avec workflow complet et historiques associés.

---

## Ressources Clés

- **Swagger API Docs**: http://localhost:5000/swagger (Bearer token authentification)
- **Logs Backend**: `sigac-backend/logs/sigac-YYYY-MM-DD.txt` (rolling daily, Serilog)
- **Database**: `postgres://sigac_user:SecurePassword2024!@localhost:5432/sigac_db`
- **JWT Token**: Validité 30 min, refresh token 7 jours
- **File Storage**: `/uploads/YYYY/MM/` structure, 50MB limit par fichier

---

## Gotchas & Pièges Communs

**Backend**:
- Forget userId/userRole → Tous les services métier doivent pour RBAC
- Include() manquants → N+1 queries, toujours eager load
- Mutations sans Historique → Chaque Update/Delete doit ajouter traces
- JWT Secret trop court → Doit faire au moins 256 bits (32+ caractères)

**Frontend**:
- Token not persisted → LocalStorage doit survivre reload
- API Client initialized on every render → Singleton pattern
- Missing Bearer token → Tous les appels authentifiés
- 401 Interceptor non implémenté → Sans auto-refresh, logout sur JWT expiré

**Database**:
- Foreign key constraint failed → Check OnDelete behavior
- Unique constraint violation → NumeroDossier, Username, Email uniques
- Connection timeout → PostgreSQL running ?

