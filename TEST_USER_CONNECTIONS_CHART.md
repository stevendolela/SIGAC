# Test: Graphique Connexions Utilisateurs - Dashboard Phase 1

## 📋 Vue d'ensemble
Test complet du nouveau graphique "Dernières Connexions GED" visible uniquement aux Admin/Manager, montrant le temps de connexion des utilisateurs du workspace.

## ✅ Checklist de Test

### Backend
- [ ] API endpoint `/api/dashboard/statistics?workspaceId={guid}` retourne `UserConnections`
- [ ] `UserConnections` contient uniquement les utilisateurs actifs du workspace spécifié
- [ ] Chaque `UserConnectionDto` contient:
  - [ ] `UserId` (Guid)
  - [ ] `NomUtilisateur` (string - nom complet ou username)
  - [ ] `DerniereConnexion` (DateTime? - timestamp de dernière connexion)
  - [ ] `JoursDepuisDerniereConnexion` (int - jours calculés)
- [ ] Les utilisateurs sont triés par `LastLogin` décroissant (plus récents en premier)
- [ ] Pas d'erreur lors de l'appel avec workspace valide
- [ ] Pas d'erreur lors de l'appel sans workspaceId (should return empty)
- [ ] Seuls Admin et Manager peuvent accéder à `UserConnections`

### Frontend - Structure
- [ ] Nouveau div `.chart-section-double` avec grid 2 colonnes
- [ ] `.chart-wrapper` pour chaque graphique
- [ ] Répartition par Statut affichée dans colonne 1
- [ ] Graphique Connexions affichée dans colonne 2
- [ ] Les deux graphiques sont côte à côte sur desktop

