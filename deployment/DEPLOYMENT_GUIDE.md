# 🚀 Guide de Déploiement SIGAC - Render + Vercel

**Date**: 17 décembre 2024  
**Version**: Phase 1 Sécurité + GED Multi-Workspace  
**Backend**: .NET 8 (Render)  
**Frontend**: React + Vite (Vercel)  
**Database**: PostgreSQL (Render)  
**Status**: ✅ Configurations prêtes pour déploiement

---

## 📋 Vue d'ensemble

### Architecture de déploiement

```
┌──────────────┐      HTTPS       ┌───────────────────┐
│   Frontend   │ ◄──────────────► │    Backend API    │
│    Vercel    │   API Calls      │      Render       │
│   (React)    │                  │     (.NET 8)      │
└──────────────┘                  └─────────┬─────────┘
                                            │
                                            ▼
                                  ┌───────────────────┐
                                  │   PostgreSQL DB   │
                                  │      Render       │
                                  └───────────────────┘
```

### URLs de production
- **Frontend**: https://sigac-frontend.vercel.app
- **Backend API**: https://sigac-backend-api.onrender.com
- **Health Check**: https://sigac-backend-api.onrender.com/api/health

---

## 🔐 Prérequis

### Comptes requis
1. **GitHub Account** (pour auto-deploy)
   - Repository: https://github.com/stevendolela/SIGAC
   - ✅ Code déjà poussé (commit ce75234)

2. **Render Account**
   - Créer compte: https://render.com/
   - Lier GitHub repository

3. **Vercel Account**
   - Créer compte: https://vercel.com/
   - Lier GitHub repository

### Secrets à préparer

#### JWT Secret Key
```bash
# Générer une clé sécurisée (minimum 32 caractères)
openssl rand -base64 64

# Exemple de sortie:
# GZejc/T9Fu+9re7Ract9X9vB2Kz1MmP3yQ4nL8hJ6sK7dF0wE5tA6cB9xY2zV3uC=
```

Sauvegarder cette clé dans un gestionnaire de mots de passe. **NE JAMAIS la commiter dans Git.**

---

## 🗄️ Déploiement Backend (Render)

### Étape 1: Créer la Database PostgreSQL


1. **Dashboard Render** → **New** → **PostgreSQL**

2. **Configurer la database**:
   ```
   Name: sigac-db
   Database: sigac_db
   User: sigac_user
   Region: Frankfurt (Europe - proche RDC)
   Plan: Starter ($7/month)
   ```

3. **Créer**
   - Render génère automatiquement:
     - Internal Database URL
     - External Database URL
     - Connection String
   
4. **Sauvegarder** l'Internal Database URL (format PostgreSQL)

### Étape 2: Créer le Backend Service

1. **Dashboard Render** → **New** → **Blueprint**

2. **Connecter GitHub Repository**:
   ```
   Repository: stevendolela/SIGAC
   Branch: main
   Blueprint File: render-backend.yaml
   ```

3. **Vérifier les variables d'environnement**:
   
   Render va lire `render-backend.yaml` et configurer automatiquement:
   
   ✅ Auto-générées:
   - `JWT_SECRET_KEY` (généré automatiquement par Render)
   - `ConnectionStrings__DefaultConnection` (depuis sigac-db)
   
   ✅ Pré-configurées:
   - `ASPNETCORE_ENVIRONMENT=Production`
   - `JWT_ISSUER=SIGAC.CourConstitutionnelle.RDC`
   - `JWT_AUDIENCE=SIGAC.Client`
   - `JWT_EXPIRATION_MINUTES=60`
   - `CORS_ORIGINS=https://sigac-frontend.vercel.app,...`
   - `ENABLE_RATE_LIMITING=true`

4. **Créer le Service**
   - Render va:
     - Builder le Docker image (Dockerfile.api)
     - Démarrer le service
     - Créer le volume `/var/data/uploads` (10GB)

