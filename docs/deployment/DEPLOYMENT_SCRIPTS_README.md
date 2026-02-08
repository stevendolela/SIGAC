# 🚀 DEPLOYMENT SCRIPTS & GUIDES

Ce répertoire contient tous les scripts et guides nécessaires pour déployer SIGAC sur Render (Backend) et Vercel (Frontend).

---

## 📋 FICHIERS DISPONIBLES

### Scripts de Déploiement

| Fichier | Usage | Description |
|---------|-------|-------------|
| `full-deploy.sh` | `./full-deploy.sh` | **🔴 RECOMMANDÉ** - Déploiement complet (build + test + push) |
| `deploy.sh` | `./deploy.sh [backend\|frontend\|all]` | Déploiement simple avec build (le plus populaire) |
| `deployment-status.sh` | `./deployment-status.sh` | Affiche le statut en temps réel des déploiements |
| `deploy-frontend.sh` | `./deploy-frontend.sh` | Déploiement frontend uniquement |

### Guides & Documentation

| Fichier | Description |
|---------|-------------|
| `DEPLOYMENT_GUIDE.md` | Guide complet de déploiement (tous les détails) |
| `DEPLOYMENT.md` | Configuration de déploiement |
| `DEPLOYMENT_FINAL.md` | Dernier état du déploiement |
| `DEPLOYMENT_STATUS.md` | Statut du dernier déploiement |
| `RENDER_DEPLOYMENT_CHECKLIST.md` | Checklist pour Render |

---

## 🚀 DÉMARRAGE RAPIDE

### Option 1: Déploiement Complet (RECOMMANDÉ)

```bash
cd /Users/steve/Projects/SIGAC
./full-deploy.sh
```

**Qu'il fait**:
1. ✅ Vérifie les prérequis (git, dotnet, npm)
2. ✅ Compile le backend en Release
3. ✅ Compile le frontend
4. ✅ Exécute les tests
5. ✅ Pousse vers GitHub
6. ✅ Affiche le statut du déploiement
7. ✅ Ouvre les dashboards

**Durée**: ~10-15 minutes

---

### Option 2: Déploiement Rapide

```bash
cd /Users/steve/Projects/SIGAC
./deploy.sh all
# ou
./deploy.sh backend  # Backend uniquement
./deploy.sh frontend # Frontend uniquement
```

**Qu'il fait**:
1. ✅ Build
2. ✅ Pousse vers GitHub
3. ✅ Render/Vercel se redéploient automatiquement

**Durée**: ~5 minutes

---

### Option 3: Vérifier le Statut

```bash
cd /Users/steve/Projects/SIGAC
./deployment-status.sh
```

**Affiche**:
- ✅ Statut GitHub
- ✅ Statut API Render
- ✅ Statut Frontend Vercel
- ✅ Santé de la base de données
- ✅ Liens utiles et commandes

---

## 🔗 URLS DE PRODUCTION

### Backend (Render)
```
API:      https://sigac-api.onrender.com
Health:   https://sigac-api.onrender.com/api/health
Swagger:  https://sigac-api.onrender.com/swagger
Dashboard: https://dashboard.render.com/services/sigac-api
```

### Frontend (Vercel)
```
Frontend: https://sigac.vercel.app
Dashboard: https://vercel.com/sigac
```

---

## 📊 DÉPLOIEMENT AUTOMATIQUE

Dès que tu **pousses vers GitHub** (`git push origin main`):

1. **Render** détecte le changement
2. Trigger automatique du build backend
3. Déploiement de la nouvelle version
4. ⏱️ Durée: 5-10 minutes

Et simultanément:

1. **Vercel** détecte le changement
2. Trigger automatique du build frontend
3. Déploiement de la nouvelle version
4. ⏱️ Durée: 2-5 minutes

---

## 🔍 MONITORING

### En Temps Réel

```bash
# Afficher le statut live
./deployment-status.sh

# Vérifier l'API
curl https://sigac-api.onrender.com/api/health

# Voir les logs backend
tail -f sigac-backend/logs/sigac-*.txt
```

### Dashboards

- **Render**: https://dashboard.render.com
- **Vercel**: https://vercel.com/dashboard
- **GitHub**: https://github.com/stevendolela/SIGAC

---

## 🛠️ TROUBLESHOOTING

### Le backend ne démarre pas

