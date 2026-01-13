# 🚀 Quick Start: Graphique Connexions Utilisateurs

## 📥 Prérequis

- ✅ Backend buildé et déployé sur Render
- ✅ Frontend buildé et déployé sur Vercel
- ✅ JWT Token valide pour authentification
- ✅ Compte Admin ou Manager

## 🎯 Objectif

Tester le nouveau graphique "Dernières Connexions GED" visible uniquement aux Admin/Manager dans le Dashboard Phase 1.

---

## ⚡ 5 Étapes Rapides

### 1️⃣ Se Connecter en Admin
```
URL: https://taajii.fr/auth/login
Email: admin
Password: Admin@2024!
```

### 2️⃣ Aller au Dashboard
```
URL: https://taajii.fr/dashboard
```

### 3️⃣ Localiser le Nouveau Graphique
```
Position: À DROITE du graphique "Répartition par Statut"
Titre: 🔗 Dernières Connexions GED
```

### 4️⃣ Vérifier les Données
```
Expected:
- 🟢 Admin: "Actif aujourd'hui" (vert, indicateur pulse)
- 🟠 President: "Il y a 2j" (orange)
- 🟠 Juge1: "Il y a 5j" (orange)
- ⚫ Juge2: "Inactif" (gris)
- +1 autres
```

### 5️⃣ Tester l'Accès Manager
```
Se déconnecter
Se connecter en Manager

Expected: Graphique visible
```

---

## 🔍 Vérifications Détaillées

### ✅ Visuals

- [ ] Deux graphiques côte à côte sur desktop
- [ ] Répartition par Statut à gauche (ne pas avoir changé)
- [ ] Connexions GED à droite (nouveau)
- [ ] Indicateurs couleur: vert (pulse), orange, gris
- [ ] Barres de progression lisses et animées
- [ ] Max 8 utilisateurs affichés
- [ ] "+X autres" si plus de 8 users

### ✅ Interactions

- [ ] Survoler une ligne → fond change de couleur
- [ ] Cliquer "Actualiser" → données se rafraîchissent
- [ ] Changer filtre période → graphique se met à jour
- [ ] Barre se met à jour après actualisation

### ✅ Responsive

**Desktop (1200px):**
- [ ] 2 graphiques côte à côte (50% chacun)

**Tablet (900px):**
- [ ] 2 graphiques empilés (100% chacun)

**Mobile (375px):**
- [ ] 2 graphiques empilés
- [ ] Texte lisible
- [ ] Pas de débordement horizontal

### ✅ Sécurité

**Connecté en Admin:**
- [ ] Graphique visible ✅

**Connecté en Collaborateur (juge.mbala/Juge@2024!):**
- [ ] Graphique CACHÉ (seul Statut visible)

---

## 🧪 Scénarios de Test Avancés

### Scenario A: Filtre de Période
```
1. Sélectionner "Derniers 7 jours"
2. Vérifier que les données changent
3. Sélectionner "Dernier mois" 
4. Graphique se met à jour
5. Sélectionner "Tous les temps"
6. Pas de changement (pas de filtrage sur connexions)
```

### Scenario B: Recherche & Filtres
```
1. Si un filtre de recherche existe
2. Graphique doit rester visible et à jour
3. Les données doivent rester cohérentes
```

### Scenario C: Pagination
```
Si plus de 8 utilisateurs:
1. Les 8 plus récents doivent s'afficher
2. Le texte "+X autres" doit apparaître
3. Cliquer sur "+X autres" (si clickable):
   - Doit afficher les utilisateurs supplémentaires
   - Ou popup avec liste complète
```

### Scenario D: Utilisateurs Inactifs
```
1. Chercher un utilisateur inactif depuis > 30j
2. Vérifier:
   - Indicateur: Gris, statique
   - Barre: Très courte (5%)
   - Texte: "Inactif"
   - Pas de date spécifique
```

---

## 🔌 Test API Direct (Curl)

### Récupérer le Token

```bash
curl -X POST "https://sigac-api.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@2024!"
  }' | jq '.token'

# Copier le token (sans guillemets)
TOKEN="eyJhbGci..."
```

### Récupérer les Statistiques

