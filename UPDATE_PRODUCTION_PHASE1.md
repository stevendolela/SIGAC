# 🚀 Mise à Jour Production - Phase 1 Sécurité + Workspace

**Date**: 17 décembre 2024  
**Commit**: ce75234  
**Status Production Actuelle**: ✅ ACTIVE (taajii.fr + sigac-api.onrender.com)

---

## 📊 Statut Actuel

### ✅ Infrastructure Existante

**Frontend Vercel** :
- URL principale: https://taajii.fr
- URL Vercel: https://sigac-ged.vercel.app
- Status: ✅ OPÉRATIONNEL
- Auto-deploy: Activé depuis GitHub

**Backend Render** :
- URL: https://sigac-api.onrender.com
- Health: https://sigac-api.onrender.com/api/health
- Status: ✅ OPÉRATIONNEL
- Auto-deploy: Activé depuis GitHub

**Database** :
- PostgreSQL 15 sur Render
- Backups: Quotidiens automatiques

---

## 🎯 Nouvelles Fonctionnalités à Déployer

### Phase 1 Sécurité (4 features)
1. ✅ **Rate Limiting** - AspNetCoreRateLimit 5.0.0
   - Login: 5 tentatives/minute
   - Register: 3 tentatives/heure
   - Global: 100 requêtes/minute

2. ✅ **Input Validation** - FluentValidation 11.3.1
   - Validation stricte des passwords
   - Validation métier des dossiers
   - Messages d'erreur détaillés

3. ✅ **JWT Environment Variables**
   - Support variable d'environnement JWT_SECRET_KEY
   - Minimum 32 caractères requis
   - Auto-génération sur Render

4. ✅ **HTTPS Enforcement**
   - Redirect HTTP → HTTPS
   - HSTS activé
   - RequireHttpsMetadata pour JWT

### GED Multi-Workspace
1. ✅ **Backend**
   - Entities: Workspace, WorkspaceUser
   - 10 endpoints API complets
   - Filtrage automatique par workspace

2. ✅ **Frontend**
   - Sélecteur de workspace
   - Gestion des workspaces (admin)
   - UI intégrée au sidebar

3. ✅ **Migration Database**
   - `20251216190719_AddWorkspaceSupport`
   - Tables: Workspaces, WorkspaceUsers
   - Index optimisés

---

## 🔄 Méthode 1 : Auto-Deploy (Recommandé)

### Étape 1: Vérifier Auto-Deploy Render

1. **Ouvrir Dashboard Render** :
   ```
   https://dashboard.render.com/
   ```

2. **Vérifier le service backend** :
   - Cliquer sur votre service (probablement nommé `sigac-api` ou similaire)
   - Onglet **"Events"** ou **"Logs"**
   - Chercher un déploiement récent avec commit `ce75234`

3. **Si pas de déploiement automatique détecté** :
   - Onglet **"Manual Deploy"**
   - Sélectionner branch `main`
   - Cliquer **"Deploy latest commit"**

### Étape 2: Vérifier Auto-Deploy Vercel

1. **Ouvrir Dashboard Vercel** :
   ```
   https://vercel.com/dashboard
   ```

2. **Vérifier le projet** :
   - Cliquer sur votre projet (probablement `sigac` ou `sigac-ged`)
   - Onglet **"Deployments"**
   - Chercher déploiement avec commit `ce75234`

3. **Si pas de déploiement automatique** :
   - Onglet **"Deployments"**
   - Cliquer **"Redeploy"** sur le dernier déploiement
   - Ou cliquer **"Deploy"** → Sélectionner branch `main`

### Étape 3: Appliquer Migration Database

**IMPORTANT** : La nouvelle migration doit être appliquée !

1. **Via Render Shell** (Recommandé) :
   ```
   1. Dashboard Render → Votre service backend → "Shell"
   2. Exécuter:
      cd /app
      dotnet ef database update --no-build
   3. Vérifier:
      psql $DATABASE_URL -c "\dt" | grep -i workspace
      # Devrait afficher: Workspaces, WorkspaceUsers
   ```

