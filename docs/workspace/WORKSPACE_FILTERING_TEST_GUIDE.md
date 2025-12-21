# Guide de Test - Filtrage par Workspace

## 🎯 Objectif
Vérifier que les dossiers sont correctement filtrés par workspace et que le filtrage automatique fonctionne.

## 📊 État de la Base de Données

### Workspaces Disponibles
| Nom | Slug | Dossiers | Membres | ID |
|-----|------|----------|---------|-----|
| **CC RDC - Données Historiques** | cc-rdc-legacy | **3** | 5 | 50c6b303-1a9c-4585-9b40-bd11072823e9 |
| Cour Constitutionnelle RDC | cc-rdc | 0 | 1 | ee4f27fb-a387-4067-85e9-3a5bdc864e87 |
| Département Tests | dept-tests | 0 | 1 | 9772361d-53ef-4069-8f5b-18e215b773a1 |
| test | test | 0 | 1 | 3a0de9da-4bd5-409a-9e59-017917fda108 |

## 🧪 Scénarios de Test

### Test 1: Connexion et Sélection du Workspace
**Étapes:**
1. Ouvrir http://localhost:5674
2. Connexion avec:
   - Username: `admin`
   - Password: `Admin@2024!`
3. Une fois connecté, vérifier que le **WorkspaceSelector** apparaît dans le header
4. Cliquer sur le WorkspaceSelector (devrait afficher "Sélectionner un workspace")

**Résultat attendu:**
- ✅ Modal avec la liste des 4 workspaces s'affiche
- ✅ Chaque workspace montre son nom et son slug

---

### Test 2: Affichage des Dossiers du Workspace Legacy
**Étapes:**
1. Dans le modal, sélectionner **"CC RDC - Données Historiques"**
2. Le modal se ferme automatiquement
3. Naviguer vers l'onglet **"📁 Dossiers"** (dans le menu latéral)
4. Ouvrir les **DevTools** (F12) → **Network** tab

**Résultat attendu:**
- ✅ WorkspaceSelector affiche "CC RDC - Données Historiques"
- ✅ **3 dossiers** s'affichent dans la liste
- ✅ Dans Network tab, la requête est:
  ```
  GET /api/Dossiers?page=1&pageSize=10&workspaceId=50c6b303-1a9c-4585-9b40-bd11072823e9
  ```
- ✅ Status: 200
- ✅ Response contient 3 dossiers

**Capture d'écran:** Prendre une capture de la liste avec 3 dossiers + requête Network

---

### Test 3: Vérification de l'État Vide (Workspace Sans Dossiers)
**Étapes:**
1. Cliquer sur le WorkspaceSelector
2. Sélectionner **"Cour Constitutionnelle RDC"** (cc-rdc)
3. Rester sur l'onglet "📁 Dossiers"
4. Vérifier la requête dans Network tab