1. Vérifier les logs Render:
   ```
   https://dashboard.render.com/services/sigac-api/logs
   ```

2. Vérifier les variables d'environnement:
   ```
   https://dashboard.render.com/services/sigac-api/env
   ```

3. Vérifier PostgreSQL:
   ```
   https://dashboard.render.com/databases/postgresql-sigac
   ```

### Le frontend affiche 404

1. Vérifier les logs Vercel:
   ```
   https://vercel.com/sigac/deployments
   ```

2. Vérifier les variables d'environnement:
   ```
   https://vercel.com/sigac/settings/environment-variables
   ```

3. Vérifier que l'API backend est accessible:
   ```bash
   curl https://sigac-api.onrender.com/api/health
   ```

### Build échoue

1. Vérifier les fichiers modifiés:
   ```bash
   git status
   ```

2. Committer les changements:
   ```bash
   git add -A
   git commit -m "fix: ..."
   ```

3. Repousser:
   ```bash
   git push origin main
   ```

---

## 📝 COMMANDES UTILES

### Build & Test Local

```bash
# Backend
cd sigac-backend
dotnet build SIGAC.API/SIGAC.API.csproj -c Release
dotnet test SIGAC.Tests/SIGAC.Tests.csproj -c Debug

# Frontend
cd sigac-frontend
npm run build
npm run preview
```

### Git

```bash
# Voir le statut
git status

# Voir les changements
git diff

# Committer
git add -A
git commit -m "feat: ..."

# Pousser
git push origin main

# Voir l'historique
git log --oneline | head -10
```

### Docker (Local)

```bash
# Vérifier les images
docker images | grep sigac

# Vérifier les containers
docker ps -a | grep sigac

# Voir les logs
docker logs sigac-postgres
```

---

## 🔐 SECRETS & VARIABLES

### Render Secrets

À configurer dans: https://dashboard.render.com/services/sigac-api/env

```
ASPNETCORE_ENVIRONMENT = Production
Jwt__SecretKey = <GENERATED>
Jwt__Issuer = SIGAC.CourConstitutionnelle.RDC
Jwt__Audience = SIGAC.Client
Cors__AllowedOrigins = ["https://sigac.vercel.app"]
```

### Vercel Secrets

À configurer dans: https://vercel.com/sigac/settings/environment-variables

```
REACT_APP_API_URL = https://sigac-api.onrender.com
```

### GitHub Secrets

À configurer dans: https://github.com/stevendolela/SIGAC/settings/secrets/actions

```
RENDER_API_KEY = <your_key>
VERCEL_TOKEN = <your_token>
```

---

## 📋 CHECKLIST PRÉ-DÉPLOIEMENT

- [ ] Tous les changements sont commités
- [ ] Tests locaux passent
- [ ] Pas d'erreurs de compilation
- [ ] `.gitignore` n'exclut pas les fichiers essentiels
- [ ] Variables d'environnement configurées
- [ ] Database migrations appliquées
- [ ] CORS configuré correctement
- [ ] JWT secrets générés

---

## 📞 SUPPORT

### Documentation
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Guide complet
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)

### Dashboards
- [Render](https://dashboard.render.com)
- [Vercel](https://vercel.com/dashboard)
- [GitHub](https://github.com/stevendolela/SIGAC)

### Status
- Render Status: https://status.render.com
- Vercel Status: https://www.vercelstatus.com

---

## 🎯 WORKFLOW TYPIQUE

```bash
# 1. Faire les changements
vim sigac-backend/...
vim sigac-frontend/...

# 2. Tester localement
dotnet test sigac-backend/SIGAC.Tests/...
npm run build sigac-frontend

# 3. Committer
git add -A
git commit -m "feat: description..."

# 4. Déployer
git push origin main
# ou
./deploy.sh all

# 5. Vérifier
./deployment-status.sh
```

---

## 📊 TIMELINE TYPIQUE

| Étape | Durée | Notes |
|-------|-------|-------|
| Build local | 2-3 min | Peut être skippé |
| Git push | <1 min | Dépend du débit internet |
| Render build | 5-10 min | Auto-déploiement |
| Vercel build | 2-5 min | Auto-déploiement |
| Total | ~10-15 min | Temps pour voir les changements en prod |

---

**Généré**: 6 décembre 2025  
**Version**: 1.0  
**Statut**: ✅ Production Ready
