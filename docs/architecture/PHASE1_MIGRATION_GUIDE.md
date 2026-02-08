# 🗄️ PHASE 1 - Étape Suivante: Créer la Migration EF Core

**Statut**: ✅ Entités créées et DbContext adapté  
**Prochaine étape**: Créer migration EF Core et tester

---

## ✅ Ce Qui a Été Fait

### Fichiers Créés (4 entités)

```
✅ SIGAC.Core/Entities/Tenant.cs
✅ SIGAC.Core/Entities/TenantUser.cs
✅ SIGAC.Core/Entities/TenantSubscription.cs
✅ SIGAC.Core/Entities/TenantUsageEvent.cs
```

### Fichiers Adaptés (3 entités)

```
✅ SIGAC.Core/Entities/Workspace.cs
   └─ Ajouté: Guid TenantId + relation Tenant

✅ SIGAC.Core/Entities/WorkspaceUser.cs
   └─ Changé: UserId → TenantUserId
   └─ Changé: User → TenantUser

✅ SIGAC.Core/Entities/AuditLog.cs
   └─ Ajouté: Guid TenantId
   └─ Changé: UserId → TenantUserId
   └─ Changé: User → TenantUser
```

### DbContext Mise à Jour

```
✅ SIGAC.Infrastructure/Data/ApplicationDbContext.cs
   └─ Ajouté: 4 nouveaux DbSets (Tenant, TenantUser, etc.)
   └─ Ajouté: Configurations complètes OnModelCreating
   └─ Adapté: Relations existantes
```

---

## 🚀 MAINTENANT: Créer la Migration

### Étape 1: Vérifier la Compilation

D'abord, assure-toi que tout compile sans erreur:

```bash
cd sigac-backend

# Clean
dotnet clean

# Restore
dotnet restore

# Build pour vérifier
dotnet build
```

**Résultat attendu**: ✅ Build succeeded

---

### Étape 2: Créer la Migration EF Core

Si la compilation est OK, crée la migration:

```bash
# Terminal PowerShell dans sigac-backend/

dotnet ef migrations add AddTenantMultiTenancy `
    --project SIGAC.Infrastructure `
    --startup-project SIGAC.API
```

**Résultat attendu**:
```
Successfully added migration 'AddTenantMultiTenancy'.
```

Cela crée un fichier dans:
```
SIGAC.Infrastructure/Data/Migrations/[timestamp]_AddTenantMultiTenancy.cs
```

---

### Étape 3: Vérifier la Migration Générée

Ouvre le fichier migration et vérifie:

```csharp
// Doit contenir (exemple):
migrationBuilder.CreateTable(
    name: "Tenants",
    columns: table => new
    {
        Id = table.Column<Guid>(type: "uuid", nullable: false),
        Name = table.Column<string>(type: "text", nullable: false),
        // ... autres colonnes
    });
```

**À vérifier**:
- ✅ Tables créées: Tenants, TenantUsers, TenantSubscriptions, TenantUsageEvents
- ✅ Colonnes ajoutées: TenantId dans Workspaces, AuditLog
- ✅ Colonnes supprimées: UserId → TenantUserId dans WorkspaceUsers, AuditLog
- ✅ Foreign keys configurées correctement

---

### Étape 4: Appliquer la Migration sur le Développement

```bash
dotnet ef database update `
    --project SIGAC.Infrastructure `
    --startup-project SIGAC.API
```

**Résultat attendu**:
```
Done. 0 error(s), 0 warning(s).
Applying migration...
```

---

### Étape 5: Vérifier PostgreSQL

Connecte-toi au DB et vérifie les tables:

```bash
# Depuis Terminal PowerShell
$env:PGPASSWORD="SignacPassword2024"
psql -U sigac_admin -d sigac_db -h localhost -p 5432 -c "\dt"
```

Ou utilise un client GUI (DBeaver, pgAdmin):

```sql
-- Vérifier les nouvelles tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Vérifier colonnes Tenant dans Workspaces
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'Workspaces';
```

**Attendu**:
```
✅ tenants
✅ TenantUsers
✅ TenantSubscriptions
✅ TenantUsageEvents
✅ Workspaces (colonne TenantId ajoutée)
✅ WorkspaceUsers (colonne TenantUserId remplacée UserId)
✅ AuditLog (colonne TenantId ajoutée)
```

---

## ⚠️ Si Erreurs de Compilation

### Erreur: "Tenant does not exist"

**Cause**: Les Entities référencent Tenant mais Assembly ne les trouve pas.

**Solution**:
```csharp
// Ajoute "using SIGAC.Core.Entities;" en haut de Workspace.cs, etc.
using SIGAC.Core.Entities;
```

### Erreur: "WorkspaceUser.TenantUserId - no backing field"

**Cause**: WorkspaceUser utilise TenantUserId mais l'ancien UserId existe encore.

**Solution**: Vérifier la migration générée - EF doit SUPPRIMER UserId et AJOUTER TenantUserId.

