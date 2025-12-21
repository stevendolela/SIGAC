# 🧪 Guide de Test - Workspace Feature

## 📋 Prérequis

✅ PostgreSQL : Running (port 5434)
✅ Backend API : Running (http://localhost:5210)
✅ Frontend : Running (http://localhost:5674)
✅ Migration appliquée : `20251216190719_AddWorkspaceSupport`

---

## 🎯 Test 1 : Configuration API URL

### Option A : Via ApiSwitcher (Interface)

1. Ouvre http://localhost:5674
2. Login avec `admin` / `Admin@2024!`
3. Clique sur le bouton **🔌 API** (en haut à droite)
4. Entre : `http://localhost:5210`
5. Clique **Valider**
6. Recharge la page

### Option B : Via Console DevTools

1. Ouvre http://localhost:5674
2. F12 → Console
3. Exécute :
```javascript
localStorage.setItem('apiBaseUrl', 'http://localhost:5210');
location.reload();
```

---

## 🎯 Test 2 : Créer un Workspace via Swagger

### Étapes

1. **Ouvre Swagger** : http://localhost:5210/swagger

2. **Login** :
   - Cherche : `POST /api/auth/login`
   - Click **Try it out**
   - Body :
   ```json
   {
     "username": "admin",
     "password": "Admin@2024!"
   }
   ```
   - Click **Execute**
   - Copie le **token** de la réponse

3. **Autoriser Swagger** :
   - Clique sur le bouton **Authorize** 🔒 (en haut)
   - Entre : `Bearer {TON_TOKEN_ICI}`
   - Clique **Authorize**
   - Ferme le modal

4. **Créer un Workspace** :
   - Cherche : `POST /api/workspaces`
   - Click **Try it out**
   - Body :
   ```json
   {
     "name": "Cour Constitutionnelle RDC",
     "slug": "cc-rdc",
     "description": "Workspace principal de la Cour Constitutionnelle de la République Démocratique du Congo"
   }
   ```
   - Click **Execute**
   - **Vérifie** : Status Code = **201 Created**
   - **Note l'ID** du workspace créé

5. **Lister les Workspaces** :
   - Cherche : `GET /api/workspaces`
   - Click **Try it out**
   - Click **Execute**
   - **Vérifie** : Tu dois voir 1 workspace avec :
     * `name`: "Cour Constitutionnelle RDC"
     * `userRole`: 0 (Owner)
     * `currentMemberCount`: 1
     * `currentProjectCount`: 0

6. **Vérifier ton Rôle** :
   - Cherche : `GET /api/workspaces/{id}/my-role`
   - Entre l'ID du workspace créé
   - Click **Execute**
   - **Vérifie** : `role: 0` (Owner)

---

## 🎯 Test 3 : Interface Frontend - WorkspaceSelector

### Étape 1 : Login

1. Ouvre http://localhost:5674
2. Login : `admin` / `Admin@2024!`
3. **Vérifie** dans le header (entre le logo et le menu utilisateur) :
   - Le **WorkspaceSelector** doit s'afficher

### Étape 2 : État avec Workspace Créé

Si tu as créé un workspace via Swagger (Test 2) :

1. **Recharge la page** (F5)
2. Le WorkspaceSelector devrait afficher :
   ```
   📁 Cour Constitutionnelle RDC
   👥 1 membre
   🟣 Propriétaire
   ```
3. Clique sur le selector → Dropdown s'ouvre
4. **Vérifie** :
   - Logo (ou icône placeholder)
   - Nom du workspace
   - Badge "Propriétaire" (violet)
   - Stats : "1 membre"
   - Bouton **⚙️ Paramètres** visible (car tu es Owner)

### Étape 3 : Créer un Workspace via Modal

1. Clique sur le bouton **➕ Créer** dans le dropdown
2. Modal "Créer un nouveau workspace" s'ouvre
3. **Remplis** :
   - **Nom** : "Département Tests"
   - **Slug** : Auto-généré → `departement-tests` (éditable)
   - **Description** : "Workspace de test"
4. Clique **Créer le workspace**
5. **Vérifie** :
   - Modal se ferme
   - WorkspaceSelector se rafraîchit automatiquement
   - Le nouveau workspace apparaît dans la liste
   - Badge "Propriétaire" (violet)

### Étape 4 : Switcher entre Workspaces

1. Clique sur le WorkspaceSelector
2. Sélectionne "Département Tests"
3. **Vérifie** :
   - Le selector affiche maintenant "Département Tests"
   - Badge "Propriétaire" (violet)
   - Store Zustand mis à jour (F12 → Application → Local Storage → `workspace-storage`)

---

## 🎯 Test 4 : Gestion des Membres

### Via Swagger

1. **Lister les membres** :
   - `GET /api/workspaces/{id}/members`
   - **Vérifie** : 1 membre (toi, Owner)

2. **Ajouter un membre** :
   - `POST /api/workspaces/{id}/members`
   - Body :
   ```json
   {
     "userId": "{ID_D_UN_AUTRE_USER}",
     "role": 2
   }
   ```
   - Rôles : 0=Owner, 1=Admin, 2=Member, 3=Guest

3. **Modifier le rôle** :
   - `PUT /api/workspaces/{id}/members/{userId}/role`
   - Body :
   ```json
   {
     "role": 1
   }
   ```

4. **Retirer un membre** :
   - `DELETE /api/workspaces/{id}/members/{userId}`

---

## 🎯 Test 5 : Vérification Console (DevTools)

### Frontend Store (Zustand)

1. F12 → Console
2. Exécute :
```javascript
// Voir le state actuel
JSON.parse(localStorage.getItem('workspace-storage'))

// Devrait afficher :
{
  "state": {
    "currentWorkspace": {
      "id": "...",
      "name": "Cour Constitutionnelle RDC",
      "slug": "cc-rdc",
      "userRole": 0
    }
  }
}
```

### API Calls (Network Tab)

1. F12 → Network
2. Recharge la page
3. **Vérifie** les requêtes :
   - `GET /api/workspaces` → 200 OK
   - Response contient la liste des workspaces

---

## ✅ Checklist de Validation

- [ ] **Backend** : Swagger accessible (http://localhost:5210/swagger)
- [ ] **Backend** : POST /api/workspaces crée un workspace (201)
- [ ] **Backend** : GET /api/workspaces retourne la liste
- [ ] **Backend** : GET /api/workspaces/{id}/my-role retourne le rôle
- [ ] **Frontend** : Login réussi
- [ ] **Frontend** : WorkspaceSelector visible dans le header
- [ ] **Frontend** : Dropdown s'ouvre au clic
- [ ] **Frontend** : Badge rôle affiché (violet pour Owner)
- [ ] **Frontend** : Modal création s'ouvre
- [ ] **Frontend** : Création workspace fonctionne
- [ ] **Frontend** : Auto-génération slug fonctionne
- [ ] **Frontend** : Switch workspace met à jour le selector
- [ ] **Frontend** : LocalStorage persiste le workspace actif

---

## 🐛 Troubleshooting

### Problème : WorkspaceSelector n'apparaît pas

**Solution** :
- Vérifie que tu es connecté (token valide)
- F12 → Console → Cherche les erreurs
- Vérifie que `workspaceApi.ts` utilise la bonne URL

### Problème : 401 Unauthorized

**Solution** :
- Déconnecte/reconnecte
- Vérifie que le token JWT est valide
- Swagger : Re-authorize avec un nouveau token

### Problème : Slug invalide

**Erreur** : "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets"

**Solution** :
- Utilise uniquement : `a-z`, `0-9`, `-`
- Pas d'espaces, majuscules, caractères spéciaux

### Problème : CORS Error

**Solution** :
- Vérifie que `http://localhost:5674` est dans `appsettings.json` → `Cors:AllowedOrigins`
- Redémarre le backend si tu as modifié la config

---

## 📊 Résultats Attendus

### Base de Données (PostgreSQL)

```sql
-- Vérifier les tables créées
SELECT * FROM "Workspaces";
SELECT * FROM "WorkspaceUsers";

-- Compter les workspaces
SELECT COUNT(*) FROM "Workspaces" WHERE "IsActive" = true;

-- Voir les membres
SELECT w."Name", u."Username", wu."Role" 
FROM "WorkspaceUsers" wu
JOIN "Workspaces" w ON wu."WorkspaceId" = w."Id"
JOIN "Users" u ON wu."UserId" = u."Id";
```

### Logs Backend

```
[INF] Workspace created: cc-rdc by user {UserId}
[INF] User {UserId} added to workspace {WorkspaceId} as Owner
```

---

## 🚀 Prochaines Étapes

Après validation de ces tests :

1. ✅ Créer page Workspace Settings
2. ✅ Filtrer Dossiers par Workspace
3. ✅ Migration des données existantes vers workspace par défaut
4. ✅ Implémenter Folder hierarchy
5. ✅ Étendre Document avec versioning

---

**Date** : 16 décembre 2025
**Version** : Workspace Feature v1.0
**Testeur** : _____________
**Statut** : 🟡 En cours
