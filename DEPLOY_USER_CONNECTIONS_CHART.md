# Déploiement: Graphique Connexions Utilisateurs - Dashboard Phase 1

## 📌 Résumé

Nouvelle fonctionnalité: **Graphique "Dernières Connexions GED"** pour Admin/Manager

**Localisation:** Dashboard Phase 1 - À droite du graphique "Répartition par Statut"

**Données:** Affiche les utilisateurs du workspace avec leur dernière connexion

**Visible uniquement pour:** Admin et Manager

---

## 🚀 Déploiement (Automatique)

### 1️⃣ Backend (Render)

```bash
# Les changements ont déjà été pushés
# Render détecte automatiquement et redeploy

# ✅ Vérifier le déploiement
curl -s https://sigac-api.onrender.com/health | jq .
```

**Changements backend:**
- ✅ `UserConnectionDto` class créée
- ✅ `IUserRepository.GetWorkspaceUserConnectionsAsync()` implémentée
- ✅ `DashboardService` met à jour pour fetcher user connections
- ✅ `DashboardController` accepte paramètre `workspaceId`
- ✅ Compilation: 0 erreurs

### 2️⃣ Frontend (Vercel)

```bash
# Les changements ont déjà été pushés
# Vercel détecte automatiquement et redeploy

# ✅ Vérifier le déploiement
curl -s https://taajii.fr/ | grep -o "taajii"
```

**Changements frontend:**
- ✅ `DashboardPage.tsx` intègre `workspaceId`
- ✅ `Dashboard.css` ajoute styles `.chart-section-double` et `.connection-*`
- ✅ `dashboardApi.ts` accepte `workspaceId` en parameter
- ✅ `dashboard.ts` types ajoutent `UserConnectionDto`
- ✅ Build: ✓ 2663 modules, 0 erreurs

---

## ✅ Vérification Post-Déploiement

### Endpoint API

```bash
# Test avec admin workspace
curl -X GET "https://sigac-api.onrender.com/api/dashboard/statistics?periodeDays=30&workspaceId=YOUR_WORKSPACE_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" | jq '.userConnections | .[0:3]'

# Résultat attendu:
# [
#   {
#     "userId": "...",
#     "nomUtilisateur": "Admin User",
#     "derniereConnexion": "2025-12-29T14:35:00Z",
#     "joursDepuisDerniereConnexion": 0
#   },
#   ...
# ]
```

### Frontend Visual

1. Aller à **https://taajii.fr/dashboard**
2. Se connecter en tant qu'**Admin**
3. Vérifier que:
   - [ ] Le graphique "🔗 Dernières Connexions GED" s'affiche
   - [ ] Les utilisateurs du workspace s'affichent
   - [ ] Les couleurs correspondent aux jours depuis connexion
   - [ ] Layout: 2 graphiques côte à côte (status + connexions)

### Swagger Documentation

Vérifier que le nouvel endpoint est documenté:
```
https://sigac-api.onrender.com/swagger
→ GET /api/dashboard/statistics
→ Paramètre `workspaceId` (optional)
→ Response: `DashboardStatisticsDto` avec `userConnections`
```

---

## 🎨 Graphique: Design & Codage Couleur

### Layout

```
┌─ Dashboard Phase 1 ──────────────────────────────────────┐
│                                                           │
│  ┌─ Répartition par Statut ─┬─ Connexions GED ────────┐  │
│  │                          │                         │  │
│  │ 🆕 Nouveau      (3)  ███ │ 🟢 Admin    Actif ████ │  │
│  │ 📝 En Cours     (8)  ███ │ 🟠 Président Il y a 2j  │  │
│  │ 💭 Validation   (2)  ██  │ 🟠 Juge1    Il y a 5j   │  │
│  │ ✅ Validé       (7)  ███ │ ⚫ Juge2    Inactif    │  │
│  │ 📦 Terminé      (2)  ██  │ +1 autres              │  │
│  │                          │                         │  │
│  └──────────────────────────┴─────────────────────────┘  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Codage Couleur: Jours depuis Connexion

| Couleur | Jours | Indicateur | Barre | Label |
|---------|-------|-----------|-------|-------|
| 🟢 Vert | 0 | Pulse (animation) | Gradient vert | "Actif aujourd'hui" |
| 🟠 Orange | 1-7 | Statique | Gradient orange | "Il y a Xj" |
| ⚫ Gris | >30 | Statique | Très court | "Inactif" |

### Animations

```css
/* Indicateur vert: pulse continu */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Barre de progression: transition smooth */
transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 📊 Données Attendues