2. **Ou depuis votre machine locale** :
   ```bash
   # Récupérer l'External Database URL depuis Render
   # Dashboard → Database → "External Database URL"
   
   cd /Users/steve/Projects/SIGAC/sigac-backend/SIGAC.Infrastructure
   
   export ConnectionStrings__DefaultConnection="<External_Database_URL>"
   
   dotnet ef database update --startup-project ../SIGAC.API
   ```

---

## 🔧 Méthode 2 : Déploiement Manuel avec Nouveau Blueprint

Si tu veux utiliser le nouveau fichier `render-backend.yaml` que j'ai créé :

### Option A: Créer Nouveau Service

1. **Dashboard Render** → **New** → **Blueprint**
2. **Repository**: stevendolela/SIGAC
3. **Branch**: main
4. **Blueprint**: render-backend.yaml
5. Render va créer:
   - Nouveau service backend `sigac-backend-api`
   - Nouvelle database `sigac-db`

**⚠️ ATTENTION** : Cela créera une NOUVELLE infrastructure. Tu devras :
- Migrer les données de l'ancienne DB
- Mettre à jour les DNS/URLs
- Supprimer l'ancienne infrastructure

### Option B: Mettre à Jour Service Existant

1. **Dashboard Render** → **Votre service backend** → **Settings**

2. **Vérifier/Ajouter Variables d'Environnement** :
   ```
   JWT_SECRET_KEY = <auto-généré ou existant>
   ASPNETCORE_ENVIRONMENT = Production
   ENABLE_RATE_LIMITING = true
   RATE_LIMIT_REQUESTS_PER_MINUTE = 100
   ```

3. **Vérifier CORS** :
   ```
   CORS_ORIGINS = https://taajii.fr,https://sigac-ged.vercel.app
   ```

4. **Manual Deploy** → **Deploy latest commit**

---

## ✅ Tests Post-Déploiement

### 1. Backend Health Check
```bash
curl https://sigac-api.onrender.com/api/health

# Attendu:
{
  "status": "Healthy",
  "timestamp": "2024-12-17T...",
  "version": "1.0.0"
}
```

### 2. Vérifier Rate Limiting
```bash
# Tester 7 tentatives rapides (limite: 5/min)
for i in {1..7}; do
  echo "=== Tentative $i ==="
  curl -w "\nHTTP Status: %{http_code}\n" \
    -X POST https://sigac-api.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
  echo ""
  sleep 0.3
done

# Devrait bloquer à la 6ème tentative avec HTTP 429
```

### 3. Vérifier Workspace API
```bash
# Login d'abord
TOKEN=$(curl -s -X POST https://sigac-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}' | jq -r '.token')

# Tester endpoint workspaces
curl -s https://sigac-api.onrender.com/api/workspaces \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Devrait retourner la liste des workspaces
```

### 4. Vérifier Input Validation
```bash
# Tester password faible (devrait rejeter)
curl -w "\nHTTP Status: %{http_code}\n" \
  -X POST https://sigac-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "weak",
    "email": "test@example.com",
    "nomComplet": "Test User"
  }'

# Devrait retourner HTTP 400 avec message validation
```

### 5. Frontend - Workspace UI
```
1. Ouvrir: https://taajii.fr
2. Login: admin / Admin@2024!
3. Vérifier sidebar:
   - Sélecteur de workspace visible
   - Dropdown avec workspaces disponibles
4. Cliquer sur workspace admin (si admin):
   - Modal de gestion s'ouvre
   - Liste des workspaces
   - Bouton "Créer workspace"
```

---

## 📋 Checklist de Vérification