5. **Attendre le déploiement** (~5-10 minutes)

6. **Vérifier le Health Check**:
   ```bash
   curl https://sigac-backend-api.onrender.com/api/health
   # Devrait retourner: {"status":"Healthy","timestamp":"..."}
   ```

### Étape 3: Appliquer les Migrations Database

#### Option A: Via Render Shell (Recommandé)

1. **Dashboard Render** → **sigac-backend-api** → **Shell**

2. **Exécuter les migrations**:
   ```bash
   cd /app
   dotnet ef database update --no-build
   ```

3. **Vérifier**:
   ```bash
   # Lister les tables créées
   psql $DATABASE_URL -c "\dt"
   ```

#### Option B: Depuis votre machine locale

1. **Récupérer l'External Database URL** depuis Render Dashboard

2. **Exécuter les migrations**:
   ```bash
   cd sigac-backend/SIGAC.Infrastructure
   
   # Définir la connection string
   export ConnectionStrings__DefaultConnection="<External_Database_URL>"
   
   # Appliquer les migrations
   dotnet ef database update --startup-project ../SIGAC.API
   ```

---

## 🎨 Déploiement Frontend (Vercel)

### Étape 1: Importer le projet

1. **Dashboard Vercel** → **Add New** → **Project**

2. **Import Git Repository**:
   ```
   Repository: stevendolela/SIGAC
   Framework Preset: Vite
   Root Directory: sigac-frontend
   ```

3. **Configure Project**:
   ```
   Project Name: sigac-frontend
   Framework: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm ci
   ```

### Étape 2: Configurer les Variables d'Environnement

**Settings** → **Environment Variables**:

```
VITE_API_URL = https://sigac-backend-api.onrender.com/api
```

**Important**: Vercel rebuild automatiquement quand on ajoute/modifie une variable d'environnement.

### Étape 3: Déployer

1. **Deploy** (premier déploiement)
   - Vercel va:
     - Installer les dépendances
     - Builder avec Vite
     - Déployer sur CDN global

2. **Attendre le déploiement** (~2-3 minutes)

3. **Vérifier**:
   - Ouvrir: https://sigac-frontend.vercel.app
   - Devrait afficher la page de login

---

## 🧪 Tests Post-Déploiement

### 1. Backend Health Check
```bash
curl https://sigac-backend-api.onrender.com/api/health

# Attendu:
{
  "status": "Healthy",
  "timestamp": "2024-12-17T10:30:00Z"
}
```

### 2. JWT Authentication
```bash
# Login
curl -X POST https://sigac-backend-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@2024!"
  }'

# Attendu:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

### 3. Rate Limiting
```bash
# Tester 7 requêtes login (limite: 5/min)
for i in {1..7}; do
  curl -X POST https://sigac-backend-api.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' \
    -w "\nHTTP Status: %{http_code}\n"
  sleep 0.5
done

