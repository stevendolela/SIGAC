# ✅ GUIDE RAPIDE - Mise à Jour Production Phase 1

**Status**: 🔄 Déploiement en cours (auto-deploy déclenché)  
**Commit**: 11b1a0a  
**Date**: 17 décembre 2024

---

## 📍 Où tu en es maintenant

✅ Code Phase 1 + Workspace poussé sur GitHub (commit ce75234 + 11b1a0a)  
🔄 Render redéploie automatiquement (5-10 min)  
🔄 Vercel redéploie automatiquement (2-3 min)  
⏳ Migration database à appliquer manuellement après

---

## 🎯 Étapes à Suivre (Simple)

### Étape 1: Attendre le Déploiement (10 min) ⏳

**Option A** : Surveiller visuellement

1. **Render** :
   - Ouvre: https://dashboard.render.com/
   - Clique sur ton service backend
   - Onglet **"Events"** → Tu verras "Deploy started"
   - Attends que ça devienne **"Live"** (vert)

2. **Vercel** :
   - Ouvre: https://vercel.com/dashboard
   - Clique sur ton projet
   - Onglet **"Deployments"** → Le commit `11b1a0a` apparaît
   - Attends que ça devienne **"Ready"** (vert)

**Option B** : Script automatique

```bash
cd /Users/steve/Projects/SIGAC
chmod +x wait-and-test-deploy.sh
./wait-and-test-deploy.sh
# Va tester toutes les 2 minutes automatiquement
```

---

### Étape 2: Appliquer la Migration Database ⚙️

**IMPORTANT**: À faire une fois que Render est "Live"

#### Via Render Dashboard (Facile)

1. Ouvre: https://dashboard.render.com/
2. Clique sur ton **service backend** (ex: sigac-api)
3. Clique sur l'onglet **"Shell"** (en haut)
4. Dans le terminal qui s'ouvre, tape :

```bash
cd /app
dotnet ef database update --no-build
```

5. Attends ~30 secondes
6. Vérifie que les tables sont créées :

```bash
psql $DATABASE_URL -c "\dt" | grep -i workspace
```

Tu devrais voir :
```
public | Workspaces      | table | ...
public | WorkspaceUsers  | table | ...
```

#### Ou depuis ton Mac (Avancé)

1. Récupère l'**External Database URL** :
   - Dashboard Render → Database → "External Database URL"
   - Copie l'URL complète

2. Exécute :

```bash
cd /Users/steve/Projects/SIGAC/sigac-backend/SIGAC.Infrastructure

export ConnectionStrings__DefaultConnection="<PASTE_DATABASE_URL_HERE>"

dotnet ef database update --startup-project ../SIGAC.API
```

---

### Étape 3: Tester Tout 🧪

```bash
cd /Users/steve/Projects/SIGAC
./test-production-phase1.sh
```

**Résultat attendu** :
```
✅ Backend Health Check: OK
✅ Authentication JWT: OK
✅ Rate Limiting: OK (blocked at 6th attempt)
✅ Workspace API: OK
✅ Input Validation: OK (weak password rejected)
✅ Frontend: OK
✅ Database Migration: OK
```

---

### Étape 4: Vérifier Manuellement 🖱️

1. **Ouvre**: https://taajii.fr
2. **Login**: `admin` / `Admin@2024!`
3. **Vérifie** :
   - ✅ Sidebar a un **sélecteur de workspace** en haut
   - ✅ Si tu es admin, clique sur l'icône ⚙️ → Modal de gestion s'ouvre
   - ✅ Tu peux créer un nouveau workspace
   - ✅ Dashboard charge sans erreur

---

## 🆘 Si Problème

### Backend ne démarre pas

**Logs** :
```
Dashboard Render → Service → Logs
Chercher: [ERR] ou Exception
```

**Solution commune** : Migration pas appliquée
```bash
# Via Render Shell
cd /app
dotnet ef database update --no-build
```

### Rate Limiting ne marche pas

**Test** :
```bash
for i in {1..7}; do
  curl -w "Status: %{http_code}\n" \
    -X POST https://sigac-api.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
  sleep 0.3
done
# Devrait bloquer à la 6ème avec HTTP 429
```

**Solution** :
- Dashboard Render → Service → Environment
- Vérifie : `ENABLE_RATE_LIMITING = true`
- Si manquant, ajoute-le et redéploie

### Workspace UI manquant

**Console navigateur** (F12) :
- Chercher erreurs JavaScript
- Vérifier appels à `/api/workspaces`

**Solution** :
- Vercel Dashboard → Settings → Environment Variables
- Vérifie : `VITE_API_URL = https://sigac-api.onrender.com/api`
- Si modifié, redéploie

---

## 📊 Checklist Finale

Après avoir tout fait :

- [ ] Render : Status "Live" (vert)
- [ ] Vercel : Status "Ready" (vert)
- [ ] Migration database appliquée (tables Workspaces créées)
- [ ] Script de test : Tous ✅ verts
- [ ] Frontend charge : https://taajii.fr
- [ ] Login fonctionne
- [ ] Sélecteur workspace visible
- [ ] Rate limiting actif (test 7 requêtes)
- [ ] Validation password stricte active

---

## 🎉 Quand Tout est OK

Tu auras :

✅ **4 Features Sécurité Phase 1** :
- Rate Limiting (protection brute force)
- Input Validation (données propres)
- JWT sécurisé (variable d'environnement)
- HTTPS forcé (tout crypté)

✅ **GED Multi-Workspace** :
- Backend API complète (10 endpoints)
- Frontend UI intégré
- Gestion des workspaces
- Filtrage automatique des dossiers

✅ **Production Stable** :
- Auto-deploy actif
- Backups database quotidiens
- Monitoring Render + Vercel
- Documentation complète

---

## 🕐 Timeline

```
Maintenant        : Déploiement déclenché (auto)
+5 min            : Vercel ready
+10 min           : Render ready
+12 min           : Applique migration database
+15 min           : Teste tout
+20 min           : ✅ Production Phase 1 LIVE
```

---

## 📞 Aide

**Commandes Rapides** :

```bash
# Surveiller déploiement
./wait-and-test-deploy.sh

# Tester après déploiement
./test-production-phase1.sh

# Re-pousser si besoin
git commit --allow-empty -m "redeploy" && git push
```

**Dashboards** :
- Render: https://dashboard.render.com/
- Vercel: https://vercel.com/dashboard
- GitHub: https://github.com/stevendolela/SIGAC

**Docs** :
- `/UPDATE_PRODUCTION_PHASE1.md` : Guide complet
- `/DEPLOYMENT_GUIDE.md` : Déploiement initial
- `/SECURITY_PHASE_1_FINAL_REPORT.md` : Détails sécurité

---

**🎯 TU ES PRESQUE LÀ !**

Le déploiement est en cours automatiquement. Dans 10-15 minutes, applique juste la migration database et teste. C'est tout ! 🚀
