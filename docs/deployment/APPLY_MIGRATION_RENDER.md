# 🚀 Application de la Migration SystemSettings sur Render

## Option 1: Script Automatique (Recommandé)

Utilisez le script fourni qui gère tout automatiquement:

```bash
cd deployment
./apply-migration-render.sh
```

Le script va:
1. ✅ Vérifier que `psql` est installé
2. ✅ Vérifier que le fichier de migration existe
3. 🔑 Demander l'URL de connexion Render
4. ⚠️ Demander confirmation avant de modifier la production
5. 🔄 Appliquer la migration
6. ✅ Vérifier que la table a bien été créée

### Obtenir l'URL de connexion Render:

1. Allez sur [Render Dashboard](https://dashboard.render.com)
2. Sélectionnez votre service PostgreSQL
3. Cliquez sur "Connect" → "External Connection"
4. Copiez l'URL de connexion (format: `postgres://user:pass@host:port/db`)

**Important**: Ne partagez JAMAIS cette URL publiquement!

## Option 2: Manuellement avec psql

Si vous préférez faire manuellement:

```bash
# 1. Récupérez l'URL de connexion sur Render Dashboard

# 2. Exécutez la migration
psql "postgres://user:pass@host:port/db" < deployment/migration-system-settings.sql

# 3. Vérifiez
psql "postgres://user:pass@host:port/db" -c '\dt "SystemSettings"'
```

## Option 3: Via l'interface Render

1. Allez sur Render Dashboard
2. Ouvrez votre service PostgreSQL
3. Cliquez sur "Shell" ou "Connect"
4. Copiez le contenu de `deployment/migration-system-settings.sql`
5. Collez et exécutez dans le shell PostgreSQL

## Vérification Post-Migration

Une fois la migration appliquée:

```bash
# Vérifier que la table existe
psql "$DATABASE_URL" -c '\dt "SystemSettings"'

# Vérifier la structure
psql "$DATABASE_URL" -c '\d "SystemSettings"'
```

Devrait afficher:
```
Table "public.SystemSettings"
    Column    |           Type           | Nullable
--------------+--------------------------+----------
 Id           | uuid                     | not null
 LogoBase64   | text                     |
 CreatedAt    | timestamp with time zone | not null
 UpdatedAt    | timestamp with time zone |
 UpdatedBy    | uuid                     |
```

## Après la Migration

1. **Redémarrez le backend** (optionnel mais recommandé):
   - Render Dashboard → Votre service backend → "Manual Deploy" → "Deploy"

2. **Testez l'upload du logo**:
   - Allez sur https://taajii.fr
   - Connectez-vous en tant qu'admin
   - Menu "Système" → "Gestion du Logo"
   - Uploadez un logo (max 1MB)

3. **Vérifiez le stockage**:
   ```bash
   psql "$DATABASE_URL" -c 'SELECT "Id", LENGTH("LogoBase64"), "CreatedAt" FROM "SystemSettings";'
   ```

## Troubleshooting

### Erreur: "psql: command not found"
```bash
# Installer psql
sudo apt-get update
sudo apt-get install postgresql-client
```

### Erreur: "could not connect to server"
- Vérifiez que l'URL de connexion est correcte
- Vérifiez votre connexion internet
- Vérifiez les règles de pare-feu Render (allowlist IP si nécessaire)

### Erreur: "relation already exists"
La table existe déjà, pas besoin de la recréer!

### Erreur: "permission denied"
- Vérifiez que vous utilisez les bons credentials
- L'utilisateur doit avoir les droits CREATE TABLE

## Rollback (si nécessaire)

Si vous devez annuler la migration:

```sql
DROP TABLE IF EXISTS "SystemSettings";
```

⚠️ **ATTENTION**: Cela supprimera le logo stocké!

---

**Créé**: 21 décembre 2025  
**Fichier de migration**: `deployment/migration-system-settings.sql`  
**Script automatique**: `deployment/apply-migration-render.sh`
