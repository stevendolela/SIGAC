# 🔍 GUIDE - VÉRIFIER LES DÉPLOIEMENTS

**Date**: 6 décembre 2025  
**Commit**: c8e0828 (main branch)

---

## 📊 DÉPLOIEMENTS EN COURS

Les modifications ont été poussées vers GitHub et les déploiements automatiques sont activés.

### Statut en Temps Réel

| Service | Plateforme | Statut | Lien |
|---------|-----------|--------|------|
| **Backend** | Render | ⏳ Deploying | https://dashboard.render.com/ |
| **Frontend** | Vercel | ⏳ Deploying | https://vercel.com/dashboard |
| **Database** | Render PostgreSQL | ✅ Stable | (interne) |

---

## 🔴 RENDER (Backend)

### 1. Vérifier le Déploiement en Cours

```
1. Aller sur: https://dashboard.render.com/
2. Sélectionner le projet: TAJI
3. Service: sigac-api
4. Tab: Deployments
5. Chercher le déploiement le plus récent (devrait être "In Progress" ou "Completed")
```

### 2. Vérifier les Logs de Build

```
1. Dans Deployments, cliquer sur le déploiement récent
2. Lire les logs pour:
   ✅ "Building Docker image" - début de build
   ✅ "Pushing Docker image" - build réussi
   ✅ "Starting service" - démarrage du service
   ✅ "Service running" ou "Live" - succès!
```

**Erreurs possibles** (chercher ces logs):
```
❌ "Build failed" → Vérifier docker/Dockerfile.api
❌ "Health check failed" → Service démarre mal
❌ "SIGAC.API exited" → Erreur d'exécution
```

### 3. Tester le Health Check (Une fois déployé)

```bash
# Via Terminal
curl https://sigac-api.onrender.com/api/health

# Résultat attendu:
{
  "status": "healthy"
}
```

### 4. Tester Swagger UI (Une fois déployé)

```
1. Aller sur: https://sigac-api.onrender.com/swagger
2. Devrait voir la page Swagger UI
3. Endpoints disponibles:
   - /api/Auth/login
   - /api/Users
   - /api/Users/{id}
   - /api/Users/deleted
   - (autres endpoints)
```

### 5. Test Complet (Une fois déployé)

```bash
# 1. Login
TOKEN=$(curl -s -X POST https://sigac-api.onrender.com/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}' | jq -r '.token')

echo "Token: $TOKEN"

# 2. Créer utilisateur
curl -X POST https://sigac-api.onrender.com/api/Users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "test.user.prod",
    "email": "test.prod@example.com",
    "password": "TestPassword123!",
    "role": 3
  }' | jq .

# 3. Lister utilisateurs
curl https://sigac-api.onrender.com/api/Users \
  -H "Authorization: Bearer $TOKEN" | jq .

# 4. Lister utilisateurs supprimés
curl https://sigac-api.onrender.com/api/Users/deleted \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## 🟢 VERCEL (Frontend)

### 1. Vérifier le Déploiement en Cours

```
1. Aller sur: https://vercel.com/dashboard
2. Chercher le projet sigac ou sigac-frontend
3. Tab: Deployments
4. Chercher le déploiement le plus récent (devrait être "Building" ou "Ready")
```

### 2. Vérifier les Logs de Build

```
1. Dans Deployments, cliquer sur le déploiement récent
2. Tab: Build Logs
3. Chercher:
   ✅ "Installing dependencies" - début
   ✅ "Running build" - npm run build
   ✅ "Deployed Successfully" - succès!
   ⚠️ "Warnings" - logs non-critiques OK
```

**Erreurs possibles**:
```
❌ "ERR! ENOENT" → npm install failed
❌ "TypeScript error" → Code TypeScript invalide
❌ "Build failed" → npm run build failed
```

### 3. Tester l'URL Production (Une fois déployé)

```
1. Aller sur: https://sigac-frontend.vercel.app
2. Devrait voir la page de login
3. Éléments chargés:
   ✅ Logo / Header
   ✅ Formulaire login
   ✅ Styles CSS appliqués
   ✅ Pas d'erreurs JavaScript (F12)
```

### 4. Test Complet (Une fois déployé)

```
1. Login: admin / Admin@2024!
2. Naviguer vers "Gestion des Utilisateurs"
3. Tester:
   ✅ Créer utilisateur
   ✅ Éditer utilisateur
   ✅ Supprimer utilisateur
   ✅ Voir notification "Utilisateur supprimé"
4. Vérifier Console (F12) pour erreurs
```

---

## ⏱️ TIMELINE D'ATTENTE

```
Render Build:     5-10 minutes (Docker image)
Vercel Build:     2-3 minutes (npm build)
Total:            10-15 minutes

