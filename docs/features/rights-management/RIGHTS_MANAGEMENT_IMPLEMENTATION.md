# Gestion des Droits d'Accès - Implémentation Complète

## 📋 Vue d'ensemble

Implémentation complète d'un système de gestion granulaire des permissions d'accès par rôle utilisateur dans SIGAC/Taajii. Le système utilise une **matrice permissions/rôles** permettant une configuration flexible et fine des droits d'accès à chaque module applicatif.

## 🏗️ Architecture Implémentée

### Backend (.NET 8 C#)

#### 1. **Entité: `RoleModulePermission`** 
Représente une permission d'accès pour un rôle-module spécifique.

```csharp
public class RoleModulePermission
{
    public Guid Id { get; set; }
    public UserRole UserRole { get; set; }
    public string ModuleKey { get; set; }  // 'dossiers', 'documents', 'chat', etc.
    public string ModuleLabel { get; set; }
    public string Description { get; set; }
    
    // Permissions granulaires
    public bool HasAccess { get; set; }     // Accès au module
    public bool CanCreate { get; set; }     // Création de ressources
    public bool CanUpdate { get; set; }     // Modification
    public bool CanDelete { get; set; }     // Suppression
    public bool CanExport { get; set; }     // Export/Téléchargement
    
    public Guid? WorkspaceId { get; set; }  // Pour isolation multi-tenant
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public Guid? ConfiguredByUserId { get; set; }  // Audit
}
```

#### 2. **Repository: `IRoleModulePermissionRepository`**
Pattern standard SIGAC pour accès aux données:
- `GetByRoleAsync(role)` - Permissions pour un rôle
- `GetAsync(role, moduleKey)` - Permission spécifique
- `GetAllAsync()` - Toutes les permissions
- `AddAsync`, `UpdateAsync`, `DeleteAsync` - CRUD standard

#### 3. **Service: `IRoleModulePermissionService`**
Logique métier avec fonctionnalités clés:

```csharp
// Récupérer la matrice complète (tous les rôles x tous les modules)
Task<PermissionsMatrixDto> GetPermissionsMatrixAsync(Guid? workspaceId = null);

// Vérifications d'accès (pour les middlewares/services)
Task<bool> HasAccessAsync(UserRole role, string moduleKey, Guid? workspaceId = null);
Task<bool> CanPerformActionAsync(UserRole role, string moduleKey, string action, Guid? workspaceId = null);

// Mises à jour (admin seulement)
Task<RoleModulePermissionDto> UpdatePermissionAsync(...);
Task<List<RoleModulePermissionDto>> UpdateBatchAsync(List<(UserRole, string, UpdateRoleModulePermissionDto)> updates);

// Initialisation et backup
Task InitializeDefaultPermissionsAsync(Guid? workspaceId = null);
Task<string> ExportMatrixAsJsonAsync(Guid? workspaceId = null);
Task ImportMatrixFromJsonAsync(string json, Guid userId, Guid? workspaceId = null);
```

#### 4. **API Controller: `RolePermissionsController`**
REST endpoints pour gestion des permissions (admin only):

- `GET /api/role-permissions/matrix` - Récupérer la matrice complète
- `GET /api/role-permissions/roles/{role}` - Permissions d'un rôle
- `GET /api/role-permissions/roles/{role}/modules/{moduleKey}` - Permission spécifique
- `GET /api/role-permissions/check-access?role=Admin&moduleKey=dossiers` - Vérifier accès
- `PUT /api/role-permissions/roles/{role}/modules/{moduleKey}` - Mettre à jour
- `PUT /api/role-permissions/batch` - Mise à jour batch
- `POST /api/role-permissions/initialize-defaults` - Initialiser permissions par défaut
- `GET /api/role-permissions/export` - Exporter la matrice en JSON
- `POST /api/role-permissions/import` - Importer depuis JSON

### Frontend (React 18 + TypeScript)

#### 1. **API Client: `rolePermissionsApi.ts`**
Classe pour consommer l'API backend:

```typescript
export class RolePermissionsApi {
  async getPermissionsMatrix(workspaceId?: string): Promise<PermissionsMatrixDto>
  async updatePermission(role, moduleKey, dto, workspaceId?): Promise<RoleModulePermissionDto>
  async updateBatch(updates, workspaceId?): Promise<RoleModulePermissionDto[]>
  async exportMatrix(workspaceId?): Promise<string>
  async importMatrix(json, workspaceId?): Promise<void>
  // ... autres méthodes
}
```