**Résultat attendu:**
- ✅ WorkspaceSelector affiche "Cour Constitutionnelle RDC"
- ✅ **0 dossiers** affichés (message d'état vide: "Aucun dossier trouvé")
- ✅ Dans Network tab, la requête est:
  ```
  GET /api/Dossiers?page=1&pageSize=10&workspaceId=ee4f27fb-a387-4067-85e9-3a5bdc864e87
  ```
- ✅ Status: 200
- ✅ Response: `{ "data": [], "pagination": { "totalItems": 0, ... } }`

**Capture d'écran:** Prendre une capture de l'état vide + requête Network

---

### Test 4: Basculement Entre Workspaces (Switch)
**Étapes:**
1. Sélectionner **"CC RDC - Données Historiques"** → Vérifier 3 dossiers
2. Sélectionner **"Département Tests"** → Vérifier 0 dossiers
3. Retourner à **"CC RDC - Données Historiques"** → Vérifier 3 dossiers à nouveau
4. Sélectionner **"test"** → Vérifier 0 dossiers

**Résultat attendu:**
- ✅ Chaque changement de workspace déclenche une nouvelle requête avec le bon `workspaceId`
- ✅ Le filtrage est **instantané** (pas de délai)
- ✅ Les données affichées correspondent toujours au workspace sélectionné
- ✅ Pas d'erreurs dans la Console

---

### Test 5: Création d'un Nouveau Dossier (Workspace Assignment)
**Étapes:**
1. Sélectionner **"Cour Constitutionnelle RDC"** (cc-rdc)
2. Cliquer sur **"➕ Nouveau Dossier"**
3. Remplir le formulaire:
   - Numéro: `TEST-001`
   - Titre: `Test Filtrage Workspace`
   - Type Affaire: (sélectionner n'importe lequel)
   - Priorité: Normale
4. Soumettre le formulaire
5. Vérifier dans Network tab la requête POST

**Résultat attendu:**
- ✅ Dossier créé avec succès
- ✅ Requête POST contient `workspaceId: ee4f27fb-a387-4067-85e9-3a5bdc864e87`
- ✅ Le nouveau dossier apparaît **immédiatement** dans la liste (1 dossier maintenant)
- ✅ Switcher vers un autre workspace → 0 dossiers
- ✅ Revenir à "Cour Constitutionnelle RDC" → 1 dossier (le nouveau)

**Vérification en DB** (optionnel):
```sql
SELECT "NumeroDossier", "Titre", "WorkspaceId" 
FROM "Dossiers" 
WHERE "NumeroDossier" = 'TEST-001';
```
Devrait retourner `WorkspaceId = ee4f27fb-a387-4067-85e9-3a5bdc864e87`

---

### Test 6: Recherche/Filtres avec Workspace
**Étapes:**
1. Sélectionner **"CC RDC - Données Historiques"** (3 dossiers)
2. Utiliser la barre de recherche pour chercher un mot-clé
3. Appliquer un filtre par Status
4. Vérifier la requête dans Network tab

**Résultat attendu:**
- ✅ La recherche fonctionne **uniquement sur les dossiers du workspace actuel**
- ✅ La requête contient:
  ```
  GET /api/Dossiers?page=1&pageSize=10&search=motcle&status=1&workspaceId=50c6b303-...
  ```
- ✅ Les filtres (status, priorité, date) fonctionnent en combinaison avec `workspaceId`

---

## 🐛 Points à Vérifier

### Comportements Attendus
- [ ] **Pas de dossier orphelin**: Tous les dossiers affichés ont un `workspaceId`
- [ ] **Isolation complète**: Impossible de voir les dossiers d'autres workspaces
- [ ] **Persistance**: Recharger la page (F5) doit conserver le workspace sélectionné (localStorage)
- [ ] **Performance**: Requête < 500ms même avec filtres
- [ ] **Pagination**: Fonctionne correctement avec workspaceId

### Erreurs Possibles à Surveiller
- ❌ **500 Error**: Problème backend (check logs: `sigac-backend/logs/`)
- ❌ **Dossiers mélangés**: Workspaces non isolés → Bug critique
- ❌ **workspaceId null**: Requête sans `workspaceId` → Filtrage non appliqué
- ❌ **Console Errors**: TypeScript/React errors → Check browser console

---

## 📝 Checklist de Validation

- [ ] Test 1: Connexion et sélection workspace ✅
- [ ] Test 2: Affichage des 3 dossiers (legacy) ✅
- [ ] Test 3: État vide (0 dossiers) ✅
- [ ] Test 4: Basculement entre workspaces ✅
- [ ] Test 5: Création dossier dans workspace spécifique ✅
- [ ] Test 6: Recherche/filtres avec workspace ✅

---

## 🚀 Prochaines Étapes (Après Validation)

Une fois tous les tests passés:
1. ✅ Marquer le todo "Tester filtrage end-to-end" comme **completed**
2. 🔨 Créer la page **Workspace Settings**:
   - Édition nom/description
   - Gestion des membres (ajouter/supprimer/changer rôle)
   - Quotas (MaxStorageGB, MaxUsers)
   - Suppression workspace (danger zone)
3. 🎨 Améliorer l'UI du WorkspaceSelector (couleurs, icônes)
4. 📄 Créer d'autres entités GED (Folders, Tags, etc.)

---

## 💡 Aide au Débogage

### Si les 3 dossiers ne s'affichent pas:
```bash
# Vérifier en DB
docker exec -i sigac-postgres psql -U sigac_user -d sigac_db -c \
"SELECT \"NumeroDossier\", \"Titre\", \"WorkspaceId\" FROM \"Dossiers\";"
```

### Si workspaceId manque dans la requête:
1. Vérifier que `currentWorkspace` est bien défini dans le store Zustand
2. Ouvrir DevTools → React Components → WorkspaceSelector
3. Vérifier que `currentWorkspace.id` existe

### Si erreur 401 Unauthorized:
- Token JWT expiré → Se reconnecter

### Si erreur 403 Forbidden:
- Permissions insuffisantes → Vérifier le rôle utilisateur (doit être Admin/President/Member)

---

**Date de création:** 16 décembre 2024, 21:13  
**Environnement:** Development (localhost)  
**Backend:** http://localhost:5210  
**Frontend:** http://localhost:5674  
**Statut Migration:** ✅ Complété (3 dossiers dans cc-rdc-legacy)
