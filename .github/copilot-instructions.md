# SIGAC (Taajii) - Instructions pour les Agents IA

## Architecture Générale

SIGAC/Taajii est une plateforme moderne de gestion électronique des documents (GED) et des workflows métiers, adaptable à tous les secteurs d'activité. Architecture 3-tier moderne:

- **Backend** (.NET 8, C#): API REST avec Entity Framework Core + PostgreSQL
  - `SIGAC.API`: Contrôleurs, middleware, configuration startup
  - `SIGAC.Core`: DTOs, Entities, Services métier, Interfaces, Enums
  - `SIGAC.Infrastructure`: DbContext, Repositories, Migrations EF Core
- **Frontend** (React 18, TypeScript, Vite): SPA avec hooks customs, store global, API client
- **Database**: PostgreSQL 15 avec migrations EF Core managées
- **Production**: Déployé sur **Vercel** (frontend) + **Render** (backend + PostgreSQL)

### URLs Clés

**Production Live**:
- Frontend: https://taajii.fr
- Backend API: https://sigac-api.onrender.com/api
- Swagger: https://sigac-api.onrender.com/swagger

**Développement Local**:
- Frontend: http://localhost:5174 (Vite dev server)
- Backend API: http://localhost:5210 (Kestrel)
- Swagger: http://localhost:5210/swagger
- PostgreSQL: localhost:5434 (mappé sur 5432 dans conteneur)

### Flux de Données Clés

1. **Requêtes authentifiées**: Client → Bearer JWT → Controller → Service → Repository → DbContext
2. **Audit complet**: Tous les CRUD enregistrés dans `AuditLog` (IP, user, timestamp, old/new values)
3. **Historiques métier**: Chaque action sur Dossier ajoute une entrée `Historique` (traçabilité complète)
4. **Pagination standardisée**: `PaginatedResult<T>` avec `PaginationMetadata` (page, pageSize, totalItems, totalPages)

---

## Fonctionnalités Principales

### 1. Gestion des Dossiers/Projets (Core Feature)
Le système central de SIGAC - gestion complète du cycle de vie des dossiers métiers (adaptable à tout secteur):
- **Entities**: `Dossier`, `Document`, `Historique`, `TypeAffaire`
- **Workflow configurable**: Nouveau → EnCours → Validé → Terminé → Archivé (personnalisable)
- **RBAC**: Contrôle d'accès granulaire selon les rôles
- **Audit**: Historique métier + AuditLog système
- **Cas d'usage multi-secteurs**: 
  - Juridique: Affaires constitutionnelles, contentieux, contrats
  - Santé: Dossiers patients, consultations
  - Entreprise: Projets, contrats clients, devis
  - Administration: Demandes citoyennes, procédures administratives

### 2. Workspaces (Multi-tenancy)
Organisation multi-tenant permettant de gérer plusieurs organisations/entités:
- **Entity**: `Workspace` avec `Members` (via `WorkspaceUser`)
- **Features**: Slug URL, quotas (MaxStorageGB, MaxUsers), logo Base64, branding personnalisé
- **Roles**: Owner > Admin > Member > Guest (enum `WorkspaceRole`)
- **Isolation**: Données complètement séparées par workspace
- **Cas d'usage**: Cabinet avec plusieurs clients, groupe d'entreprises, administrations multi-services
- **Soft Delete**: `IsActive` pour archivage

### 3. Chat Système (Collaboration)
Chat intégré 1-to-1 et groupes pour collaboration en temps réel:
- **Entities**: 
  - `ChatConversation` + `Message`: Chat 1-to-1 entre deux utilisateurs
  - `ChatGroup` + `ChatGroupMember` + `GroupMessage`: Chat de groupe
- **UI**: `UnifiedChatPanel` avec onglets (Conversations/Groupes)
- **Performance**: Polling 2-3s avec checksum-based change detection
- **Unread Counts**: Badges sur conversations/groupes non lus

### 4. Audiences & Calendrier
Gestion des événements et calendrier (adaptable à tout secteur):
- **Entities**: `Audience`, `CalendarEvent`, `Salle`
- **Types configurables**: Audiences juridiques, réunions, consultations médicales, rendez-vous clients, etc.
- **Statuts**: `StatutAudience` (Planifiee, EnCours, Terminee, Reportee)
- **Cas d'usage**: Juridique (audiences), Médical (consultations), Entreprise (réunions clients)

### 5. Formations & Équipes
Gestion des équipes et collaboration:
- **Entities**: `Formation`, `FormationParticipation`
- **Link**: Équipes liées à un `Workspace` spécifique
- **Applications**: Équipes juridiques, équipes projet, équipes médicales, groupes de travail

### 6. Appels Vidéo (VideoCall) - NOUVELLE FEATURE
Intégration d'appels vidéo P2P et groupe:
- **Entities**: `VideoCall` (status: Initiating, Ringing, Connected, Ended, Rejected, Missed)
- **Types**: 1-to-1 conversations ou groupe (ChatConversation/ChatGroup)
- **UI**: `VideoCallModal`, `IncomingCallNotification`
- **Intégration**: WebRTC simulé/placeholder pour expansion future
- **Cas d'usage**: Consultations médicales, réunions juridiques, support client

### 7. Notifications (Push & In-App) - NOUVELLE FEATURE
Système de notifications complètes:
- **Entity**: `Notification` (titre, message, lien, estLue, dateLue)
- **API**: CRUD complet + GetMyNotificationsAsync avec top limit
- **Unread Badges**: Affichage des notifications non-lues en UI
- **Cas d'usage**: Alertes de dossiers, assignations, changements d'état

### 8. Import de Documents Externes - NOUVELLE FEATURE
Import batch de documents depuis sources externes (FTP, HTTP, S3):
- **Entities**: `ExternalDocumentImport` (config de source + statut du processus)
- **Service**: `ExternalDocumentImportService` + `IExternalDocumentSourceProvider` (extensible)
- **Workflow**: Récupération → Validation → Ingestion → Traçabilité
- **Validation**: SHA256 pour détection de doublons, validation MIME type
- **Cas d'usage**: Bulk import de jurisprudence, documents d'archive, dossiers patients

### 9. Gestion des Droits (Rights Management) - NOUVELLE FEATURE
Gestion granulaire des permissions par rôle et module:
- **Page**: `RightsManagementPage` (matrice permissions/rôles)
- **Modules configurables**: Dashboard, Projets, Documents, Courriers, Événements, Formations, Équipe, Chat, Admin
- **Rôles étendus**: Admin, Manager, Collaborator, Assistant, AssistantJunior, Consultant
- **Cas d'usage**: Configuration flexible des accès selon organisation/secteur

### 10. Pièce Jointe Chat (ChatAttachment) - NOUVELLE FEATURE
Support des fichiers dans le chat:
- **Entity**: `ChatAttachment` (référence Message/GroupMessage)
- **Stockage**: Même pattern que Document (SHA256, validation MIME)
- **Cas d'usage**: Partage rapide de fichiers sans créer formal Document

### 11. Courrier (Mailing) - NOUVELLE FEATURE
Gestion des flux de courriers entrants/sortants:
- **Entity**: `Courrier` (expéditeur, destinataire, statut, date)
- **Intégration**: Service d'email SMTP configurable
- **Cas d'usage**: Notification utilisateurs, communication officielle

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
    int page, int pageSize, string? search, Guid? typeAffaireId, 
    StatusDossier? status, PrioriteDossier? priorite, 
    DateTime? dateDebutMin, DateTime? dateDebutMax, 
    Guid? rapporteurId, Guid? workspaceId, Guid userId, UserRole userRole);  // ← Requis!