#### 2. **Page: `RightsManagementPage.tsx`**
Interface d'administration complète avec:

- **Matrice visuelle** : Tableau affichant tous les rôles x modules
- **Permissions granulaires** : Toggles pour HasAccess + 4 boutons (C/U/D/E)
  - **C** (Créer) - Création en bleu
  - **U** (Modifier) - Update en violet
  - **D** (Supprimer) - Delete en rouge
  - **E** (Exporter) - Export en cyan
- **Suivi des changements** : Badge de count sur bouton "Enregistrer"
- **Import/Export** : Boutons pour backup/restore de la matrice
- **Gestion d'erreurs** : Messages d'erreur détaillés
- **Protection Admin** : Module "Admin" verrouillé pour rôle "Admin" (impossible à désactiver)

## 📊 Permissions par Défaut

Configuration intelligente des permissions selon le rôle:

| Rôle | Dashboard | Dossiers | Documents | Courriers | Formations | Admin |
|------|-----------|----------|-----------|-----------|-----------|-------|
| Admin | R/C/U/D/E | R/C/U/D/E | R/C/U/D/E | R/C/U/D/E | R/C/U/D/E | R 🔒 |
| Manager | R/C/U/D/E | R/C/U/D/E | R/C/U/D/E | R/C/U/D/E | R/C/U/D/E | ✗ |
| Collaborateur | R/C/U/D/E | R/C/U/D/E | R/C/U/D/E | R/C/U/D/E | R/C/U/D/E | ✗ |
| Assistant | R/C/U | R/C/U | R/C/U | R/C/U | ✗ | ✗ |
| AssistantJunior | R | R | R | ✗ | ✗ | ✗ |
| Consultant | R | R | ✗ | ✗ | ✗ | ✗ |

*R = Read/Access, C = Create, U = Update, D = Delete, E = Export, 🔒 = Verrouillé (non modifiable)*

## 🚀 Guide de Déploiement

### Étape 1: Appliquer la Migration EF Core

```bash
cd sigac-backend

# Créer la migration (si pas déjà créée)
dotnet ef migrations add AddRoleModulePermissionsTable \
    --project SIGAC.Infrastructure \
    --startup-project SIGAC.API

# Appliquer la migration
dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API
```

### Étape 2: Enregistrer les Services (Program.cs)

✅ Déjà effectué dans Program.cs:
```csharp
builder.Services.AddScoped<IRoleModulePermissionService, RoleModulePermissionService>();
builder.Services.AddScoped<IRoleModulePermissionRepository, RoleModulePermissionRepository>();
```

### Étape 3: Ajouter DbSet au DbContext

✅ Déjà ajouté:
```csharp
public DbSet<RoleModulePermission> RoleModulePermissions { get; set; }
```

### Étape 4: Initialiser les Permissions par Défaut

**Option A: En démarrage (recommandé)**

Ajouter dans `Program.cs` après `builder.Build()`:

```csharp
using (var scope = app.Services.CreateScope())
{
    var service = scope.ServiceProvider.GetRequiredService<IRoleModulePermissionService>();
    await service.InitializeDefaultPermissionsAsync();
    Log.Information("Permissions par défaut initialisées");
}
```

**Option B: Via API**

```bash
curl -X POST http://localhost:5210/api/role-permissions/initialize-defaults \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### Étape 5: Intégrer au Frontend

1. ✅ API client déjà créé: `rolePermissionsApi.ts`
2. ✅ Page admin déjà mise à jour: `RightsManagementPage.tsx`
3. Ajouter la page au router si nécessaire

```tsx
import RightsManagementPage from './pages/RightsManagementPage'