```bash
# Avoir besoin du workspaceId (de l'admin)
WORKSPACE_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X GET "https://sigac-api.onrender.com/api/dashboard/statistics?periodeDays=30&workspaceId=$WORKSPACE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.userConnections | .[0:3]'
```

### Response Attendu

```json
[
  {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "nomUtilisateur": "Administrator",
    "derniereConnexion": "2025-12-29T14:35:00Z",
    "joursDepuisDerniereConnexion": 0
  },
  {
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "nomUtilisateur": "Benoît Président",
    "derniereConnexion": "2025-12-27T09:20:00Z",
    "joursDepuisDerniereConnexion": 2
  },
  {
    "userId": "550e8400-e29b-41d4-a716-446655440002",
    "nomUtilisateur": "Mbala Juge",
    "derniereConnexion": null,
    "joursDepuisDerniereConnexion": 2147483647
  }
]
```

---

## 🐛 Erreurs Courantes

### Erreur: Graphique pas visible

**Cause:** Connecté en tant que Collaborateur/non-Admin
```
Solution: Se connecter en Admin ou Manager
```

### Erreur: Données vides

**Cause:** workspaceId pas envoyé en paramètre
```
Solution: Vérifier localStorage['user'].workspaceId
```

### Erreur: 401 Unauthorized

**Cause:** JWT token expiré
```
Solution: Se reconnecter (login à nouveau)
```

### Erreur: 403 Forbidden

**Cause:** Rôle utilisateur insuffisant
```
Solution: Doit être Admin ou Manager pour accéder aux connexions
```

### Erreur: Layout cassé

**Cause:** CSS pas chargé correctement
```
Solution: 
1. Ctrl+F5 (hard refresh)
2. Ctrl+Shift+Del (clear cache)
3. Rouvrir le dashboard
```

---

## 📊 Checklist Finale

```
BACKEND
☐ API endpoint `/dashboard/statistics` fonctionne
☐ Paramètre `workspaceId` accepté
☐ Response inclut `userConnections` array
☐ Utilisateurs triés par LastLogin (récents en premier)
☐ Seulement 8 affichés dans response
☐ Seulement Admin/Manager reçoivent les données

FRONTEND
☐ Graphique "🔗 Dernières Connexions GED" visible
☐ Visible UNIQUEMENT pour Admin/Manager
☐ Deux graphiques côte à côte (desktop)
☐ Indicateurs couleur corrects (vert/orange/gris)
☐ Animations fluides (pulse, transition)
☐ Responsive sur tablet et mobile
☐ Aucune erreur console (F12)

SÉCURITÉ
☐ RBAC: Collaborateur ne voit pas le graphique
☐ Workspace isolation: Pas de cross-workspace leak
☐ Authentication: JWT Bearer token validé
☐ SQL Injection: Utilise LINQ (paramétrisé)

PERFORMANCE
☐ API response < 1 sec
☐ Frontend load < 3 sec
☐ Pas de freeze ou lag
☐ Responsive design optimal
```

---

## 📞 Besoin d'Aide?

### Documents de Référence
- [FEATURE_USER_CONNECTIONS_CHART.md](./FEATURE_USER_CONNECTIONS_CHART.md) - Description complet
- [DEPLOY_USER_CONNECTIONS_CHART.md](./DEPLOY_USER_CONNECTIONS_CHART.md) - Déploiement
- [TEST_USER_CONNECTIONS_CHART.md](./TEST_USER_CONNECTIONS_CHART.md) - Test détaillé

### Quick Debug
```bash
# 1. Vérifier les logs frontend (F12 Console)
# 2. Vérifier localStorage
localStorage.getItem('user') # Should have workspaceId
localStorage.getItem('token') # Should have JWT

# 3. Vérifier Network tab (F12)
# GET /api/dashboard/statistics?workspaceId=...
# Response: 200 OK with userConnections

# 4. Vérifier le CSS (F12 Styles)
# .chart-section-double { display: grid; grid-template-columns: 1fr 1fr; }
```

---

**Durée estimée:** 5-10 minutes  
**Date:** 29 Décembre 2025  
**Status:** ✅ Ready for Testing