// Implémentation: Les collaborateurs ne voient que LEURS dossiers assignés
if (userRole == UserRole.Collaborator)
{
    filtreRapporteur = userId;  // Force le filtre au utilisateur connecté
}
// Les admins sans workspaceId voient TOUS les dossiers (y compris ceux sans workspace)
bool includeAllForAdmin = userRole == UserRole.Admin && !workspaceId.HasValue;
```

**Rôles définis** (en `SIGAC.Core/Enums/UserRole.cs`):
- `Admin`: Accès système complet, gestion de configuration
- `Manager`: Gestion globale des dossiers et équipes (cadre)
- `Collaborator`: Accès standard (agent, collaborateur)
- `Assistant`: Accès limité avec assistance
- `AssistantJunior`: Accès très limité (apprenti)
- `Consultant`: Accès en lecture seulement (externe)

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
# Note: Postgres exposé sur port 5434 (mappé sur 5432 interne)

# 2. Backend (Terminal 1)
cd sigac-backend
dotnet restore
dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API
dotnet run --project SIGAC.API
# Écoute sur http://localhost:5210 + Swagger sur http://localhost:5210/swagger

# 3. Frontend (Terminal 2)
cd sigac-frontend
npm install
npm run dev
# Écoute sur http://localhost:5174 (Vite dev server)
```