Timestamps:
- 14:33 UTC: Render détecte le commit
- 14:33 UTC: Vercel détecte le commit
- 14:35-44 UTC: Render build en cours
- 14:35-38 UTC: Vercel build en cours
- 14:44-50 UTC: Déploiements finalisés ✅
```

**Attendre au moins 15 minutes avant de vérifier.**

---

## 🔗 LIENS DE SUIVI

### Dashboards (Recharger régulièrement)
- Render: https://dashboard.render.com/
- Vercel: https://vercel.com/dashboard
- GitHub: https://github.com/stevendolela/SIGAC

### Commits à Tracker
```
- 18c2448: feat: Add user soft delete with audit trail...
- c8e0828: docs: Add final deployment summary...
```

### URLs Production (Tester après déploiement)
```
Backend:
  Health: https://sigac-api.onrender.com/api/health
  Swagger: https://sigac-api.onrender.com/swagger

Frontend:
  URL: https://sigac-frontend.vercel.app
```

---

## ✅ CHECKLIST DE VÉRIFICATION

### Phase 1: Vérifier les Dashboards (Après 5 min)

- [ ] Render Dashboard montre nouveau déploiement
- [ ] Vercel Dashboard montre nouveau déploiement
- [ ] Les logs sont accessibles

### Phase 2: Vérifier les Builds (Après 10 min)

- [ ] Render build "In Progress" ou "Live"
- [ ] Vercel build "Completed" ou "Ready"
- [ ] Pas d'erreurs dans les logs

### Phase 3: Tester Health Checks (Après 15 min)

```bash
# Backend Health
curl https://sigac-api.onrender.com/api/health
# Résultat: {"status":"healthy"}

# Frontend Load
curl -I https://sigac-frontend.vercel.app/
# Résultat: HTTP/2 200
```

### Phase 4: Tester les APIs (Après 15 min)

- [ ] Login réussit (admin / Admin@2024!)
- [ ] Créer utilisateur réussit
- [ ] Supprimer utilisateur réussit
- [ ] Notifications affichées
- [ ] Pas d'erreurs console (F12)

---

## 🚨 TROUBLESHOOTING

### Render Build Failed

```
Problème: "Build failed" dans les logs Render

Solutions:
1. Vérifier Dockerfile.api pour syntax errors
2. Vérifier que les dépendances .NET sont correctes
3. Vérifier appsettings.Production.json
4. Cliquer "Clear build cache and redeploy" sur Render
5. Vérifier les variables d'environnement Render
```

**Commande pour tester localement**:
```bash
cd sigac-backend
dotnet build SIGAC.API/SIGAC.API.csproj --no-incremental
```

### Vercel Build Failed

```
Problème: "Build failed" dans les logs Vercel

Solutions:
1. Vérifier npm install (dépendances)
2. Vérifier TypeScript errors (tsc --noEmit)
3. Vérifier vercel.json configuration
4. Cliquer "Redeploy" sur Vercel Dashboard
5. Vérifier les environment variables Vercel
```

**Commande pour tester localement**:
```bash
cd sigac-frontend
npm install
npm run build
```

### Health Check Failed

```
Problème: Service est déployé mais health check échoue

Solutions:
1. Vérifier appsettings.Production.json
2. Vérifier la connexion database
3. Vérifier les logs pour exceptions
4. Vérifier les variables d'environnement:
   - ASPNETCORE_ENVIRONMENT = Production
   - ConnectionStrings__DefaultConnection (DB)
5. Redéployer manuellement sur Render
```

### Frontend Cannot Connect Backend

```
Problème: Erreur "Cannot connect to backend" dans console

Solutions:
1. Vérifier VITE_API_URL environment variable
2. Vérifier CORS sur backend:
   Cors__AllowedOrigins doit inclure https://sigac-frontend.vercel.app
3. Vérifier que backend est online:
   curl https://sigac-api.onrender.com/api/health
4. Vérifier appsettings.Production.json Cors settings
5. Redéployer le backend avec CORS correct
```

---

## 📞 SUPPORT

### Si Quelque Chose Ne Fonctionne Pas

1. **Vérifier les logs**:
   - Render: Dashboard → sigac-api → Logs
   - Vercel: Dashboard → Project → Deployments → [recent] → Logs

2. **Chercher l'erreur exacte** dans les logs

3. **Solutions communes**:
   - Clear cache and redeploy
   - Vérifier les variables d'environnement
   - Vérifier les commit localement (dotnet build, npm build)
   - Relancer le déploiement manuellement

4. **Contacts**:
   - GitHub Issues: https://github.com/stevendolela/SIGAC/issues
   - Render Support: https://render.com/support
   - Vercel Support: https://vercel.com/support

---

## 🎯 RÉSUMÉ

**Ce qu'on a fait**:
1. ✅ Code modifié et poussé vers GitHub
2. ✅ Render auto-deploy déclenché
3. ✅ Vercel auto-deploy déclenché
4. ⏳ Attendre 10-15 minutes

**Ce qu'on doit faire**:
1. ⏳ Attendre les déploiements
2. ✅ Vérifier les dashboards (Render + Vercel)
3. ✅ Tester les URLs production
4. ✅ Valider les fonctionnalités

**Prochaines étapes** (après vérification):
- Tester le soft delete en production
- Vérifier les logs d'audit
- Documenter les résultats
- Célébrer le déploiement réussi 🎉

---

*Guide de vérification - 6 décembre 2025*  
**Status**: ✅ Déploiements en cours  
**Temps restant**: ~10-15 minutes