### UserConnectionDto

```csharp
public class UserConnectionDto
{
    public Guid UserId { get; set; }
    public string NomUtilisateur { get; set; }           // Display name or username
    public DateTime? DerniereConnexion { get; set; }     // Last login timestamp
    public int JoursDepuisDerniereConnexion { get; set; } // Calculated days since
}
```

### DashboardStatisticsDto.UserConnections

```csharp
public List<UserConnectionDto> UserConnections { get; set; } = new();
```

**Conditions:**
- Seulement populé si `userRole == Admin || Manager`
- Seulement les utilisateurs du workspace spécifié
- Seulement utilisateurs `IsActive = true`
- Trié par `LastLogin` descendant (plus récents en premier)
- Max 8 affichés frontend

---

## 🛡️ Vérifications de Sécurité

- [ ] **RBAC:** Seulement Admin/Manager peuvent voir les données
- [ ] **Workspace Isolation:** Pas de cross-workspace data leak
- [ ] **SQL Injection:** Utilise LINQ/EF Core (paramétrisé)
- [ ] **Authentication:** JWT Bearer token requis
- [ ] **Authorization:** Rôle vérifié en Service layer
- [ ] **Data Filtering:** Utilisateurs filtrés par workspace + isActive

---

## 📱 Responsive Design

### Desktop (>1024px)
```
[Chart 1: 50%] [Chart 2: 50%]  ← Side-by-side
```

### Tablet (768-1024px)
```
[Chart 1: 100%]
[Chart 2: 100%]  ← Stacked
```

### Mobile (<768px)
```
[Chart 1: 100%]
[Chart 2: 100%]  ← Stacked, responsive font
```

---

## 🔍 Vérification des Commits

```bash
# Vérifier les commits
git log --oneline | head -10

# Résultat attendu:
9506a85 feat: Add user connection time visualization to dashboard
f7da348 feat: Add workspace user connection tracking to dashboard
5607e3c (origin/main) refactor: Rename 'Taux de Complétude' to 'Taux de Traitement'
...
```

---

## 🧪 Test Quick Start

### 1. Login Admin
```
Email: admin
Password: Admin@2024!
```

### 2. Aller au Dashboard
```
Navigate to: /dashboard
```

### 3. Vérifier le Graphique
```
Expected:
- "🔗 Dernières Connexions GED" visible
- Admin user shown as "Actif aujourd'hui" (vert)
- Other users with connection timestamps
- Layout: Status chart (left) + Connections chart (right)
```

### 4. Test Collaborateur (Hidden)
```
Login: juge.mbala / Juge@2024!
Navigate to: /dashboard
Expected: "Dernières Connexions GED" chart NOT visible
Only "Répartition par Statut" visible
```

---

## 📋 Checklist Déploiement

- [x] Backend compile sans erreurs (0 errors)
- [x] Frontend compile sans erreurs (0 errors)
- [x] Backend changementscommitted
- [x] Frontend changements committed
- [ ] Render redeploy complet (peut prendre 2-5 min)
- [ ] Vercel redeploy complet (peut prendre 1-2 min)
- [ ] API endpoint testé (curl ou Swagger)
- [ ] Frontend visually verified (Chrome inspector)
- [ ] RBAC vérifiée (Admin voir, Collaborateur non)
- [ ] Responsive design testé (mobile/tablet/desktop)

---

## 🆘 Troubleshooting

### Graphique pas visible

**Cause:** Rôle utilisateur insuffisant
```
Solution: Se connecter en tant qu'Admin ou Manager
```

### Données vides

**Cause:** workspaceId non envoyé ou invalide
```
Solution: Vérifier localStorage['user'].workspaceId
```

### Erreur 401

**Cause:** JWT token expiré
```
Solution: Se reconnecter
```

### Layout cassé

**Cause:** CSS pas chargé correctement
```
Solution: 
1. Ctrl+F5 (hard refresh)
2. Vider cache du navigateur
3. Vérifier que Dashboard.css a les styles .chart-section-double
```

### Backend erreur

**Cause:** Repository method failed
```
Solution:
1. Vérifier logs: docker logs sigac-api
2. Vérifier DB connection: docker exec sigac-postgres psql -U sigac_user -c "SELECT COUNT(*) FROM Users;"
3. Check Render dashboard: https://dashboard.render.com
```

---

## 📞 Support

Pour toute question:
1. Vérifier les logs: `docker-compose logs -f`
2. Vérifier Swagger: http://localhost:5210/swagger
3. Vérifier Render logs: https://dashboard.render.com → Logs