# Attendu à la 6ème tentative:
# HTTP Status: 429 (Too Many Requests)
```

### 4. Frontend → Backend Integration
1. Ouvrir: https://sigac-frontend.vercel.app
2. Login avec `admin` / `Admin@2024!`
3. Vérifier:
   - ✅ Dashboard charge
   - ✅ Liste des dossiers visible
   - ✅ Workspaces disponibles
   - ✅ Pas d'erreurs CORS dans la console

---

## 💰 Coûts Estimés

### Plan Starter (Recommandé pour début)
| Service | Plan | Prix/mois |
|---------|------|-----------|
| Backend (Render Web Service) | Starter | $7 |
| Database (Render PostgreSQL) | Starter | $7 |
| Frontend (Vercel Hobby) | Hobby | **GRATUIT** |
| **Total** | | **$14/mois** |

---

## 📝 Checklist de Déploiement

### Pré-déploiement
- [x] Repository GitHub à jour (push `main` ✅ commit ce75234)
- [ ] JWT Secret Key générée et sauvegardée
- [ ] Compte Render créé et lié à GitHub
- [ ] Compte Vercel créé et lié à GitHub

### Backend (Render)
- [ ] Database PostgreSQL créée
- [ ] Backend service créé avec `render-backend.yaml`
- [ ] Variables d'environnement vérifiées
- [ ] Health check passe: `/api/health`
- [ ] Migrations database appliquées
- [ ] Compte admin créé

### Frontend (Vercel)
- [ ] Projet importé depuis GitHub
- [ ] Variable `VITE_API_URL` configurée
- [ ] Build réussi
- [ ] Application accessible
- [ ] Login fonctionne

### Tests Post-Déploiement
- [ ] Health check backend OK
- [ ] Login/Logout fonctionnels
- [ ] Dashboard charge
- [ ] Workspaces affichés
- [ ] Rate limiting actif
- [ ] CORS configuré correctement

---

**Auteur**: GitHub Copilot + stevendolela  
**Dernière mise à jour**: 17 décembre 2024  
**Version**: 1.0.0 (Phase 1 Sécurité + Workspace GED)


## 📝 CONFIGURATION REQUISE

### Backend (Render)

**Dockerfile**: `docker/Dockerfile.api`
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0

WORKDIR /app
COPY sigac-backend/SIGAC.API/bin/Release/net8.0/publish .

ENTRYPOINT ["dotnet", "SIGAC.API.dll"]
```

**Variables d'environnement** (à vérifier):
```yaml
ASPNETCORE_ENVIRONMENT: Production
PORT: 10000
ConnectionStrings__DefaultConnection: <DATABASE_URL>
Jwt__SecretKey: <GENERATED>
Jwt__Issuer: SIGAC.CourConstitutionnelle.RDC
Jwt__Audience: SIGAC.Client
Jwt__ExpirationMinutes: 30
Cors__AllowedOrigins: '["https://sigac.vercel.app","https://yourdomain.com"]'
FileStorage__BasePath: /tmp/uploads
Serilog__MinimumLevel: Information
```

### Frontend (Vercel)

**Configuration**: `vercel.json` (racine du projet)
```json
{
  "buildCommand": "cd sigac-frontend && npm run build",
  "outputDirectory": "sigac-frontend/dist",
  "devCommand": "cd sigac-frontend && npm run dev",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Variables d'environnement**:
```
REACT_APP_API_URL=https://sigac-api.onrender.com
```

---

## 🔧 DÉPLOIEMENT MANUEL (CLI)

### Backend - Build Docker Local

```bash
cd /Users/steve/Projects/SIGAC

# 1. Build l'image Docker
docker build -f docker/Dockerfile.api -t sigac-api:latest .

# 2. Tag pour Render
docker tag sigac-api:latest render.onrender.com/sigac-api:latest

# 3. Push vers Render (si vous avez configuré le registry)
# (Normalement Render se connecte directement à GitHub)
```

### Frontend - Build & Deploy Vercel

```bash
cd /Users/steve/Projects/SIGAC/sigac-frontend

# 1. Build local
npm run build

# 2. Preview local
npm run preview

# 3. Deploy via Vercel CLI (si installé)
vercel --prod

