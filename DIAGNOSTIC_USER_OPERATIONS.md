# 🔧 DIAGNOSTIC & CORRECTION - CRÉATION D'UTILISATEUR + SUPPRESSION

**Date**: 6 décembre 2025  
**Problème**: Impossible d'ajouter utilisateur depuis le frontend

---

## 🔍 PROBLÈMES IDENTIFIÉS

### 1. Frontend - Création d'Utilisateur

**Fichier**: `sigac-frontend/src/pages/UsersPage.tsx`

**Code actuel (ligne 141)**:
```tsx
const payload = {
  username: formData.username.trim(),
  email: formData.email.trim(),
  password: formData.password.trim(),
  role: Number(formData.role),  // ← Converti en Number
  nomComplet: formData.nomComplet.trim() || null,
  matricule: formData.matricule.trim() || null
}
```

**Problème**:
- Les rôles dans le formulaire sont des valeurs string: `"1"`, `"2"`, etc.
- Conversion `Number(formData.role)` → `1`, `2`, `3`, etc. ✅ (Correct)
- Backend reçoit `UserRole` enum qui attend ces valeurs

### 2. Backend - Validation

**Fichier**: `SIGAC.API/Controllers/UsersController.cs` (ligne ~205)

**Validations appliquées**:
```csharp
if (string.IsNullOrWhiteSpace(createUserDto.Username))
  return BadRequest(new { message = "Username requis" });

if (string.IsNullOrWhiteSpace(createUserDto.Email))
  return BadRequest(new { message = "Email requis" });

if (string.IsNullOrWhiteSpace(createUserDto.Password))
  return BadRequest(new { message = "Password requis" });

// Vérifier que l'username n'existe pas
var existingUser = await _userService.GetByUsernameAsync(createUserDto.Username);
if (existingUser != null)
  return BadRequest(new { message = "Cet username est déjà utilisé" });
```

**Problèmes potentiels** (à vérifier):
- ✅ Validation username/email/password (OK)
- ❓ Validation enum UserRole?
- ❓ Erreur de conversion enum?

### 3. API Client Frontend

**Fichier**: `sigac-frontend/src/api/userApi.ts`

**Code actuel**:
```typescript
export const userApi = {
  async create(payload: CreateUserPayload) {
    const resp = await api.post<UserDto>('/Users', payload)
    return resp.data
  }
}
```

**Problème**: 
- Pas de fonction `delete()` (AJOUTÉE ✅)
- Endpoint correctement appelé: `POST /Users`

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Service Backend - Suppression Améliorée

**Fichier**: `SIGAC.Core/Services/UserService.cs`

**Fonction**: `DeleteUserAsync()`

**Avant**:
```csharp
// Delete physique
_userRepository.Delete(user);
await _auditLogRepository.LogActionAsync(deletedBy, "DELETE", "User", ...);
```

**Après** ✅:
```csharp
// Soft delete (désactiver au lieu de supprimer)
user.IsActive = false;
user.ModifiedAt = DateTime.UtcNow;
_userRepository.Update(user);

// Log audit complète
await _auditLogRepository.LogActionAsync(
  deletedBy, "SOFT_DELETE", "User", userId.ToString(),
  oldValues, newValuesJson);
```

**Avantages**:
- Pas de perte de données
- Récupération possible depuis `GetDeletedUsersAsync()`
- Audit complet avec old/new values
- Traçabilité: qui a supprimé, quand, quoi

### 2. API Frontend - Fonction Delete Ajoutée

**Fichier**: `sigac-frontend/src/api/userApi.ts`

**Avant**:
```typescript
async statsAdmin() { ... }
async listJuges() { ... }
// MANQUAIT: delete()
```

**Après** ✅:
```typescript
async delete(id: string) {
  await api.delete(`/Users/${id}`)
  return true
},
```

---

## 🐛 DEBUGGING: Étapes pour Trouver le Problème d'Ajout

### Étape 1: Vérifier les Logs Backend

```bash
# Terminal 1: Regarder les logs en temps réel
cd /Users/steve/Projects/SIGAC/sigac-backend
tail -f logs/sigac-*.txt

# Dans un autre terminal: Tenter la création
```

### Étape 2: Vérifier la Requête HTTP

```bash
# Utiliser Swagger UI
http://localhost:5000/swagger

# POST /api/Users
# Body:
{
  "username": "test.user",
  "email": "test@example.com",
  "password": "TestPassword123!",
  "role": 3,
  "nomComplet": "Test User",
  "matricule": "MAT-001"
}
```

### Étape 3: Vérifier la Réponse

**Erreurs possibles**:

1. **400 Bad Request**:
   ```json
   { "message": "Cet username est déjà utilisé" }
   ```
   → Solution: Utiliser un username unique

