# 🔍 GUIDE COMPLET - TESTER CRÉATION & SUPPRESSION D'UTILISATEURS

**Date**: 6 décembre 2025  
**Objectif**: Déboguer et valider les opérations utilisateur (create/delete avec audit)

---

## ✅ MODIFICATIONS APPORTÉES

### 1. Backend - Service UserService

**Fichier**: `SIGAC.Core/Services/UserService.cs`

**Amélioration**: Fonction `DeleteUserAsync()`
- ✅ Soft delete (désactivation au lieu de suppression physique)
- ✅ Audit complet avec old/new values en JSON
- ✅ Enregistrement des modifications

### 2. Backend - Controller UsersController

**Fichier**: `SIGAC.API/Controllers/UsersController.cs`

**Améliorations**:
- ✅ Logging détaillé pour déboguer les créations (lignes [CreateUser])
- ✅ Gestion d'erreurs améliorée
- ✅ Messages d'erreur informatifs

**Fonction DeleteUser** (déjà existante):
- ✅ Soft delete via UserService
- ✅ Contrôle d'accès (Admin seulement)
- ✅ Audit de suppression

### 3. Frontend - API Client

**Fichier**: `sigac-frontend/src/api/userApi.ts`

**Ajout**:
```typescript
async delete(id: string) {
  await api.delete(`/Users/${id}`)
  return true
},
```

### 4. Frontend - Page UsersPage

**Fichier**: `sigac-frontend/src/pages/UsersPage.tsx`

**Ajouts**:
- ✅ Fonction `handleDeleteUser(u)` avec confirmation
- ✅ Bouton "🗑️ Supprimer" dans le tableau
- ✅ Notification de succès/erreur

---

## 🧪 PROCÉDURE DE TEST COMPLÈTE

### Phase 1: Préparation (5 min)

#### 1.1 Build Backend

```bash
cd /Users/steve/Projects/SIGAC/sigac-backend

# Nettoyer et compiler
dotnet clean
dotnet build SIGAC.API/SIGAC.API.csproj --no-incremental

# Résultat attendu:
# ✅ Build succeeded.
# (5 avertissements non-critiques)
```

#### 1.2 Vérifier les Logs

```bash
# Nettoyer les anciens logs
rm -f logs/sigac-*.txt

# Vérifier le répertoire
ls -la logs/
```

#### 1.3 Vérifier la Base de Données

```bash
# Test connexion DB
docker exec sigac-postgres psql -U sigac_user -d sigac_db -c "SELECT COUNT(*) FROM \"Users\";" 2>&1 | head -20

# Résultat attendu:
# count
# ------
#   (nombre d'utilisateurs existants)
```

### Phase 2: Démarrage (2 min)

#### 2.1 Démarrer Backend (Terminal 1)

```bash
cd /Users/steve/Projects/SIGAC/sigac-backend
dotnet run --project SIGAC.API

# Résultat attendu:
# Now listening on: http://localhost:5000
# Application started. Press Ctrl+C to exit.
```

#### 2.2 Démarrer Frontend (Terminal 2)

```bash
cd /Users/steve/Projects/SIGAC/sigac-frontend
npm run dev

# Résultat attendu:
# ➜ Local: http://localhost:5674/
```

#### 2.3 Surveiller les Logs (Terminal 3)

```bash
cd /Users/steve/Projects/SIGAC/sigac-backend
tail -f logs/sigac-*.txt

# Vous verrez les logs en temps réel pendant les tests
```

---

### Phase 3: Test 1 - Création Utilisateur via Swagger UI (5 min)

#### 3.1 Accéder à Swagger

```
http://localhost:5000/swagger
```

#### 3.2 S'authentifier

1. Cliquer sur le bouton **"Authorize"** (cadenas en haut à droite)
2. Post `/api/Auth/login`:
   ```json
   {
     "username": "admin",
     "password": "Admin@2024!"
   }
   ```
3. Copier le `token` reçu
4. Retourner à "Authorize" et coller: `Bearer <token>`

#### 3.3 Créer Utilisateur

1. POST `/api/Users`
2. Body:
   ```json
   {
     "username": "test.user1",
     "email": "test.user1@example.com",
     "password": "TestPassword123!",
     "role": 3,
     "nomComplet": "Test User",
     "matricule": "MAT-TEST-001"
   }
   ```
3. Cliquer **"Try it out"** → **"Execute"**

