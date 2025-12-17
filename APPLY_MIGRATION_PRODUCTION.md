# 🗄️ Application de la Migration Database en Production

**Date**: 17 décembre 2024  
**Migration**: 20251216190719_AddWorkspaceSupport  
**Tables à créer**: Workspaces, WorkspaceUsers

---

## 🎯 Objectif

Appliquer la migration pour ajouter le support multi-workspace à la base de données PostgreSQL en production sur Render.

---

## 📋 Méthode Recommandée: Render Shell

### Étape 1: Accéder au Shell Render

1. **Ouvre** : https://dashboard.render.com/
2. **Connecte-toi** avec ton compte
3. **Trouve ton service backend** (probablement nommé `sigac-api` ou similaire)
4. **Clique** sur le service
5. **Clique** sur l'onglet **"Shell"** en haut

### Étape 2: Vérifier l'état actuel

Dans le terminal Render Shell, tape :

```bash
# Vérifier les tables existantes
psql $DATABASE_URL -c "\dt" | grep -i workspace
```

**Résultat attendu** : Aucune table (si migration pas encore appliquée)

### Étape 3: Appliquer la migration

```bash
# Aller dans le répertoire de l'application
cd /app

# Appliquer toutes les migrations en attente
dotnet ef database update --no-build

# Devrait afficher:
# Applying migration '20251216190719_AddWorkspaceSupport'
# Done.
```

### Étape 4: Vérifier que ça a fonctionné

```bash
# Lister toutes les tables
psql $DATABASE_URL -c "\dt"

# Vérifier spécifiquement les nouvelles tables
psql $DATABASE_URL -c "\d \"Workspaces\""
psql $DATABASE_URL -c "\d \"WorkspaceUsers\""
```

**Résultat attendu** :
```
                Table "public.Workspaces"
     Column     |            Type             | ...
----------------+-----------------------------+-----
 Id             | uuid                        | ...
 Name           | character varying(100)      | ...
 Slug           | character varying(100)      | ...
 Description    | text                        | ...
 OwnerId        | uuid                        | ...
 ...

                Table "public.WorkspaceUsers"
     Column     |            Type             | ...
----------------+-----------------------------+-----
 Id             | uuid                        | ...
 WorkspaceId    | uuid                        | ...
 UserId         | uuid                        | ...
 Role           | integer                     | ...
 ...
```

---

## 🔄 Méthode Alternative: Depuis Ton Mac

Si tu préfères exécuter depuis ta machine locale :

### Étape 1: Récupérer l'External Database URL

1. **Dashboard Render** → **Databases** → Clique sur ta database PostgreSQL
2. **Trouve** : **"External Database URL"** (commence par `postgres://...`)
3. **Copie** l'URL complète

### Étape 2: Appliquer la migration localement

```bash
cd /Users/steve/Projects/SIGAC/sigac-backend/SIGAC.Infrastructure

# Remplace <URL> par l'External Database URL
export ConnectionStrings__DefaultConnection="postgres://user:pass@host:port/database"

# Appliquer la migration
dotnet ef database update --startup-project ../SIGAC.API

# Vérifier
dotnet ef migrations list --startup-project ../SIGAC.API
```

---

## 🧪 Tester Après Migration

### Test 1: Via Script Automatique

```bash
cd /Users/steve/Projects/SIGAC
./test-production-phase1.sh
```

Cherche dans les résultats :
```
📊 7. Database Migration Check
───────────────────────────────
Creating test workspace... ✅ OK (Migration applied)
```

### Test 2: Via API Manuelle

```bash
# 1. Login pour obtenir un token
TOKEN=$(curl -s -X POST https://sigac-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}' | jq -r '.token')

# 2. Créer un workspace de test
curl -X POST https://sigac-api.onrender.com/api/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Workspace Test Migration",
    "description": "Test de la migration"
  }' | jq '.'

# Devrait retourner le workspace créé avec un ID
```

### Test 3: Via Frontend

1. **Ouvre** : https://taajii.fr
2. **Login** : `admin` / `Admin@2024!`
3. **Vérifie** : Sélecteur de workspace visible dans la sidebar
4. **Clique** sur l'icône ⚙️ workspace (si admin)
5. **Essaie** de créer un nouveau workspace

---

## 🆘 Problèmes Possibles

### Erreur: "relation already exists"

**Cause** : Migration déjà appliquée

**Solution** : Rien à faire, c'est OK !

### Erreur: "could not connect to database"

**Cause** : Service backend pas encore démarré ou database non disponible

**Solution** :
1. Vérifie que Render service est "Live" (vert)
2. Vérifie que la database PostgreSQL est "Available"
3. Attends 2-3 minutes et réessaie

### Erreur: "dotnet: command not found"

**Cause** : Tu es dans le mauvais shell ou le build n'est pas terminé

**Solution** :
1. Assure-toi d'être dans le **Render Shell** (pas ton Mac)
2. Vérifie que le service est complètement déployé ("Live")
3. Si problème persiste, force un redeploy

### Erreur: "No such file or directory: /app"

**Cause** : Le build n'a pas encore créé le répertoire

**Solution** :
1. Attends que le déploiement soit 100% terminé
2. Refresh le Shell Render
3. Réessaie

---

## 📊 Résumé des Commandes

### Option A: Render Shell (Recommandé)
```bash
cd /app
dotnet ef database update --no-build
psql $DATABASE_URL -c "\dt" | grep -i workspace
```

### Option B: Depuis ton Mac
```bash
cd /Users/steve/Projects/SIGAC/sigac-backend/SIGAC.Infrastructure
export ConnectionStrings__DefaultConnection="<External_DB_URL>"
dotnet ef database update --startup-project ../SIGAC.API
```

### Test Final
```bash
cd /Users/steve/Projects/SIGAC
./test-production-phase1.sh
```

---

## ✅ Checklist

- [ ] Service Render déployé et "Live"
- [ ] Accès au Render Shell obtenu
- [ ] Migration appliquée (`dotnet ef database update`)
- [ ] Tables Workspaces et WorkspaceUsers créées
- [ ] Test API workspace réussi
- [ ] Frontend affiche le sélecteur de workspace
- [ ] Création de workspace fonctionne

---

## 🎉 Après Migration Réussie

Tu auras :

✅ **Tables Database** :
- `Workspaces` : Pour gérer les espaces de travail
- `WorkspaceUsers` : Pour les membres et leurs rôles

✅ **API Workspace** :
- 10 endpoints opérationnels
- CRUD complet sur les workspaces
- Gestion des membres

✅ **Frontend** :
- Sélecteur de workspace dans sidebar
- Modal de gestion (pour admins)
- Filtrage automatique des dossiers par workspace

✅ **Sécurité** :
- Isolation des données par workspace
- Contrôle d'accès basé sur les rôles
- Audit trail complet

---

**🚀 C'EST SIMPLE : Ouvre Render Shell → `cd /app` → `dotnet ef database update --no-build` → DONE !**
