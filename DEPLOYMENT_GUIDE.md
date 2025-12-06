# 🚀 GUIDE DE DÉPLOIEMENT - RENDER & VERCEL

**Date**: 6 décembre 2025  
**Status**: ✅ Prêt pour déploiement

---

## 📋 PRÉREQUIS

### Render
- ✅ Compte Render (render.com)
- ✅ Projet SIGAC configuré
- ✅ PostgreSQL 15 lié
- ✅ Variables d'environnement configurées

### Vercel
- ✅ Compte Vercel (vercel.com)
- ✅ Projet Frontend lié
- ✅ Domain configuré (optionnel)

### GitHub
- ✅ Repository `stevendolela/SIGAC`
- ✅ Commit actuel poussé (`main` branch)
- ✅ Deploy keys configurées

---

## 🔄 DÉPLOIEMENT AUTOMATIQUE

### Option 1: Déploiement via Render Dashboard

#### Étape 1: Accéder à Render
1. Aller sur [render.com](https://render.com)
2. Se connecter avec ton compte
3. Sélectionner le projet **TAJI/SIGAC**

#### Étape 2: Déployer le Backend
1. Aller à **Services** → **sigac-api**
2. Cliquer le bouton **"Deploy"** ou **"Manual Deploy"**
3. Attendre le build (5-10 min)
4. Vérifier les logs pour erreurs

**Vérification**:
```bash
curl -s https://sigac-api.onrender.com/api/health
# Résultat attendu: { "status": "healthy" }
```

#### Étape 3: Vérifier PostgreSQL
1. Aller à **Databases** → **postgresql-sigac**
2. Vérifier le statut (should be "Available")
3. Vérifier la connection string

### Option 2: Déploiement via Vercel Dashboard

#### Étape 1: Accéder à Vercel
1. Aller sur [vercel.com](https://vercel.com)
2. Se connecter avec ton compte
3. Sélectionner le projet **SIGAC**

#### Étape 2: Déclencher le Build
1. Cliquer **"Deployments"**
2. Cliquer **"Redeploy"** sur le dernier commit
3. Ou cliquer **"Create Deployment"** pour un commit spécifique

**Vérification**:
```bash
curl -s https://sigac.vercel.app
# Résultat attendu: Page React chargée
```

#### Étape 3: Vérifier l'Environnement
1. Aller à **Settings** → **Environment Variables**
2. Vérifier que les variables sont correctes
3. Exemple:
   ```
   REACT_APP_API_URL=https://sigac-api.onrender.com
   ```

---

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

