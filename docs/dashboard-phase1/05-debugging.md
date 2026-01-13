# 🔍 DEBUGGING: Graphique Connexions Utilisateurs Invisible

## Status: Graphique ne s'affiche pas sur production

### Quick Checklist

**[  ] Étape 1: Vérifier que tu es Admin ou Manager**
```
- Se connecter comme admin
- Aller à Dashboard
- Si le graphique n'apparaît toujours pas → continue
```

**[  ] Étape 2: Vérifier la console du navigateur (F12)**
```
F12 → Console → Chercher les erreurs
- Erreur JS?
- Erreur API?
- Undefined variables?
```

**[  ] Étape 3: Vérifier l'onglet Network (F12)**
```
F12 → Network → Filtrer "statistics"
Chercher: GET /api/dashboard/statistics?...
- Status: 200 OK?
- Response contient "userConnections"?
```

**[  ] Étape 4: Vérifier localStorage**
```
F12 → Console → Taper:
JSON.parse(localStorage.getItem('user'))

Regarde:
- role = "Admin" ou "Manager"?
- workspaceId existe?
```

**[  ] Étape 5: Test API Direct**
```bash
# Récupère ton token après login
curl -X POST "https://sigac-api.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}'

# Copie le token et teste:
TOKEN="..."
curl -X GET "https://sigac-api.onrender.com/api/dashboard/statistics?periodeDays=30" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.userConnections'

Expected: Array d'utilisateurs ou null/vide
```

---

## 🔧 Problèmes Courants & Solutions

### Problème 1: Graphique pas visible (role != Admin/Manager)

**Symptôme:** Graphique n'apparaît pas du tout

**Solution:**
```
Se connecter avec:
- admin / Admin@2024! (Admin)
- OU tout utilisateur avec role "Manager"

Vérifier: F12 → console → localStorage.getItem('user')
```

### Problème 2: Backend n'a pas redéployé

**Symptôme:** userConnections = undefined en API response

**Vérifier:**
```
1. Aller à https://sigac-api.onrender.com/swagger
2. Chercher GET /api/dashboard/statistics
3. Essayer l'endpoint
4. Response contient "userConnections" field?
```

**Solution:**
```
Si missing:
1. Vérifier que SIGAC.Core/DTOs/DossierStatisticsDto.cs
   contient: public List<UserConnectionDto> UserConnections
   
2. Rebuild et push:
   dotnet build SIGAC.API/SIGAC.API.csproj --no-restore
   git push
```

### Problème 3: workspaceId pas envoyé

**Symptôme:** API retourne empty userConnections

**Vérifier:**
```
F12 → Network → chercher "statistics" request
Headers → Params → workspaceId présent?
```

**Solution:**
```
Frontend doit extraire workspaceId depuis:
localStorage.getItem('user') → user.workspaceId

Vérifier DashboardPage.tsx:
const [workspaceId, setWorkspaceId] = useState<string | null>(null)

useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user'))
  setWorkspaceId(user?.workspaceId || null)  ← doit être non-null
}, [])
```

### Problème 4: CSS not loaded

**Symptôme:** Graphique visible mais sans styling

**Solution:**
```
F12 → Styles → chercher ".chart-section-double"

Si absent → CSS pas chargé:
1. Ctrl+F5 (hard refresh)
2. Vider cache: Ctrl+Shift+Del
3. Recharger la page
```

### Problème 5: Render redeploy en cours

**Symptôme:** API retourne 500 error

**Vérifier:**
```
curl -s https://sigac-api.onrender.com/health

Si pas de réponse → redeploy en cours
Attendre 2-5 minutes
```

---

## 📊 Debug Response Format

### Expected API Response
```json
{
  "totalDossiers": 22,
  "nouveauxDossiers": 3,
  "enCours": 8,
  "userConnections": [
    {
      "userId": "00000000-0000-0000-0000-000000000001",
      "nomUtilisateur": "Administrator",
      "derniereConnexion": "2025-12-29T14:35:00Z",
      "joursDepuisDerniereConnexion": 0
    }
  ]
}
```

