# 🔧 Historique de Connexion - Documentation Technique

## Architecture

### Backend (.NET 8 / C#)

#### 1. **Service** (`ILoginHistoryService`)

Fichier: `SIGAC.Infrastructure/Services/LoginHistoryService.cs`

```csharp
public interface ILoginHistoryService
{
    Task<List<LoginHistoryDto>> GetMyLoginHistoryAsync(Guid userId, int limit = 50);
    Task<List<LoginHistoryDto>> GetAllLoginHistoryAsync(Guid userId, UserRole userRole, int limit = 100);
    Task<List<LoginHistoryDto>> GetUserLoginHistoryAsync(Guid userId, Guid targetUserId, UserRole userRole, int limit = 50);
}
```

**Responsabilités**:
- Interroger `AuditLog` pour les actions `LOGIN_SUCCESS`
- Filtrer par utilisateur et date (descendant)
- Parser le `UserAgent` pour extraire device, browser, OS
- Appliquer le contrôle d'accès (RBAC)

#### 2. **Données** (`LoginHistoryDto`)

Fichier: `SIGAC.Core/DTOs/LoginHistoryDto.cs`

```csharp
public class LoginHistoryDto
{
    public Guid Id { get; set; }
    public DateTime Timestamp { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public string? NomComplet { get; set; }
    public string IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Device { get; set; }      // Mobile, Desktop, Tablet
    public string? Browser { get; set; }     // Chrome, Safari, etc.
    public string? OS { get; set; }          // Windows, macOS, Linux, iOS, Android
    public bool IsSuccessful { get; set; }
}
```

#### 3. **Contrôleur** (`LoginHistoryController`)

Fichier: `SIGAC.API/Controllers/LoginHistoryController.cs`

Endpoints:
```csharp
GET /api/LoginHistory/my-history?limit=50
    - Retourne l'historique personnel
    - [Authorize] - tout utilisateur authentifié
    
GET /api/LoginHistory/all?limit=100
    - Retourne l'historique global
    - [Authorize] + UserRole.Admin seulement
    
GET /api/LoginHistory/user/{userId}?limit=50
    - Retourne l'historique d'un utilisateur spécifique
    - [Authorize] + (Admin OU userId == requestUserId)
```

#### 4. **Source de Données** (`AuditLog`)

L'historique de connexion est dérivé de la table `AuditLogs` (existante):

```sql
SELECT Id, Timestamp, UserId, IpAddress, UserAgent, User.Username, User.NomComplet
FROM AuditLogs
WHERE Action = 'LOGIN_SUCCESS'
ORDER BY Timestamp DESC
LIMIT 50
```

**Colonnes utilisées**:
- `Id`: UUID unique de chaque log
- `Timestamp`: Quand la connexion s'est produite (UTC)
- `UserId`: FK vers Users
- `IpAddress`: Adresse IP source (capturée par middleware)
- `UserAgent`: String du navigateur/device
- `User.Username`: Nom d'utilisateur
- `User.NomComplet`: Nom complet

### Frontend (React 18 + TypeScript)

#### 1. **Page** (`LoginHistoryPage.tsx`)

Fichier: `sigac-frontend/src/pages/LoginHistoryPage.tsx`

**Fonctionnalités**:
- Affiche un tableau avec pagination
- Dropdown pour choisir le nombre de résultats (10, 25, 50, 100)
- Bouton "Rafraîchir" pour recharger
- Détails expandables pour chaque entrée
- Copy-to-clipboard pour les adresses IP

**Hooks utilisés**:
```typescript
useState - pour history, loading, limit, showDetails
useEffect - pour charger l'historique au montage
useAuthStore - pour récupérer le token
fetch - pour appeler l'API
```

#### 2. **Styling** (`LoginHistoryPage.css`)

Fichier: `sigac-frontend/src/pages/LoginHistoryPage.css`

**Breakpoints responsifs**:
- Desktop (≥1024px): Tableau complet
- Tablet (768px - 1023px): Colonnes réduites
- Mobile (<768px): Tableau horizontal scrollable

#### 3. **Intégration** (`App.tsx` + `Sidebar.tsx`)

**App.tsx**:
- Ajout du type `'login-history'` à ViewType
- Ajout de la route conditionnelle `{view === 'login-history' && <LoginHistoryPage />}`

**Sidebar.tsx**:
- Ajout du type `'login-history'` à ViewType
- Ajout du menu item dans la section "Administration"

## Flux de Données

### Requête de l'utilisateur

```
1. Utilisateur clique sur "Historique Connexions" dans la Sidebar
   ↓
2. App.tsx change le state view='login-history'
   ↓
3. LoginHistoryPage.tsx est rendu
   ↓
4. useEffect déclenche loadLoginHistory()
   ↓
5. fetch() envoie: GET /api/LoginHistory/my-history?limit=50
   ↓
6. Header: Authorization: Bearer {token}
```

### Traitement du serveur

```
1. LoginHistoryController reçoit la requête
   ↓
2. Extrait userId du claim ClaimTypes.NameIdentifier
   ↓
3. Appelle LoginHistoryService.GetMyLoginHistoryAsync(userId, 50)
   ↓
4. Service requête AuditLog:
   - WHERE UserId = userId AND Action = 'LOGIN_SUCCESS'
   - ORDER BY Timestamp DESC
   - TAKE 50
   ↓
5. Pour chaque AuditLog, crée LoginHistoryDto
   ↓
6. Parse UserAgent de chaque entrée
   - Détecte browser (Chrome, Safari, Firefox, Edge, IE)
   - Détecte OS (Windows, macOS, Linux, iOS, Android)
   - Détecte device (Desktop, Mobile, Tablet)
   ↓
7. Retourne List<LoginHistoryDto> en JSON
```