### Vérifier PostgreSQL

```bash
# Logs
docker-compose logs -f postgres

# Connecter via psql
docker exec -it sigac-postgres psql -U sigac_user -d sigac_db

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

Toujours en `SIGAC.Core/Enums/`. Patterns adaptables:
- `StatusDossier`: Workflow states personnalisables (Nouveau → EnCours → Validé → Terminé → Archivé)
- `PrioriteDossier`: Urgency (Normale, Haute, Critique)
- `TypeAffaire`: Types configurables selon le secteur métier
- `UserRole`: Access levels flexibles (Admin, Manager, Collaborateur, Consultant)

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

**Implémentation actuelle avec Axios + auto-refresh**:

```typescript
// src/api/api-client.ts - Client HTTP centralisé
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000
})

// Attach Bearer token si présent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Auto-refresh token on 401
let isRefreshing = false
let pendingRequests: Array<(token: string | null) => void> = []

async function refreshToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => pendingRequests.push(resolve))
  }
  
  isRefreshing = true
  const refreshToken = localStorage.getItem('refreshToken')
  try {
    const response = await axios.post('/api/auth/refresh', { refreshToken })
    const newToken = response.data.token
    localStorage.setItem('token', newToken)
    
    pendingRequests.forEach(cb => cb(newToken))
    return newToken
  } catch {
    localStorage.removeItem('token')
    return null
  } finally {
    isRefreshing = false
    pendingRequests = []
  }
}

api.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true
    const newToken = await refreshToken()
    if (newToken) {
      error.config.headers['Authorization'] = `Bearer ${newToken}`
      return api(error.config)
    }
  }
  return Promise.reject(error)
})

export default api
```

**Utilisation dans les API client classes**:

```typescript
// src/api/dossierApi.ts
import api from './api-client'

export class DossierApi {
  async getDossiers(page: number, pageSize: number, filters?: DossierFilters) {
    const response = await api.get(`/dossiers`, {
      params: { page, pageSize, ...filters }
    })
    return response.data as PaginatedResult<DossierListDto>
  }
  
  async createDossier(dto: CreateDossierDto) {
    const response = await api.post(`/dossiers`, dto)
    return response.data as DossierDto
  }
  
  async updateDossier(id: Guid, dto: UpdateDossierDto) {
    const response = await api.put(`/dossiers/${id}`, dto)
    return response.data as DossierDto
  }
}
```

### Global Store Pattern (Zustand)

**Implémentation actuelle**:

```typescript
// src/store/workspaceStore.ts - Store Zustand centralisé
import { create } from 'zustand'

interface WorkspaceState {
  workspaceId: Guid | null
  workspaceName: string | null
  selectedWorkspaceId: Guid | null
  setSelectedWorkspaceId: (id: Guid | null) => void
  clearWorkspace: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaceId: null,
  workspaceName: null,
  selectedWorkspaceId: localStorage.getItem('selectedWorkspaceId') 
    ? JSON.parse(localStorage.getItem('selectedWorkspaceId')!) 
    : null,
  