### If userConnections is missing
```json
{
  "totalDossiers": 22,
  "nouveauxDossiers": 3,
  // ← userConnections field is MISSING
  // Means: Backend didn't include it (role check failed or rebuild needed)
}
```

---

## 🎯 Step-by-Step Debugging

### 1. Verify Credentials
```bash
# Login to get token
curl -X POST "https://sigac-api.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}'

# Response should have:
# "token": "eyJhbGci..."
# "refreshToken": "..."
```

### 2. Verify API Endpoint
```bash
TOKEN="eyJhbGci..." # from above

curl -X GET "https://sigac-api.onrender.com/api/dashboard/statistics" \
  -H "Authorization: Bearer $TOKEN" \
  | jq 'keys' # List all keys

# Should include: "userConnections"
```

### 3. Verify Frontend Component
```
1. Open DevTools (F12)
2. Go to Console
3. Type: JSON.parse(localStorage.getItem('user'))
4. Check:
   - role = "Admin" or "Manager"?
   - workspaceId = valid GUID?
```

### 4. Verify CSS is Loaded
```
F12 → Elements → Search for <div class="chart-section-double">
If found: CSS should load (refresh if not visible)
If not found: Component isn't rendering (check console for errors)
```

### 5. Check Network Request
```
F12 → Network
Filter: statistics
Look for: GET /api/dashboard/statistics?...

Click on request:
- Response tab: Is "userConnections" present?
- Headers tab: Is "Authorization" header present?
```

---

## 🚀 Quick Fixes to Try

1. **Hard Refresh**
   ```
   Ctrl+F5 (or Cmd+Shift+R on Mac)
   ```

2. **Clear Cache**
   ```
   F12 → Application → Storage → Clear Site Data
   Then refresh
   ```

3. **Logout & Login**
   ```
   - Click logout
   - Login again as admin
   - Check dashboard
   ```

4. **Check Backend Logs**
   ```
   docker-compose logs -f api | grep dashboard
   ```

5. **Verify Backend Build**
   ```
   cd sigac-backend
   dotnet build SIGAC.API/SIGAC.API.csproj --no-restore
   # Should show: Build succeeded. 0 Error(s)
   ```

---

## 📝 If Still Not Working

### Option 1: Check Render Status
```
1. Go to https://dashboard.render.com
2. Find "SIGAC Backend" service
3. Check "Activity" tab for recent deployments
4. Check "Logs" for any errors
```

### Option 2: Check Vercel Status
```
1. Go to https://vercel.com/dashboard
2. Find "taajii" project
3. Check "Deployments" tab
4. Latest deployment status?
```

### Option 3: Force Manual Redeploy

**Render Backend:**
```
1. Dashboard.render.com
2. SIGAC service
3. Click "Manual Deploy"
4. Wait 2-5 minutes
```

**Vercel Frontend:**
```
1. vercel.com/dashboard
2. taajii project
3. Click "Redeploy"
4. Wait 1-2 minutes
```

---

## 🆘 Emergency Debug Command

Run this if everything fails:

```bash
# 1. Frontend check
curl -s https://taajii.fr/index.html | grep -o "chart-section-double" && echo "✅ CSS found" || echo "❌ CSS missing"

# 2. Backend check
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  "https://sigac-api.onrender.com/api/dashboard/statistics" | jq '.userConnections' && echo "✅ Data found" || echo "❌ Data missing"

# 3. Local build check
cd /workspaces/SIGAC/sigac-frontend && npm run build 2>&1 | grep -E "✓|error"
```

---

## 📊 Checklist Récapitulatif

- [  ] Connecté en tant qu'Admin ou Manager?
- [  ] Backend a redéployé (Render)?
- [  ] Frontend a redéployé (Vercel)?
- [  ] workspaceId envoyé dans API call?
- [  ] userConnections retourné par API?
- [  ] Pas d'erreurs console (F12)?
- [  ] Graphique "🔗 Dernières Connexions GED" visible?
- [  ] Données affichées correctement?
- [  ] Indicateurs couleur corrects?

---

## 📞 Besoin d'Aide?

Envoie moi:
1. Screenshot de la console F12
2. Output du curl à l'API
3. localStorage user object
4. Status de Render/Vercel

Je pourrai alors identifier le problème exact!