### Backend
- [ ] Service déployé avec commit ce75234
- [ ] Health check répond (HTTP 200)
- [ ] Variables d'environnement configurées
- [ ] Migration database appliquée (tables Workspaces, WorkspaceUsers)
- [ ] Rate limiting actif (test 7 requêtes)
- [ ] Input validation active (test password faible)
- [ ] Workspace API fonctionne (liste workspaces)

### Frontend
- [ ] Déploiement avec commit ce75234
- [ ] Page charge sans erreurs
- [ ] Login fonctionne
- [ ] Dashboard accessible
- [ ] Sélecteur workspace visible dans sidebar
- [ ] Modal workspace fonctionne (pour admin)

### Database
- [ ] Tables Workspaces créées
- [ ] Tables WorkspaceUsers créées
- [ ] Relations foreign keys correctes
- [ ] Index créés

---

## 🆘 Troubleshooting

### Backend ne démarre pas après déploiement

**Symptôme**: Service en erreur, logs montrent exception au startup

**Solutions** :
1. Vérifier que la migration est appliquée:
   ```bash
   # Via Render Shell
   cd /app
   dotnet ef database update --no-build
   ```

2. Vérifier JWT_SECRET_KEY (minimum 32 caractères):
   ```bash
   # Dashboard Render → Service → Environment
   # Si manquant ou trop court, générer:
   openssl rand -base64 64
   ```

3. Vérifier logs:
   ```
   Dashboard Render → Service → Logs
   Chercher: [ERR] ou Exception
   ```

### Rate Limiting ne fonctionne pas

**Test** :
```bash
# Devrait bloquer à la 6ème tentative
for i in {1..7}; do
  curl -w "Status: %{http_code}\n" \
    -X POST https://sigac-api.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
done
```

**Solution** :
- Vérifier variable: `ENABLE_RATE_LIMITING=true`
- Redéployer si modifiée

### Workspace API retourne 404

**Symptôme** :
```bash
curl https://sigac-api.onrender.com/api/workspaces
# HTTP 404 Not Found
```

**Cause** : Migration pas appliquée ou controller pas déployé

**Solution** :
1. Vérifier commit déployé (doit être ce75234 ou plus récent)
2. Appliquer migration:
   ```bash
   dotnet ef database update --no-build
   ```

### Frontend - Workspace UI manquant

**Symptôme** : Pas de sélecteur workspace dans sidebar

**Solution** :
1. Vérifier déploiement Vercel avec commit ce75234
2. Ouvrir console navigateur (F12):
   - Chercher erreurs JavaScript
   - Vérifier appels API `/api/workspaces`
3. Vérifier variable d'environnement Vercel:
   ```
   VITE_API_URL = https://sigac-api.onrender.com/api
   ```

---

## 🎯 Actions Recommandées

### Immédiatement
1. ✅ Vérifier auto-deploy Render (Dashboard → Events)
2. ✅ Vérifier auto-deploy Vercel (Dashboard → Deployments)
3. ✅ Appliquer migration database (Shell Render)
4. ✅ Tester health check backend
5. ✅ Tester login frontend

### Après Déploiement
1. ✅ Exécuter tous les tests post-déploiement
2. ✅ Vérifier logs pour erreurs
3. ✅ Tester rate limiting
4. ✅ Tester workspaces (création, liste)
5. ✅ Monitorer pendant 24h

### Optionnel
1. Configurer alertes Render (email sur failures)
2. Monitorer performance (Render metrics)
3. Backups database (déjà automatique sur Render)

---

## 📞 Support

### Render
- Dashboard: https://dashboard.render.com/
- Docs: https://render.com/docs
- Support: support@render.com

### Vercel
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Support: support@vercel.com

### SIGAC Docs
- Guide déploiement: `/DEPLOYMENT_GUIDE.md`
- Sécurité Phase 1: `/SECURITY_PHASE_1_FINAL_REPORT.md`
- Workspace API: `/WORKSPACE_API_COMPLETE.md`

---

**Auteur**: GitHub Copilot + stevendolela  
**Date**: 17 décembre 2024  
**Version**: Phase 1 Update