**Résultat attendu**:
- ✅ HTTP 201 Created
- Response:
  ```json
  {
    "id": "uuid-here",
    "username": "test.user1",
    "email": "test.user1@example.com",
    "nomComplet": "Test User",
    "role": "JugeConstitutionnel",
    "isActive": true,
    "matricule": "MAT-TEST-001"
  }
  ```

**Si erreur 400 ou 500**:
- Vérifier les logs (Terminal 3) pour voir `[CreateUser]` messages
- Chercher le message d'erreur spécifique
- Corriger et réessayer

#### 3.4 Vérifier les Logs

Dans Terminal 3, chercher:
```
[CreateUser] Tentative de création - Username: test.user1, Email: test.user1@example.com, Role: 3
[CreateUser] Hash password généré, appel service...
[CreateUser] Utilisateur créé: <id> (test.user1)
Utilisateur <admin-id> a créé un nouvel utilisateur: <id> (test.user1)
```

---

### Phase 4: Test 2 - Création Utilisateur via Frontend (5 min)

#### 4.1 Accéder au Frontend

```
http://localhost:5674
```

#### 4.2 Se Connecter

- Compte: `admin` / `Admin@2024!`
- Cliquer "Connexion"

#### 4.3 Naviguer vers Utilisateurs

- Menu latéral → **"Gestion des Utilisateurs"**

#### 4.4 Créer Nouvel Utilisateur

1. Cliquer **"➕ Créer Nouvel Utilisateur"**
2. Remplir le formulaire:
   ```
   Username:    test.user2
   Email:       test.user2@example.com
   Password:    TestPassword456!
   Rôle:        Juge Constitutionnel (3)
   Nom complet: Test User 2
   Matricule:   MAT-TEST-002
   ```
3. Cliquer **"Créer"**

**Résultat attendu**:
- ✅ Notification verte: "✅ Utilisateur créé avec succès: test.user2"
- Utilisateur apparaît dans la liste
- État: "✅ Actif"

**Si erreur**:
- Lire le message d'erreur de la notification rouge
- Vérifier les logs backend (Terminal 3) pour `[CreateUser]` messages
- Vérifier Console du navigateur (F12) pour erreurs JavaScript

---

### Phase 5: Test 3 - Suppression d'Utilisateur (3 min)

#### 5.1 Localiser l'Utilisateur

- Chercher "test.user1" ou "test.user2" dans la liste

#### 5.2 Cliquer "🗑️ Supprimer"

- Une boîte de confirmation apparaît:
  ```
  ❌ Êtes-vous sûr de vouloir supprimer l'utilisateur "test.user1"? 
  Cette action enregistrera une trace d'audit.
  ```

#### 5.3 Confirmer

- Cliquer "OK" dans la boîte de confirmation

**Résultat attendu**:
- ✅ Notification verte: "✅ Utilisateur supprimé: test.user1"
- Utilisateur disparaît de la liste

#### 5.4 Vérifier les Logs

Dans Terminal 3, chercher:
```
User deleted (soft delete) - UserId: <id>, DeletedBy: <admin-id>, Username: test.user1
```

---

### Phase 6: Test 4 - Vérifier l'Audit (2 min)

#### 6.1 Via Swagger (Endpoint AuditLogs)

```
GET /api/AuditLogs?entityType=User&action=SOFT_DELETE&pageSize=10
```

**Résultat attendu**:
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "admin-id",
      "action": "SOFT_DELETE",
      "entityType": "User",
      "entityId": "test.user1-id",
      "oldValues": "{...user data...}",
      "newValues": "{...modified data...}",
      "createdAt": "2025-12-06T14:XX:XXZ"
    }
  ],
  "pagination": {...}
}
```

#### 6.2 Via Base de Données

```bash
docker exec sigac-postgres psql -U sigac_user -d sigac_db << 'EOF'
SELECT 
  id,
  "UserId" as admin_id,
  action,
  "EntityType" as entity,
  "EntityId" as deleted_user_id,
  "CreatedAt"
