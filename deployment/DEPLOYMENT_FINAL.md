# 🎉 Déploiement SIGAC - Production Live

## ✅ Status : ACTIF ET FONCTIONNEL

---

## 📍 URLs de Production

### Frontend (Vercel)
- **URL** : https://sigac-frontend-5tba4lw5i-steves-projects-60de588f.vercel.app
- **Hébergeur** : Vercel (gratuit)
- **Performance** : CDN global, HTTPS auto, déploiement automatique

### Backend API (Render)
- **URL** : https://sigac-api.onrender.com
- **Hébergeur** : Render (gratuit, Free tier)
- **Base de données** : PostgreSQL 15 managée (Render)
- **Port** : 10000 (automatique)

---

## 🔐 Comptes de Test

```
Admin :
  Username: admin
  Password: Admin@2024!
  
President :
  Username: president.benoit
  Password: President@2024!
  
Juge Constitutionnel :
  Username: juge.mbala
  Password: Juge@2024!
```

---

## 🏗️ Architecture Déployée

### Backend (.NET 8 + PostgreSQL)
- **Framework** : ASP.NET Core 8
- **Database** : PostgreSQL 15
- **Authentication** : JWT (30 min expiration, 7 jours refresh)
- **API** : REST avec Swagger/OpenAPI
- **Health Check** : `/api/health` → 200 OK toujours

### Frontend (React + TypeScript + Vite)
- **Framework** : React 18 + TypeScript
- **Build Tool** : Vite 5.4
- **API Client** : Axios avec intercepteurs JWT
- **State** : Zustand (optionnel, utilisé en dev)

---

## 🔗 Configuration CORS

**Origines autorisées** :
- ✅ https://sigac-frontend-5tba4lw5i-steves-projects-60de588f.vercel.app (Vercel)
- ✅ http://localhost:5674 (dev local)
- ✅ http://localhost:5173 (dev Vite)
- ✅ Plus : toutes les origines localhost en dev

**Headers CORS** :
- `Access-Control-Allow-Origin` : Dynamique selon config
- `Access-Control-Allow-Methods` : GET, POST, PUT, DELETE, OPTIONS
- `Access-Control-Allow-Headers` : *, Authorization
- `Access-Control-Allow-Credentials` : true

---

## 🚀 Workflows

### Déploiement Frontend
```bash
# Push vers main
git add . && git commit -m "..." && git push origin main

# Vercel redéploie automatiquement
# OU redéployer manuellement:
cd sigac-frontend && vercel --prod --force
```

### Déploiement Backend
```bash
# Push vers main
git add . && git commit -m "..." && git push origin main

# Render redéploie automatiquement via Blueprint
# Logs: https://dashboard.render.com/
```

### Développement Local
```bash
# Terminal 1 - Backend
cd sigac-backend
dotnet run --project SIGAC.API
# Accès: http://localhost:5210 (local) ou https://sigac-api.onrender.com (prod)

# Terminal 2 - Frontend
cd sigac-frontend
npm run dev
# Accès: http://localhost:5674
# Auto-proxy vers API Render
```

---

## 🔒 Sécurité

### JWT
- Secret auto-généré par Render
- Stocké en `localStorage`
- Refresh automatique après expiration
- Validé sur chaque requête API

### PostgreSQL
- SSL Mode: Required
- Connection pooling: Automatique
- Backups: Render managé

### HTTPS
- Vercel : Auto avec Let's Encrypt
- Render API : Auto avec Let's Encrypt

---

## 📊 Problèmes Résolus

| # | Problème | Solution |
|---|----------|----------|
| 1 | CORS bloqué | Config CORS avec parsing JSON + hardcoding URL Vercel |
| 2 | PostgreSQL URL format | Conversion URI → EF Core format |
| 3 | Port binding | Kestrel `ListenAnyIP(10000)` |
| 4 | Health check 503 | Retour 200 toujours, DB status informationnel |
| 5 | Database vide | DbInitializer avec 5 users de test |
| 6 | API client URL | Fallback `/api` pour proxy Vercel |

---

## 🎯 Prochaines Étapes (Optionnel)

1. **Freebox Frontend** : Uploader sur serveur web Freebox (fichiers déjà uploadés en FTPES)
2. **Custom Domain** : Configurer domaine personnalisé
3. **Monitoring** : Sentry/DataDog pour les erreurs
4. **Tests E2E** : Cypress ou Playwright
5. **CI/CD** : GitHub Actions pour tests automatiques

---

## 📝 Commits Clés

```
535dad3 - Improve CORS configuration with logging and hardcode Vercel URL
0370fbc - Remove Vercel proxy, use direct Render API URL in production
90011d9 - Fix: Use relative URL /api as default for Vercel proxy
96f2684 - Fix: Remove invalid env property from vercel.json
c4c69b5 - Add Vercel config with API proxy for production deployment
```

---

## 🆘 Support & Déboggage

### Logs
- **Backend** : https://dashboard.render.com/ (Logs onglet)
- **Frontend** : Browser console (F12)
- **API Health** : https://sigac-api.onrender.com/api/health

### Tests
- **Login** : Tester avec admin/Admin@2024!
- **CORS** : Vérifier Network tab (F12) - Headers de réponse
- **Database** : Vérifier via DBeaver ou pgAdmin (credentials en render.yaml)

### Erreurs Communes

**401 Unauthorized** :
- ✓ JWT expiré → Refresh automatique
- ✓ Token malformé → Re-login

**403 Forbidden** :
- ✓ RBAC appliqué (juges ne voient que leurs dossiers)
- ✓ Admin peut tout voir

**500 InternalServerError** :
- ✓ Check logs Render
- ✓ Vérifier RequestId en réponse JSON

---

## 📞 Contacts

**Vercel** : https://vercel.com/dashboard
**Render** : https://dashboard.render.com/
**GitHub** : https://github.com/stevendolela/SIGAC

---

**Déploiement complété le 5 décembre 2025 ✅**
