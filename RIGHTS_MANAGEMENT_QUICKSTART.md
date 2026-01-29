# 🚀 Quick Start - Gestion des Droits d'Accès

## En 3 commandes

```bash
# 1. Appliquer la migration (depuis sigac-backend/)
dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API

# 2. Lancer le backend
dotnet run --project SIGAC.API

# 3. Lancer le frontend (dans un nouveau terminal depuis sigac-frontend/)
npm run dev
```

## Accès Immédiat

| Composant | URL | Authentification |
|-----------|-----|-----------------|
| **API Swagger** | http://localhost:5210/swagger | Admin: admin / Admin@2024! |
| **Frontend Admin** | http://localhost:5174/admin/rights | Admin: admin / Admin@2024! |
| **PostgreSQL** | localhost:5434 | sigac_user / SecurePassword2024! |

## Endpoints Clés

```bash
# Récupérer la matrice complète des permissions
curl -X GET http://localhost:5210/api/role-permissions/matrix \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Mettre à jour une permission
curl -X PUT http://localhost:5210/api/role-permissions/roles/Manager/modules/dossiers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hasAccess": true,
    "canCreate": true,
    "canUpdate": true,
    "canDelete": false,
    "canExport": true
  }'

# Initialiser les permissions par défaut
curl -X POST http://localhost:5210/api/role-permissions/initialize-defaults \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Exporter la matrice
curl -X GET http://localhost:5210/api/role-permissions/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" > permissions-backup.json

# Importer la matrice
curl -X POST http://localhost:5210/api/role-permissions/import \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @permissions-backup.json
```

## Structure des Permissions

```json
{
  "matrix": {
    "dossiers": {
      "Admin": {
        "hasAccess": true,
        "canCreate": true,
        "canUpdate": true,
        "canDelete": true,
        "canExport": true
      },
      "Manager": {
        "hasAccess": true,
        "canCreate": true,
        "canUpdate": true,
        "canDelete": true,
        "canExport": true
      },
      "Collaborateur": {
        "hasAccess": true,
        "canCreate": true,
        "canUpdate": true,
        "canDelete": false,
        "canExport": true
      }
    }
  }
}
```

## Modules Disponibles

- `dashboard` - Tableau de bord
- `dossiers` - Gestion des dossiers
- `documents` - Base documentaire
- `courriers` - Flux de courriers
- `evenements` - Événements et audiences
- `formations` - Formations
- `equipe` - Profils d'équipe
- `chat` - Messagerie
- `admin` - Administration système

## Rôles Disponibles

- `Admin` - Administrateur système
- `Manager` - Manager/Directeur
- `Collaborateur` - Collaborateur principal
- `Assistant` - Assistant
- `AssistantJunior` - Assistant Junior
- `Consultant` - Consultant externe

## Fichiers Clés

| Fichier | Description |
|---------|------------|
| `SIGAC.Core/Entities/RoleModulePermission.cs` | Modèle de données |
| `SIGAC.Core/Services/RoleModulePermissionService.cs` | Logique métier |
| `SIGAC.API/Controllers/RolePermissionsController.cs` | API REST |
| `sigac-frontend/src/api/rolePermissionsApi.ts` | Client API |
| `sigac-frontend/src/pages/RightsManagementPage.tsx` | Interface Admin |
| `SIGAC.Infrastructure/Migrations/AddRoleModulePermissionsTable.cs` | Migration DB |

## Vérifications de Santé

```bash
# Vérifier que la table est créée
docker exec sigac-postgres psql -U sigac_user -d sigac_db -c "SELECT * FROM \"RoleModulePermissions\" LIMIT 1;"

# Vérifier les permissions par défaut
curl -X GET http://localhost:5210/api/role-permissions/matrix \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.matrix'

# Vérifier un rôle spécifique
curl -X GET http://localhost:5210/api/role-permissions/roles/Manager \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.[] | {moduleKey, hasAccess}'
```

## Intégration dans Services Métier

```csharp
// Exemple dans DossierService.cs
public async Task<PaginatedResult<DossierListDto>> GetDossiersAsync(
    int page, int pageSize, string? search,
    Guid userId, UserRole userRole)
{
    // Vérifier l'accès au module
    var hasAccess = await _rolePermissionService.HasAccessAsync(userRole, "dossiers");
    if (!hasAccess)
        throw new UnauthorizedAccessException("Accès au module dossiers refusé");

    // Vérifier la permission de création
    var canCreate = await _rolePermissionService.CanPerformActionAsync(userRole, "dossiers", "create");
    
    // Continuer avec la logique métier...
    var (dossiers, totalCount) = await _dossierRepository.GetDossiersAsync(
        page, pageSize, search, ...);
    
    return new PaginatedResult<DossierListDto> { ... };
}
```

## Troubleshooting

### Migration échoue
```bash
# Vérifier la connexion DB
docker-compose logs postgres

# Réinitialiser la base (ATTENTION: données perdues)
dotnet ef database drop --project SIGAC.Infrastructure --startup-project SIGAC.API
dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API
```

### Frontend ne charge pas les permissions
```bash
# Vérifier la console du navigateur (F12)
# Vérifier que le token JWT est présent
# Vérifier que l'utilisateur est Admin
# Consulter http://localhost:5210/swagger pour tester l'API
```

### L'entité n'existe pas
```bash
# Vérifier que la migration a été appliquée
dotnet ef migrations list --project SIGAC.Infrastructure --startup-project SIGAC.API

# Appliquer les migrations en attente
dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API
```

## Documentation Complète

Voir `RIGHTS_MANAGEMENT_IMPLEMENTATION.md` pour la documentation technique détaillée.

---

**Prêt à déployer?** → Exécuter: `deploy-rights-management.ps1` (Windows) ou `deploy-rights-management.sh` (Linux/Mac)
