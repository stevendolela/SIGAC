# 🎯 SOLUTION SIMPLE - Migration via PostgreSQL Console

## ❌ Problème Identifié

Le Shell Render n'a pas `dotnet ef` installé globalement, donc la commande échoue.

## ✅ SOLUTION : Utiliser PostgreSQL Console

### Option 1️⃣ : Via Dashboard Render (RECOMMANDÉ)

1. **Aller sur Render Dashboard**
   - https://dashboard.render.com/

2. **Sélectionner la BASE DE DONNÉES** (pas l'API)
   - Chercher votre base PostgreSQL
   - Cliquer dessus

3. **Ouvrir "Connect" → "External Connection"**
   - Copier l'URL de connexion PSQL
   - Format: `psql postgres://username:password@host/database`

4. **Cliquer sur "Console" ou "psql"**
   - Un terminal PostgreSQL s'ouvre directement

5. **Copier-coller ce SQL** :

```sql
-- Migration: AddBase64LogoAndAvatar

ALTER TABLE "Workspaces" ADD COLUMN IF NOT EXISTS "LogoBase64" text;

ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "AvatarBase64" text;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251217133725_AddBase64LogoAndAvatar', '8.0.8')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Vérification
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('Workspaces', 'Users') 
  AND column_name IN ('LogoBase64', 'AvatarBase64')
ORDER BY table_name, column_name;
```

6. **Appuyer sur Entrée**

7. **Vérifier le résultat** :
   ```
   table_name | column_name  | data_type
   -----------|--------------|----------
   Users      | AvatarBase64 | text
   Workspaces | LogoBase64   | text
   ```

---

### Option 2️⃣ : Via psql Local (si vous avez PostgreSQL)

Si vous avez `psql` installé localement :

1. **Récupérer l'URL de connexion**
   - Render Dashboard → Database → Connect → External Connection
   - Copier la commande PSQL

2. **Se connecter** :
   ```bash
   psql postgres://user:pass@host/dbname
   ```

3. **Exécuter le fichier SQL** :
   ```sql
   \i /Users/steve/Projects/SIGAC/migration-base64.sql
   ```

   Ou copier-coller le contenu SQL directement.

---

### Option 3️⃣ : Via DBeaver / pgAdmin

Si vous utilisez un client PostgreSQL graphique :

1. Créer une nouvelle connexion avec les credentials Render
2. Ouvrir un éditeur SQL
3. Copier-coller le contenu de `migration-base64.sql`
4. Exécuter

---

## 🔍 Vérification Post-Migration

Dans psql ou la console Render :

```sql
-- Vérifier que les colonnes existent
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Workspaces' AND column_name = 'LogoBase64';

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Users' AND column_name = 'AvatarBase64';

-- Vérifier l'historique des migrations
SELECT "MigrationId" 
FROM "__EFMigrationsHistory" 
WHERE "MigrationId" LIKE '%Base64%';
```

Résultat attendu :
```
 column_name  
--------------
 LogoBase64
 
 column_name  
--------------
 AvatarBase64
 
 MigrationId
------------------------------------
 20251217133725_AddBase64LogoAndAvatar
```

---

## ✅ Test Final

Redémarrer l'API Render (si nécessaire) :
- Dashboard → sigac-api → Manual Deploy → Deploy latest commit

Puis tester :
```bash
curl https://sigac-api.onrender.com/api/health
```

---

## 📝 Fichiers Créés

- `migration-base64.sql` : Script SQL complet
- `MIGRATION_SQL_SIMPLE.md` : Ce guide

---

## 💡 Pourquoi cette méthode ?

Render ne fournit pas `dotnet ef` dans le Shell de l'API, mais vous avez un accès direct à PostgreSQL via la console de la base de données. C'est plus simple et plus rapide !

---

## 🆘 En Cas de Problème

**Erreur "column already exists"** :
- Normal si déjà appliqué, ignorer

**Erreur "permission denied"** :
- Utiliser le compte admin de la base (credentials Render)

**Erreur "relation does not exist"** :
- Vérifier que vous êtes connecté à la bonne base de données
- Vérifier que les tables Workspaces et Users existent

---

✨ **Cette méthode est plus simple et évite les problèmes de dotnet ef !**