### Frontend - Graphique Connexions
- [ ] Titre: "🔗 Dernières Connexions GED"
- [ ] Affiché UNIQUEMENT pour Admin et Manager
- [ ] Affiche max 8 utilisateurs (limité)
- [ ] "+X autres utilisateurs" si plus de 8 users
- [ ] Chaque ligne utilisateur contient:
  - [ ] Indicateur couleur animé (pulsing pour actif)
  - [ ] Nom utilisateur (tronqué s'il est long)
  - [ ] Barre de progression visuelle
  - [ ] Statut: "Actif aujourd'hui", "Il y a Xj", ou "Inactif"

### Frontend - Codage Couleur
- [ ] **Vert (#10b981)**: Connecté dans les 24 dernières heures
  - [ ] Indicateur: Animé (pulse)
  - [ ] Barre: gradient vert
  - [ ] Label: "Actif aujourd'hui"
- [ ] **Orange (#f59e0b)**: Connecté 2-7 jours ago
  - [ ] Indicateur: Statique
  - [ ] Barre: gradient orange
  - [ ] Label: "Il y a Xj"
- [ ] **Gris (#6b7280)**: Inactif > 30 jours ou jamais connecté
  - [ ] Indicateur: Statique
  - [ ] Barre: très courte (5%)
  - [ ] Label: "Inactif"

### Frontend - Responsive
- [ ] Desktop (>1024px): 2 colonnes côte à côte
- [ ] Tablet (768-1024px): 1 colonne empilée
- [ ] Mobile (<768px): 1 colonne empilée, textes ajustés

### Frontend - Intégration API
- [ ] `dashboardApi.getStatistics(periodeDays, workspaceId)` accepte workspaceId
- [ ] workspaceId est récupéré depuis localStorage sous user.workspaceId
- [ ] workspaceId est envoyé en query param à l'API
- [ ] Response inclut `userConnections` array

### API Client
- [ ] Axios utilise Bearer token correctement
- [ ] Pas d'erreur 401 (auth invalide)
- [ ] Pas d'erreur 403 (forbidden)
- [ ] Pas d'erreur 404 (workspace not found)

### Données de Test Attendues

**Utilisateurs dans le workspace "SIGAC Test":**
```
1. admin (Admin) → LastLogin: aujourd'hui → "Actif aujourd'hui" ✅
2. president.benoit (President) → LastLogin: -2j → "Il y a 2j" 🟠
3. juge.mbala (JugeConstitutionnel) → LastLogin: -5j → "Il y a 5j" 🟠
4. juge.tshisekedi (JugeConstitutionnel) → LastLogin: -15j → "Il y a 15j" 🟠
5. juge.kabongo (JugeConstitutionnel) → LastLogin: -45j → "Inactif" ⚫
```

## 🧪 Scénarios de Test

### Scenario 1: Admin Voir le Graphique
**Prérequis:** Connecté en tant qu'Admin
```
1. Aller au dashboard
2. Vérifier que le graphique "🔗 Dernières Connexions GED" est visible
3. Vérifier que les utilisateurs du workspace s'affichent
4. Vérifier les couleurs correctes selon les jours depuis connexion
5. Cliquer sur "Actualiser" → données mises à jour
6. Changer le filtre de période → graphique reste visible et à jour
```

### Scenario 2: Manager Voir le Graphique
**Prérequis:** Connecté en tant que Manager
```
1. Aller au dashboard
2. Vérifier que le graphique "🔗 Dernières Connexions GED" est visible
3. Doit voir les mêmes utilisateurs que Admin
4. Fonctionnalités identiques à Admin
```

### Scenario 3: Collaborateur Ne Pas Voir le Graphique
**Prérequis:** Connecté en tant que Collaborateur (non-Admin/non-Manager)
```
1. Aller au dashboard
2. Vérifier que le graphique "🔗 Dernières Connexions GED" est ABSENT
3. Vérifier que seul le graphique "Répartition par Statut" est présent
```

### Scenario 4: Responsive Design
**Desktop (1200px):**
```
1. Les deux graphiques (Statut + Connexions) sont côte à côte
2. Chaque graphique prend 50% de la largeur
```

**Tablet (900px):**
```
1. Les deux graphiques sont empilés verticalement
2. Chaque graphique prend 100% de la largeur
```

**Mobile (375px):**
```
1. Les deux graphiques sont empilés verticalement
2. Textes et indicateurs sont lisibles
3. Pas de débordement horizontal
```

### Scenario 5: Pas de Données
**Condition:** Workspace sans utilisateurs (ou nouveau workspace)
```
1. Dashboard se charge sans erreur
2. Graphique Connexions ne s'affiche pas (condition: length > 0)
3. Répartition par Statut s'affiche normalement
```

### Scenario 6: Animation et Interaction
```
1. Indicateurs couleur vert: Pulsent continuellement
2. Indicateurs orange/gris: Statiques, pas de pulse
3. Survol d'une ligne: Fond change de couleur
4. Barre de progression: Animation smooth lors du chargement
```

## 🔍 Vérification des Données

### URL à tester
```
GET https://sigac-api.onrender.com/api/dashboard/statistics?periodeDays=30&workspaceId={workspaceId}
```

### Response attendue (avec UserConnections):
```json
{
  "totalDossiers": 22,
  "nouveauxDossiers": 3,
  "enCours": 8,
  "enValidation": 2,
  "valides": 7,
  "termines": 2,
  "archives": 0,
  "parType": { "Ordinaire": 12, "Urgente": 10 },
  "userConnections": [
    {
      "userId": "admin-uuid",
      "nomUtilisateur": "Administrator",
      "derniereConnexion": "2025-12-29T14:35:00Z",
      "joursDepuisDerniereConnexion": 0
    },
    {
      "userId": "president-uuid",
      "nomUtilisateur": "Benoît Président",
      "derniereConnexion": "2025-12-27T09:20:00Z",
      "joursDepuisDerniereConnexion": 2
    },
    {
      "userId": "juge1-uuid",
      "nomUtilisateur": "Mbala Juge",
      "derniereConnexion": null,
      "joursDepuisDerniereConnexion": 2147483647
    }
  ],
  "lastUpdated": "2025-12-29T14:40:00Z"
}
```

## 📊 Métriques de Succès

| Métrique | Critère | Status |
|----------|---------|--------|
| Affichage Admin | Graphique visible pour Admin | ⏳ |
| Affichage Manager | Graphique visible pour Manager | ⏳ |
| Masquage Collaborateur | Graphique caché pour Collaborateur | ⏳ |
| Données Workspace | Affiche seulement les users du workspace | ⏳ |
| Tri Chronologique | Utilisateurs triés par connexion récente | ⏳ |
| Codage Couleur | Couleurs correctes selon les jours | ⏳ |
| Responsive | Layout correct sur desktop/tablet/mobile | ⏳ |
| Performance | Chargement < 2 sec | ⏳ |
| Pas d'erreur | Aucune erreur console/API | ⏳ |

## 🚀 Déploiement

### Backend (Render)
```bash
git push origin main
# Render détecte le changement et redeploy automatiquement
# ✅ Vérifier: https://sigac-api.onrender.com/swagger
```

### Frontend (Vercel)
```bash
git push origin main
# Vercel détecte le changement et redeploy automatiquement
# ✅ Vérifier: https://taajii.fr/dashboard
```

### Vérification Post-Déploiement
- [ ] Frontend build sans erreur
- [ ] Backend build sans erreur
- [ ] Dashboard charge le nouveau graphique
- [ ] Swagger API affiche le nouvel endpoint
- [ ] Pas d'erreur dans les logs

## 📝 Notes

- Le graphique affiche max 8 utilisateurs pour lisibilité
- Les utilisateurs inactifs (>30j) ont une barre très courte (5%)
- L'indicateur vert pulse continuellement (animation CSS)
- Responsive design utilise media query @media (max-width: 1024px)
- WorkspaceId est optional dans l'API (si absent, pas de données)

## 🐛 Troubleshooting

| Problème | Solution |
|----------|----------|
| Graphique pas visible | Vérifier rôle (Admin/Manager uniquement) |
| Données vides | Vérifier que workspaceId est envoyé |
| Erreur 401 | JWT token expiré → se reconnecter |
| Erreur 403 | Rôle insuffisant pour cette route |
| Erreur 404 | WorkspaceId inexistant en DB |
| Layout cassé | Rafraîchir la page (F5) ou vider cache |