### Erreur: "Column 'TenantId' does not allow nulls"

**Cause**: Workspaces existants n'ont pas TenantId.

**Solution**: 
1. Créer un Tenant "default" dans la migration
2. Assigner tous les Workspaces orphelins au default Tenant
3. Voir Étape 6 ci-dessous

---

## 📝 ÉTAPE 6: Migration des Données (Workspaces Existants)

Une fois la migration appliquée, les Workspaces existants sont orphelins (TenantId = null).

Crée une migration SQL pour les migrer:

**Fichier**: `sigac-backend/SIGAC.Infrastructure/Data/Migrations/[timestamp]_SeedDefaultTenant.cs`

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // 1. Créer Tenant "default"
    var defaultTenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    migrationBuilder.InsertData(
        table: "Tenants",
        columns: new[] { "Id", "Name", "Slug", "ContactEmail", "Plan", "MaxUsers", "MaxStorageGB", "IsActive", "CreatedAt" },
        values: new object[] { defaultTenantId, "Default Tenant (Legacy)", "default", "admin@example.com", 2, 100, 1000, true, DateTime.UtcNow }
    );
    
    // 2. Assigner tous les Workspaces au Tenant default
    migrationBuilder.Sql(
        $"UPDATE \"Workspaces\" SET \"TenantId\" = '{defaultTenantId}' WHERE \"TenantId\" IS NULL;"
    );
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    // Reverse
}
```

Puis applique:
```bash
dotnet ef database update
```

---

## 🧪 Test d'Intégrité Post-Migration

Crée un test simple pour vérifier l'isolation:

**Fichier**: `sigac-backend/SIGAC.Tests/Integration/MultiTenantIsolationTests.cs`

```csharp
[TestFixture]
public class MultiTenantIsolationTests
{
    private ApplicationDbContext _context;
    
    [SetUp]
    public void Setup()
    {
        // Setup DbContext en mémoire ou BD test
        _context = new ApplicationDbContext(/* options */);
    }
    
    [Test]
    public async Task TenantUsers_ShouldOnlyBelongToTheirTenant()
    {
        // AAA
        var tenant1 = new Tenant { Id = Guid.NewGuid(), Name = "Tenant 1", /* ... */ };
        var tenant2 = new Tenant { Id = Guid.NewGuid(), Name = "Tenant 2", /* ... */ };
        
        var user1 = new TenantUser { TenantId = tenant1.Id, Email = "user@tenant1.com", /* ... */ };
        var user2 = new TenantUser { TenantId = tenant2.Id, Email = "user@tenant2.com", /* ... */ };
        
        _context.Tenants.AddRange(tenant1, tenant2);
        _context.TenantUsers.AddRange(user1, user2);
        await _context.SaveChangesAsync();
        
        // Act
        var tenant1Users = _context.TenantUsers.Where(u => u.TenantId == tenant1.Id).ToList();
        var tenant2Users = _context.TenantUsers.Where(u => u.TenantId == tenant2.Id).ToList();
        
        // Assert
        Assert.AreEqual(1, tenant1Users.Count);
        Assert.AreEqual(1, tenant2Users.Count);
        Assert.AreEqual(user1.Id, tenant1Users[0].Id);
        Assert.AreEqual(user2.Id, tenant2Users[0].Id);
    }
}
```

---

## ✅ Checklist Post-Migration

- [ ] Build réussit sans erreur
- [ ] Migration créée avec succès
- [ ] Migration appliquée à la BD
- [ ] Tables visible dans PostgreSQL
- [ ] Colonnes TenantId présentes dans Workspaces
- [ ] Colonnes TenantUserId présentes dans WorkspaceUsers
- [ ] Tenant default créé et assigné aux Workspaces legacy
- [ ] Tests d'isolation passent
- [ ] Aucun warning compilation

---

## 🎯 Prochaines Étapes (Phase 2)

Une fois la migration validée:

1. **Créer TenantRepository**: Interface + Implémentation
2. **Créer TenantService**: CRUD + ProvisionTenant
3. **Créer AdminDashboardService**: Monitoring multi-tenant
4. **Adapter DossierService**: Ajouter tenantId en signature
5. **Tests intégration**: Vérifier RBAC + isolation

---

## 💾 Commandes Utiles (Référence)

```bash
# Voir les migrations appliquées
dotnet ef migrations list --project SIGAC.Infrastructure --startup-project SIGAC.API

# Revert dernière migration (si problème)
dotnet ef database update [previous-migration-name] --project SIGAC.Infrastructure

# Supprimer BD et recommencer
dotnet ef database drop --force --project SIGAC.Infrastructure --startup-project SIGAC.API
dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API

# Générer SQL script (sans appliquer)
dotnet ef migrations script --project SIGAC.Infrastructure --startup-project SIGAC.API > migration.sql
```

---

**À TOI DE JOUER!** 🚀

Exécute les étapes 1-4 ci-dessus et dis-moi si tout compile et la migration s'applique correctement.