2. **401 Unauthorized**:
   ```json
   { "error": "Unauthorized" }
   ```
   → Solution: Vérifier que vous êtes authentifié et Admin

3. **403 Forbidden**:
   ```json
   { "message": "Permission insuffisante (admin requis)" }
   ```
   → Solution: Se connecter avec compte Admin

4. **422 Unprocessable Entity** (Validation):
   ```json
   { "errors": ["..."] }
   ```
   → Solution: Vérifier les données du formulaire

5. **500 Internal Server Error**:
   → Solution: Vérifier les logs backend

### Étape 4: Tester via Frontend

```bash
# 1. Ouvrir http://localhost:5674
# 2. Se connecter en Admin: admin / Admin@2024!
# 3. Aller dans "Gestion des Utilisateurs"
# 4. Cliquer "➕ Créer Nouvel Utilisateur"
# 5. Remplir le formulaire
# 6. Cliquer "Créer"
# 7. Observer la notification d'erreur
```

---

## 📋 CHECKLIST DE VÉRIFICATION

### Backend

- [ ] Compilation: `dotnet build SIGAC.API/SIGAC.API.csproj`
  
  ```bash
  cd sigac-backend
  dotnet build SIGAC.API/SIGAC.API.csproj --no-incremental 2>&1 | grep -i error
  ```

- [ ] Tests: `dotnet test SIGAC.Tests/SIGAC.Tests.csproj`

  ```bash
  dotnet test SIGAC.Tests/SIGAC.Tests.csproj -c Debug --filter "User"
  ```

- [ ] Endpoint accessible: `curl http://localhost:5000/swagger`

### Frontend

- [ ] Node packages: `npm list` (vérifier aucun error)

- [ ] Build TypeScript: Pas d'erreurs de compilation

- [ ] Environnement: Vérifier `.env` ou `vite.config.ts`

### Données

- [ ] Compte Admin existe: `admin` / `Admin@2024!`

- [ ] Connexion réussit (token JWT reçu)

- [ ] Token envoyé en header: `Authorization: Bearer <token>`

---

## 🚀 COMMANDES DE TEST

### Test 1: Créer utilisateur via curl

```bash
# 1. Authentifier
TOKEN=$(curl -X POST http://localhost:5000/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# 2. Créer utilisateur
curl -X POST http://localhost:5000/api/Users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "newuser",
    "email": "new@example.com",
    "password": "Password123!",
    "role": 3,
    "nomComplet": "New User",
    "matricule": "MAT-NEW"
  }' | jq .
```

### Test 2: Supprimer utilisateur via curl

```bash
# Récupérer un userId (substituer <USER_ID>)
curl -X DELETE http://localhost:5000/api/Users/<USER_ID> \
  -H "Authorization: Bearer $TOKEN"

# Résultat attendu: 204 No Content
```

### Test 3: Vérifier logs d'audit

```bash
# Via Swagger UI
GET /api/AuditLogs?entityType=User&action=SOFT_DELETE

# Ou via BD directe
SELECT * FROM "AuditLogs" 
WHERE "EntityType" = 'User' 
AND "Action" = 'SOFT_DELETE' 
ORDER BY "CreatedAt" DESC 
LIMIT 10;
```

---

## 🎯 PROCHAINES ÉTAPES

### Immédiate (maintenant)

1. [ ] Vérifier la compilation du backend
2. [ ] Démarrer backend & frontend
3. [ ] Vérifier les logs pour toute erreur
4. [ ] Tester création utilisateur via Swagger UI
5. [ ] Tester création via frontend

### Court Terme (si problème persiste)

1. [ ] Ajouter console.log() au frontend pour voir la requête
2. [ ] Vérifier les headers HTTP envoyés
3. [ ] Comparer avec une requête curl réussie
4. [ ] Vérifier les validations server-side
5. [ ] Vérifier les permissions RBAC

### Moyen Terme

1. [ ] Ajouter plus de logging au service UserService
2. [ ] Implémenter tests unitaires pour CreateUserAsync
3. [ ] Ajouter validation côté client plus stricte
4. [ ] Documenter tous les cas d'erreur

---

## 📊 RÉSUMÉ

| Aspect | Statut | Notes |
|--------|--------|-------|
| **Suppression** | ✅ CORRIGÉE | Soft delete + audit complet |
| **API Delete Frontend** | ✅ AJOUTÉE | `userApi.delete(id)` |
| **Création Frontend** | ⏳ À TESTER | Code semble OK, tester avec logs |
| **Audit** | ✅ AMÉLIORÉ | AuditLog avec old/new values |

---

*Document généré le 6 décembre 2025*