# Ou simplement push GitHub et Vercel déploiera automatiquement
git push origin main
```

---

## ✅ CHECKLIST DE DÉPLOIEMENT

### Avant Déploiement

- [ ] Tous les tests locaux passent
- [ ] Build local réussit
- [ ] Pas d'erreurs de compilation
- [ ] Commit poussé sur GitHub (`main` branch)
- [ ] Variables d'environnement configurées sur les plateformes

### Pendant Déploiement

- [ ] Render: Vérifier les logs de build
- [ ] Render: Vérifier que l'API démarre correctement
- [ ] Vercel: Vérifier les logs de build
- [ ] Vercel: Vérifier que le frontend se charge

### Après Déploiement

- [ ] Vérifier `/api/health` sur Render (HTTP 200)
- [ ] Vérifier le frontend se charge sur Vercel
- [ ] Tester la connexion (login)
- [ ] Tester une opération (créer un utilisateur)
- [ ] Vérifier les logs pour erreurs
- [ ] Vérifier la base de données (PostgreSQL)

---

## 🔗 URLS DE PRODUCTION

### Render
- **API**: https://sigac-api.onrender.com
- **Health**: https://sigac-api.onrender.com/api/health
- **Swagger**: https://sigac-api.onrender.com/swagger

### Vercel
- **Frontend**: https://sigac.vercel.app (ou votre domaine custom)

### DNS (si domaine custom)
- **Backend**: api.sigac.yourdomain.com → Render
- **Frontend**: sigac.yourdomain.com → Vercel

---

## 🐛 DÉPANNAGE

### Issue: Build échoue sur Render

**Solution**:
1. Vérifier les logs complets: Dashboard Render → sigac-api → Logs
2. Vérifier que le Dockerfile est correct
3. Vérifier les variables d'environnement
4. Redéployer avec `git push origin main`

### Issue: Frontend ne charge pas sur Vercel

**Solution**:
1. Vérifier `vercel.json` est correct
2. Vérifier `REACT_APP_API_URL` est configurée
3. Vérifier les logs: Dashboard Vercel → Deployments → Build Logs
4. Vérifier CORS sur le backend

### Issue: Erreur de connexion à la DB

**Solution**:
1. Vérifier `ConnectionStrings__DefaultConnection` sur Render
2. Vérifier que PostgreSQL est running
3. Vérifier les migrations EF Core ont été appliquées
4. Vérifier les credentials

### Issue: CORS error

**Solution**:
1. Vérifier `Cors__AllowedOrigins` inclut le domaine Vercel
2. Ajouter: `https://sigac.vercel.app`
3. Si domaine custom: `https://votre-domaine.com`
4. Redéployer le backend

---

## 📊 MONITORING

### Render Dashboard
- Vérifier CPU/Memory usage
- Vérifier les logs en temps réel
- Vérifier la santé de l'API

### Vercel Dashboard
- Vérifier les performances
- Vérifier les erreurs (Edge Functions)
- Vérifier les analytics

### Database (PostgreSQL)
- Vérifier la taille
- Vérifier les connections
- Vérifier la performance

---

## 🔄 REDÉPLOIEMENT RAPIDE

### Si on change le code backend:
```bash
git add sigac-backend/
git commit -m "fix: Backend fix"
git push origin main
# Render se redéploiera automatiquement (5-10 min)
```

### Si on change le code frontend:
```bash
git add sigac-frontend/
git commit -m "fix: Frontend fix"
git push origin main
# Vercel se redéployera automatiquement (2-5 min)
```

### Si on change la DB:
```bash
# Créer la migration
dotnet ef migrations add MigrationName -p SIGAC.Infrastructure -s SIGAC.API

# Pousser
git add sigac-backend/SIGAC.Infrastructure/Migrations/
git commit -m "chore: Add migration"
git push origin main

# Render appliquera la migration au démarrage (via Program.cs)
```

---

## 📞 SUPPORT

### Pour Render
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs
- Support: render.com/support

### Pour Vercel
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Support: vercel.com/support

---

## ✨ RÉSUMÉ

| Étape | Render | Vercel |
|-------|--------|--------|
| **Code** | .NET 8 API | React Frontend |
| **Trigger** | GitHub push | GitHub push |
| **Build** | Docker build | npm run build |
| **Runtime** | .NET Runtime | Node.js |
| **URL** | https://sigac-api.onrender.com | https://sigac.vercel.app |
| **Time** | 5-10 min | 2-5 min |
| **Cost** | Free tier disponible | Free tier disponible |

---

**Déploiement**: Déclenché automatiquement via GitHub push  
**Status**: ✅ Prêt pour production  
**Dernière mise à jour**: 6 décembre 2025