FROM "AuditLogs"
WHERE action = 'SOFT_DELETE' AND "EntityType" = 'User'
ORDER BY "CreatedAt" DESC
LIMIT 5;
EOF
```

**Résultat attendu**: Lignes d'audit pour chaque suppression

---

### Phase 7: Test 5 - Récupérer Utilisateurs Supprimés (2 min)

#### 7.1 Via Swagger

```
GET /api/Users/deleted?page=1&pageSize=10
```

**Résultat attendu**:
- Les utilisateurs avec `isActive = false` s'affichent

#### 7.2 Via Base de Données

```bash
docker exec sigac-postgres psql -U sigac_user -d sigac_db << 'EOF'
SELECT username, email, "IsActive" FROM "Users" 
WHERE "IsActive" = false 
ORDER BY "ModifiedAt" DESC LIMIT 5;
EOF
```

---

## 🐛 TABLEAU DE DÉPANNAGE

| Symptôme | Cause Possible | Solution |
|----------|----------------|----------|
| **HTTP 400 Bad Request** | Username/Email déjà utilisé | Utiliser un username/email unique |
| **HTTP 401 Unauthorized** | Token invalide ou expiré | Réauthentifier (POST /Auth/login) |
| **HTTP 403 Forbidden** | Rôle insufficient (non-Admin) | Se connecter avec compte Admin |
| **HTTP 404 Not Found** | Utilisateur inexistant (delete) | Vérifier l'ID utilisateur |
| **HTTP 500 Internal Error** | Erreur serveur | Vérifier logs backend pour `[CreateUser]` |
| **Notification vague (Frontend)** | Erreur réseau ou validation | Vérifier Console (F12) et logs |
| **Utilisateur créé mais pas visible** | Cache frontend | Rafraîchir la page (F5) |
| **Suppression ne fonctionne pas** | Permission manquante | Vérifier rôle Admin |

---

## 📊 VÉRIFICATION FINALE

### Checklist

- [ ] Backend compile sans erreurs (0 errors, 5+ warnings OK)
- [ ] Frontend lance sans erreurs TypeScript
- [ ] Swagger UI accessible sur http://localhost:5000/swagger
- [ ] Authentification fonctionne (login/logout)
- [ ] Création utilisateur via Swagger (HTTP 201)
- [ ] Création utilisateur via Frontend (notification OK)
- [ ] Suppression utilisateur (soft delete)
- [ ] Audit logs enregistrés (AuditLogs table)
- [ ] Utilisateurs supprimés visibles via `/deleted`
- [ ] Pas d'erreurs dans les logs backend

---

## 🚀 PROCHAINES ÉTAPES

### Si Tout Fonctionne

1. ✅ Commit les changements:
   ```bash
   git add sigac-backend/SIGAC.API/Controllers/UsersController.cs
   git add sigac-backend/SIGAC.Core/Services/UserService.cs
   git add sigac-frontend/src/pages/UsersPage.tsx
   git add sigac-frontend/src/api/userApi.ts
   git commit -m "feat: Add user delete with soft delete + audit + frontend UI"
   ```

2. ✅ Tester le flow complet (create → edit → delete)

3. ✅ Ajouter des tests unitaires

### Si Problème Persiste

1. ⏳ Regarder les logs détaillés:
   ```bash
   grep -i "error\|exception\|failed" logs/sigac-*.txt | tail -50
   ```

2. ⏳ Activer le debug mode:
   - Ajouter `"Debug": true` à `appsettings.Development.json`
   - Redémarrer backend

3. ⏳ Ajouter plus de logging dans le service/repo

---

## 📝 FORMAT DES LOGS AUDIT

### Création

```
User created - UserId: <id>, CreatedBy: <admin-id>, Username: <username>
```

### Soft Delete

```
User deleted (soft delete) - UserId: <id>, DeletedBy: <admin-id>, Username: <username>
```

### Modification

```
User updated - UserId: <id>, ModifiedBy: <admin-id>, FieldsChanged: [...]
```

---

## 🎯 RÉSUMÉ

| Opération | Endpoint | Audit | Soft Delete |
|-----------|----------|-------|-------------|
| **Créer** | `POST /Users` | ✅ CREATE | N/A |
| **Lire** | `GET /Users` | ⚠️ Info seulement | N/A |
| **Modifier** | `PUT /Users/{id}` | ✅ UPDATE | N/A |
| **Supprimer** | `DELETE /Users/{id}` | ✅ SOFT_DELETE | ✅ IsActive=false |
| **Réactiver** | `POST /Users/{id}/activate` | ✅ UPDATE | N/A |
| **Désactiver** | `POST /Users/{id}/deactivate` | ✅ UPDATE | ✅ IsActive=false |

---

*Guide généré le 6 décembre 2025*  
**Statut**: ✅ Prêt pour testing