// Dans App.tsx
<Route path="/admin/rights" element={<RightsManagementPage />} />
```

## 🔐 Considérations de Sécurité

### 1. **Contrôle d'Accès Strict**
- API endpoints protégés par `[Authorize]` + vérification `userRole == Admin`
- Frontend: Redirection automatique si utilisateur n'est pas Admin
- Verification côté serveur systématique

### 2. **Protection du Rôle Admin**
- Module "Admin" toujours accessible au rôle "Admin"
- Impossible de désactiver via UI (button disabled)
- Validation côté serveur: `if (role == Admin && moduleKey == admin) return;`

### 3. **Audit Complet**
- Chaque modification enregistrée dans `AuditLog`
- Champ `ConfiguredByUserId` trace qui a configuré
- Timestamps: `CreatedAt`, `ModifiedAt`
- JSON diff: old/new values sérialisés

### 4. **Isolation Multi-tenant**
- Champ `WorkspaceId` optionnel
- Permissions globales si `WorkspaceId == null`
- Permissions workspace-spécifiques si `WorkspaceId` a valeur

## 📡 Intégration avec Services Métier

### Middleware de Vérification des Droits

Créer un middleware pour vérifier les droits avant chaque action:

```csharp
// Dans DossierService.cs ou service métier
var hasAccess = await _rolePermissionService.HasAccessAsync(userRole, "dossiers");
if (!hasAccess)
    throw new UnauthorizedAccessException("Accès au module 'dossiers' refusé");

var canCreate = await _rolePermissionService.CanPerformActionAsync(userRole, "dossiers", "create");
if (!canCreate && isCreatingNewDossier)
    throw new UnauthorizedAccessException("Création de dossier non autorisée");
```

## 📁 Fichiers Créés/Modifiés

### Créés
- ✅ `SIGAC.Core/Entities/RoleModulePermission.cs`
- ✅ `SIGAC.Core/DTOs/RoleModulePermissionDto.cs`
- ✅ `SIGAC.Core/Interfaces/IRoleModulePermissionRepository.cs`
- ✅ `SIGAC.Core/Interfaces/IRoleModulePermissionService.cs`
- ✅ `SIGAC.Core/Services/RoleModulePermissionService.cs`
- ✅ `SIGAC.Infrastructure/Repositories/RoleModulePermissionRepository.cs`
- ✅ `SIGAC.API/Controllers/RolePermissionsController.cs`
- ✅ `sigac-frontend/src/api/rolePermissionsApi.ts`
- ✅ `SIGAC.Infrastructure/Migrations/AddRoleModulePermissionsTable.cs`

### Modifiés
- ✅ `sigac-frontend/src/pages/RightsManagementPage.tsx` (mise à jour complète)
- ✅ `SIGAC.API/Program.cs` (enregistrement services/repos)
- ✅ `SIGAC.Infrastructure/Data/ApplicationDbContext.cs` (DbSet ajouté)

## 🧪 Tests

### Test Backend via Swagger

1. Aller à http://localhost:5210/swagger
2. Login avec compte Admin
3. Tester les endpoints RolePermissions:
   - `GET /api/role-permissions/matrix` - Affiche la matrice complète
   - `PUT /api/role-permissions/batch` - Mettre à jour plusieurs permissions

### Test Frontend

1. Aller à http://localhost:5174/admin/rights (ou route configurée)
2. Vérifier que la matrice se charge
3. Modifier quelques permissions
4. Cliquer "Enregistrer" et vérifier succès
5. Recharger la page et vérifier persistance

## 🎯 Prochaines Étapes Recommandées

1. **Intégration dans Services Métier**
   - Ajouter vérifications dans DossierService, DocumentService, etc.
   - Utiliser `CanPerformActionAsync()` avant CRUD

2. **Gestion des Rôles Additionnels**
   - Adapter les permissions par défaut selon vos secteurs d'activité
   - Étendre enum UserRole si besoin

3. **Audit Avancé**
   - Dashboard d'audit pour l'historique des changements de permissions
   - Rapports de configuration

4. **Sync Multi-tenant**
   - Tester avec plusieurs workspaces
   - Vérifier l'isolation des permissions

## 📚 Documentation de Référence

- Service métier: `RoleModulePermissionService.cs` (300+ lignes de logique)
- API Swagger: `RolePermissionsController.cs` (300+ lignes endpoints)
- Frontend: `RightsManagementPage.tsx` (250+ lignes UI)
- Model: `RoleModulePermission.cs` + `RoleModulePermissionDto.cs`

---

**Statut**: ✅ Implémentation complète et prête au déploiement
**Dernière mise à jour**: 29 janvier 2026