  setSelectedWorkspaceId: (id: Guid | null) => {
    if (id) {
      localStorage.setItem('selectedWorkspaceId', JSON.stringify(id))
    } else {
      localStorage.removeItem('selectedWorkspaceId')
    }
    set({ selectedWorkspaceId: id })
  },
  
  clearWorkspace: () => {
    localStorage.removeItem('selectedWorkspaceId')
    set({ workspaceId: null, workspaceName: null, selectedWorkspaceId: null })
  }
}))

// Utilisation dans les pages
function MyPage() {
  const { selectedWorkspaceId, setSelectedWorkspaceId } = useWorkspaceStore()
  
  useEffect(() => {
    if (selectedWorkspaceId) {
      // Charger les données du workspace
    }
  }, [selectedWorkspaceId])
}
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
# http://localhost:5210/swagger (dev) ou https://sigac-api.onrender.com/swagger (prod)

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

Les rôles en `SIGAC.Core/Enums/UserRole.cs` définissent l'accès granulaire:
- `Admin`: Accès système complet, gestion de configuration, superadmin
- `Manager`: Gestion globale des dossiers, équipes, audit (cadre)
- `Collaborator`: Accès standard (agent, collaborateur) - voir uniquement ses propres dossiers
- `Assistant`: Accès limité avec assistance 
- `AssistantJunior`: Accès très limité (apprenti)
- `Consultant`: Accès en lecture seulement (externe)

**Chaque service reçoit userId + userRole et applique filtrage automatique.** Aucun endpoint ne doit exposer plus de données que le rôle n'y donne accès.

**Note**: Les noms de rôles sont adaptables selon le secteur:
- Juridique: Judge, Clerk, Lawyer, Paralegal
- Santé: Doctor, Nurse, Admin, Technician  
- Entreprise: Manager, Employee, Consultant, Director
- Administration: Director, Officer, Supervisor, Clerk

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

## Nouvelles Services Clés à Connaître

### ExternalDocumentImportService
Importe des documents par batch depuis sources externes (FTP, HTTP, S3). Pattern:
- `IExternalDocumentSourceProvider`: Interface extensible pour ajouter de nouvelles sources
- `ExternalDocumentImportConfigDto`: Configuration de la source (credentials, filters, mappings)
- Workflow: Fetch → Validate (MIME, SHA256) → Ingest → Audit
- Évite les doublons via SHA256, crée TypeAffaire automatiquement si nécessaire
- Use: `ExternalDocumentImportController` exposes `/api/external-imports/*`

### VideoCallService
Gère les appels vidéo P2P et groupe:
- Statuts: Initiating → Ringing → Connected → Ended/Rejected/Missed
- Supporte conversations 1-to-1 et groupes (ChatConversation/ChatGroup)
- Évolution: Intégration WebRTC future (placeholder actuellement)
- Use: `VideoCallController` + `VideoCallModal`, `IncomingCallNotification` components

### NotificationService
Système de notifications utilisateur:
- CRUD: CreateAsync, GetMyNotificationsAsync (avec top limit), MarkAsReadAsync
- Champ `EstLue` + `DateLue` pour tracking
- Éviter références circulaires en sérialisant uniquement champs primitifs en audit
- Use: `NotificationsController` + unread badge UI integration

### BulkDocumentImportService & BulkImportService
Import de documents par lot:
- Validation batch, gestion des erreurs partielles
- Progress tracking pour UI feedback
- Use: `ImportController` pour workflows de bulk operations

### RightsManagementPage (Frontend)
Interface pour configurer permissions par rôle/module:
- Modules: Dashboard, Projets, Documents, Courriers, Événements, Formations, Équipe, Chat, Admin
- Rôles: Admin, Manager, Collaborator, Assistant, AssistantJunior, Consultant
- Matrice de permissions persistée (normalement via API - currently hardcoded for UI prototype)

---

- **Swagger API Docs**: http://localhost:5210/swagger (Bearer token authentification)
- **Logs Backend**: `sigac-backend/logs/sigac-YYYY-MM-DD.txt` (rolling daily, Serilog)
- **Database**: `postgres://sigac_user:SecurePassword2024!@localhost:5434/sigac_db`
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