### Affichage au client

```
1. fetch() reçoit la réponse JSON
   ↓
2. setHistory(data) met à jour le state
   ↓
3. Composant re-render
   ↓
4. Tableau affiche les 50 connexions
   ↓
5. Utilisateur peut:
   - Voir les détails (UserAgent complet)
   - Copier une IP
   - Changer le nombre de résultats
```

## Contrôle d'Accès (RBAC)

### Permissions par rôle

**Collaborateur** (JugeConstitutionnel, etc.):
- ✅ Voir son propre historique (`GET /my-history`)
- ❌ Voir l'historique d'autres utilisateurs
- ❌ Voir l'historique global

**Admin**:
- ✅ Voir son propre historique
- ✅ Voir l'historique global (`GET /all`)
- ✅ Voir l'historique de n'importe quel utilisateur (`GET /user/{id}`)

### Implémentation

```csharp
// Dans LoginHistoryService
public async Task<List<LoginHistoryDto>> GetAllLoginHistoryAsync(Guid userId, UserRole userRole, int limit = 100)
{
    if (userRole != UserRole.Admin)
    {
        throw new UnauthorizedAccessException("Seuls les administrateurs...");
    }
    // Récupère l'historique global
    ...
}
```

## Sécurité

### Données sensibles

Les informations enregistrées sont **non sensibles**:
- ✅ Adresse IP (publique)
- ✅ User-Agent (public)
- ✅ Timestamp (non sensible)
- ❌ Pas de mots de passe
- ❌ Pas de tokens
- ❌ Pas de données personnelles

### Authentification

- ✅ JWT Bearer token requis
- ✅ Validation des claims (UserId, Role)
- ✅ Middleware d'authentification appliqué

### RBAC

- ✅ Vérification du rôle Admin pour accès global
- ✅ Vérification de l'userId pour accès personnel
- ✅ Impossible de bypasser les contrôles

## Limitations Actuelles

1. **Durée de conservation**: Les logs d'audit sont conservés indéfiniment
   - **À implémenter**: Archivage après 90 jours

2. **Tentatives échouées**: Seules les connexions réussies sont affichées
   - **À implémenter**: Filtrer par statut (réussi/échoué)

3. **Localisation géographique**: Pas de géolocalisation de l'IP
   - **À implémenter**: Intégration avec service GeoIP

4. **Alertes**: Pas d'alerte pour accès suspects
   - **À implémenter**: Notification si IP nouvelle/étrangère

## Améliorations Futures

### Court terme
- [ ] Export CSV des logs de connexion
- [ ] Filtrer par date (date début/fin)
- [ ] Filtrer par adresse IP
- [ ] Filtrer par device/browser/OS

### Moyen terme
- [ ] Géolocalisation des adresses IP
- [ ] Alertes email pour connexions suspectes
- [ ] Graphiques de tendance (connexions par jour)
- [ ] Détection d'anomalies (nouvelle IP, pays)

### Long terme
- [ ] MFA (Multi-Factor Authentication) pour connexions suspectes
- [ ] Blocage automatique après X tentatives échouées
- [ ] Whitelist d'adresses IP de confiance
- [ ] Sessions actives avec déconnexion forcée

## Tests

### Tests unitaires (à implémenter)

```csharp
[Test]
public async Task GetMyLoginHistoryAsync_WithValidUserId_ReturnsLoginHistories()
{
    // Arrange
    var userId = Guid.NewGuid();
    
    // Act
    var result = await _service.GetMyLoginHistoryAsync(userId, 50);
    
    // Assert
    Assert.IsNotNull(result);
    Assert.IsTrue(result.Count <= 50);
}

[Test]
public async Task GetAllLoginHistoryAsync_WithNonAdminRole_ThrowsUnauthorizedAccessException()
{
    // Arrange
    var userId = Guid.NewGuid();
    var userRole = UserRole.Collaborateur;
    
    // Act & Assert
    Assert.ThrowsAsync<UnauthorizedAccessException>(
        async () => await _service.GetAllLoginHistoryAsync(userId, userRole)
    );
}
```

### Tests d'intégration (à implémenter)

```bash
# Tester l'endpoint personnel
curl -H "Authorization: Bearer {token}" \
     "http://localhost:5210/api/LoginHistory/my-history?limit=10"

# Tester l'endpoint admin (avec token admin)
curl -H "Authorization: Bearer {adminToken}" \
     "http://localhost:5210/api/LoginHistory/all?limit=50"
```

## Monitoring & Logging

### Logs applicatifs

```csharp
_logger.LogInformation(
    "Historique de connexion récupéré pour l'utilisateur {UserId}: {Count} enregistrements",
    userIdGuid, history.Count
);
```

### Métriques (à implémenter)

- Total de connexions par jour
- Nombre d'utilisateurs actifs
- Top 10 adresses IP
- Navigateurs/OS les plus utilisés

## Déploiement

### Production (Render + Vercel)

1. **Backend** (Render):
   - API disponible à: `https://sigac-api.onrender.com/api/LoginHistory`
   - Swagger: `https://sigac-api.onrender.com/swagger`

2. **Frontend** (Vercel):
   - Page disponible à: `https://taajii.fr/`
   - Route: Menu → Administration → Historique Connexions

### Développement local

```bash
# Backend
cd sigac-backend && dotnet run --project SIGAC.API

# Frontend
cd sigac-frontend && npm run dev

# Test
curl -H "Authorization: Bearer {token}" \
     "http://localhost:5210/api/LoginHistory/my-history"
```

---

**Dernière mise à jour**: 13 janvier 2026  
**Auteur**: Copilot  
**Version**: 1.0
