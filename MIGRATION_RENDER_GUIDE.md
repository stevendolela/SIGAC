# 🔧 Guide de Migration PostgreSQL sur Render

## Problème Identifié

L'erreur dans votre capture d'écran montre que:
- ❌ Le .NET SDK n'est pas installé sur Render
- ❌ La commande `dotnet ef database update` ne fonctionne pas
- ❌ Les migrations EF Core nécessitent le SDK .NET

## ✅ Solution: Migration SQL Directe

Au lieu d'utiliser `dotnet ef`, nous allons appliquer la migration directement avec `psql` et du SQL pur.

---

## 📋 Méthode 1: Via le Shell Render (Recommandé)

### Étape 1: Accéder au Shell Render

1. Allez sur https://dashboard.render.com
2. Connectez-vous à votre compte
3. Sélectionnez votre service **`sigac-api`** (backend)
4. Dans le menu de gauche, cliquez sur **"Shell"**
5. Attendez que le shell s'ouvre (terminal violet/noir)

### Étape 2: Installer PostgreSQL Client

Dans le shell Render, exécutez:

```bash
apt-get update && apt-get install -y postgresql-client
```

Attendez que l'installation se termine (~30 secondes).

### Étape 3: Appliquer la Migration

**Option A - Via curl (le plus simple):**

```bash
curl -s https://raw.githubusercontent.com/stevendolela/SIGAC/main/migration-base64.sql | psql $DATABASE_URL
```

**Option B - Copier/Coller le SQL:**

```bash
psql $DATABASE_URL <<'EOF'
-- Migration: Ajout de la colonne LogoBase64 à la table Workspaces
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Workspaces' 
        AND column_name = 'LogoBase64'
    ) THEN
        ALTER TABLE "Workspaces" 
        ADD COLUMN "LogoBase64" TEXT NULL;
        
        RAISE NOTICE 'Colonne LogoBase64 ajoutée avec succès';
    ELSE
        RAISE NOTICE 'La colonne LogoBase64 existe déjà';
    END IF;
END $$;
EOF
```

### Étape 4: Vérifier le Résultat

```bash
psql $DATABASE_URL -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'Workspaces' AND column_name IN ('LogoUrl', 'LogoBase64') ORDER BY column_name;"
```

Vous devriez voir:

```
 column_name | data_type | is_nullable 
-------------+-----------+-------------
 LogoBase64  | text      | YES
 LogoUrl     | text      | YES
```

### Étape 5: Redémarrer l'Application

1. Retournez au dashboard Render
2. Cliquez sur **"Manual Deploy"** → **"Deploy latest commit"**
3. Ou attendez le redéploiement automatique depuis Git

---

## 📋 Méthode 2: Depuis Votre Machine Locale

Si vous avez l'URL de connexion PostgreSQL de Render:

### Étape 1: Récupérer l'URL de la Base de Données

1. Sur Render Dashboard → **sigac-api** → **Environment**
2. Copiez la valeur de `DATABASE_URL`
3. Elle ressemble à: `postgresql://user:pass@host:5432/dbname`

### Étape 2: Appliquer la Migration

```bash
cd /Users/steve/Projects/SIGAC
psql "postgresql://user:pass@host:5432/dbname" -f migration-base64.sql
```

---

## 📋 Méthode 3: Via l'Interface Web Render (Database)

Si vous avez un service PostgreSQL managé sur Render:

1. Dashboard Render → Votre database PostgreSQL
2. Cliquez sur **"Connect"** → **"External Connection"**
3. Utilisez les credentials affichés avec un client PostgreSQL (DBeaver, pgAdmin)
4. Exécutez le contenu de `migration-base64.sql`

---

## ✅ Vérification Post-Migration

### Test 1: Vérifier la Structure

```bash
psql $DATABASE_URL -c "\d \"Workspaces\""
```

Vous devriez voir `LogoBase64` dans la liste des colonnes.

### Test 2: Tester l'API

```bash
curl -s https://sigac-api.onrender.com/api/health | jq
```

Devrait retourner:
```json
{
  "status": "Healthy",
  "timestamp": "...",
  "version": "1.0.0.0",
  "services": {
    "database": "Connected"
  }
}
```

### Test 3: Tester un Endpoint Workspace

```bash
# Login d'abord
curl -X POST https://sigac-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}'

# Ensuite tester workspaces (avec le token reçu)
curl https://sigac-api.onrender.com/api/workspaces \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🚨 Troubleshooting

### Erreur: "psql: command not found"

**Solution**: Installez postgresql-client:
```bash
apt-get update && apt-get install -y postgresql-client
```

### Erreur: "connection refused"

**Solution**: Vérifiez que `$DATABASE_URL` est défini:
```bash
echo $DATABASE_URL
```

Si vide, utilisez l'URL complète depuis Render Dashboard.

### Erreur: "column already exists"

**Solution**: C'est normal! Le script SQL vérifie d'abord si la colonne existe. Vous verrez:
```
NOTICE: La colonne LogoBase64 existe déjà dans la table Workspaces
```

---

## 📝 Fichiers Créés

1. **`migration-base64.sql`** - Script SQL pur pour ajouter LogoBase64
2. **`migrate-production-render.sh`** - Helper script avec instructions
3. **`MIGRATION_RENDER_GUIDE.md`** - Ce guide détaillé

---

## 🎯 Prochaines Étapes

Une fois la migration appliquée avec succès:

1. ✅ La colonne `LogoBase64` sera disponible
2. ✅ L'API pourra gérer les logos en Base64
3. ✅ Le frontend pourra uploader/afficher les logos
4. ✅ Plus besoin de gérer les fichiers externes pour les logos

---

## 💡 Note Importante

**Pourquoi cette approche?**

Sur Render free tier:
- Le .NET SDK n'est PAS installé par défaut
- Installer le SDK prendrait trop de temps au démarrage
- Les migrations EF Core ne sont pas nécessaires en production
- Le SQL pur est plus rapide et plus fiable

**Pour les futures migrations:**
1. Générez le SQL depuis votre machine locale:
   ```bash
   dotnet ef migrations script --idempotent -o migration.sql
   ```
2. Poussez le SQL sur Git
3. Appliquez avec `psql` sur Render

---

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs Render: Dashboard → sigac-api → Logs
2. Testez la connexion DB: `psql $DATABASE_URL -c "SELECT version();"`
3. Vérifiez les variables d'environnement dans Render Environment

**Bonne migration!** 🚀
