# SIGAC API — Démarrage et Gestion

## État actuel
- **API en cours d'exécution** sur `http://127.0.0.1:5001`
- **Logs** : `/tmp/sigac_api.log`
- **Base de données** : PostgreSQL à `localhost:5433` (DB: sigac_db)
- **Statut sécurité** : ✅ Aucune vulnérabilité détectée (packages mis à jour)

## Démarrer l'API en arrière-plan

```bash
cd /Users/steve/Projects/SIGAC/sigac-backend

# Démarrer l'API (Development)
export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS=http://127.0.0.1:5001
nohup dotnet run --project SIGAC.API/SIGAC.API.csproj > /tmp/sigac_api.log 2>&1 &
```

Ou en une seule ligne :
```bash
cd /Users/steve/Projects/SIGAC/sigac-backend && \
ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS=http://127.0.0.1:5001 \
nohup dotnet run --project SIGAC.API/SIGAC.API.csproj > /tmp/sigac_api.log 2>&1 &
```

## Consulter les logs

Dernières 200 lignes en direct :
```bash
tail -n 200 /tmp/sigac_api.log
```

Affichage en continu (suivi live) :
```bash
tail -f /tmp/sigac_api.log
```

## Arrêter l'API

Trouver le PID (Process ID) :
```bash
lsof -nP -iTCP:5001 -sTCP:LISTEN
# ou
ps aux | grep "SIGAC.API" | grep -v grep
```

Arrêter le processus :
```bash
kill <pid>
# Ou forcer l'arrêt :
kill -9 <pid>
```

## Nettoyer tous les processus SIGAC.API et redémarrer

```bash
# Tuer les vieux processus
for pid in $(pgrep -f "SIGAC.API/bin" || true); do kill -9 $pid || true; done
sleep 1

# Démarrer l'API en background
cd /Users/steve/Projects/SIGAC/sigac-backend && \
ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS=http://127.0.0.1:5001 \
nohup dotnet run --project SIGAC.API/SIGAC.API.csproj > /tmp/sigac_api.log 2>&1 &

sleep 2

# Vérifier qu'elle écoute
lsof -nP -iTCP:5001 -sTCP:LISTEN
```

## Test rapide (connexion admin)

Une fois l'API démarrée, vérifier qu'elle répond :

```bash
curl -i -s -X POST "http://127.0.0.1:5001/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}'
```

Vous devez recevoir une réponse **200 OK** avec un JWT token et un refreshToken.

## Notes importantes

### Port 5000 vs 5001
- **Port 5000** : souvent utilisé par **AirPlay** (macOS), peut retourner un 403 depuis AirTunes.
- **Port 5001** : utilisé ici pour éviter le conflit.
- Si vous préférez le port 5000, désactivez AirPlay ou utilisez un reverse proxy (nginx).

## Swagger (Documentation API)
- Accédez à : `http://127.0.0.1:5001/swagger/index.html` (en Development)
- Permet de tester les endpoints directement.

## Endpoints disponibles

### Health Check
Vérifier l'état de l'API et de ses dépendances :
```bash
curl -i http://127.0.0.1:5001/api/Health
```

Réponse attendue (200 OK) :
```json
{
  "status": "Healthy",
  "timestamp": "2025-11-13T19:19:31.155473Z",
  "version": "1.0.0.0",
  "services": {"database": "Connected"}
}
```

### Authentification

#### Login (obtenir JWT)
```bash
curl -X POST http://127.0.0.1:5001/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@2024!"
  }'
```

Réponse attendue (200 OK) :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "KblQKpC8sgZEuSu...",
  "expiresIn": 3600,
  "user": {
    "id": "65ddb9e3-006c-42f6-86fc-6428d10f4c14",
    "username": "admin",
    "email": "admin@courconstitutionnelle.cd",
    "role": "Administrateur",
    "isActive": true,
    "lastLogin": "2025-11-13T19:19:31.70545Z"
  }
}
```

#### Comptes de test disponibles
| Username | Password | Rôle |
|----------|----------|------|
| `admin` | `Admin@2024!` | Administrateur |
| `president` | `Admin@2024!` | Président de cour |
| `judge.mbala` | `Admin@2024!` | Juge |
| `judge.tshisekedi` | `Admin@2024!` | Juge |
| `judge.kabongo` | `Admin@2024!` | Juge |

#### Refresh Token
Obtenir un nouveau token JWT avec un refresh token :
```bash
curl -X POST http://127.0.0.1:5001/api/Auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "votre_refresh_token"}'
```

#### Logout
Se déconnecter (nécessite Authorization header) :
```bash
curl -X POST http://127.0.0.1:5001/api/Auth/logout \
  -H "Authorization: Bearer votre_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "votre_refresh_token"}'
```

### Documents (Gestion des fichiers)

#### Configuration du stockage
Fichiers configurés dans `appsettings.json` :
```json
{
  "FileStorage": {
    "BasePath": "/tmp/sigac_uploads"
  }
}
```

Les fichiers sont organisés par : `{BasePath}/{year}/{month}/{guid}.ext`

#### Validations pour l'upload
- **Taille max** : 50 MB (52428800 bytes)
- **Types MIME autorisés** :
  - `application/pdf` — PDF
  - `image/jpeg`, `image/png`, `image/tiff` — Images
  - `application/msword` — Word 97-2003 (.doc)
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` — Word 2007+ (.docx)
  - `application/vnd.ms-excel` — Excel 97-2003 (.xls)
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` — Excel 2007+ (.xlsx)
  - `text/plain` — Texte (.txt)
  - `application/zip`, `application/x-zip-compressed` — Archives ZIP

#### Lister les documents d'un dossier
```bash
TOKEN="votre_jwt_token"
DOSSIER_ID="uuid-du-dossier"

curl -i -X GET "http://127.0.0.1:5001/api/Documents/dossier/$DOSSIER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Réponse attendue (200 OK) :
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nomFichier": "demande_revision.pdf",
    "dossierId": "uuid-du-dossier",
    "typeDocument": "Requête",
    "hash": "sha256hash...",
    "dateCreation": "2025-11-14T10:30:00Z",
    "createdBy": "admin"
  }
]
```

#### Récupérer les détails d'un document
```bash
TOKEN="votre_jwt_token"
DOCUMENT_ID="550e8400-e29b-41d4-a716-446655440000"

curl -i -X GET "http://127.0.0.1:5001/api/Documents/$DOCUMENT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

#### Uploader un document
```bash
TOKEN="votre_jwt_token"
DOSSIER_ID="uuid-du-dossier"
FILE="./demande.pdf"

curl -i -X POST "http://127.0.0.1:5001/api/Documents/upload/$DOSSIER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$FILE" \
  -F "typeDocument=Requête"
```

Réponse attendue (201 Created) :
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nomFichier": "demande.pdf",
  "dossierId": "uuid-du-dossier",
  "typeDocument": "Requête",
  "hash": "sha256hash...",
  "dateCreation": "2025-11-14T10:30:00Z",
  "createdBy": "admin"
}
```

Codes d'erreur possibles :
- **400 Bad Request** : MIME type non autorisé, fichier vide, taille > 50 MB
- **404 Not Found** : Dossier inexistant
- **401 Unauthorized** : Token manquant ou expiré

#### Télécharger un document
```bash
TOKEN="votre_jwt_token"
DOCUMENT_ID="550e8400-e29b-41d4-a716-446655440000"

curl -i -X GET "http://127.0.0.1:5001/api/Documents/download/$DOCUMENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -o "document_telecharge.pdf"
```

Le serveur retourne le fichier avec le bon `Content-Type` et `Content-Disposition`.

#### Supprimer un document
```bash
TOKEN="votre_jwt_token"
DOCUMENT_ID="550e8400-e29b-41d4-a716-446655440000"

curl -i -X DELETE "http://127.0.0.1:5001/api/Documents/$DOCUMENT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Réponse attendue (204 No Content) — supprime le fichier physique + enregistrement DB.

#### Statistiques de stockage (Admin uniquement)
```bash
TOKEN="votre_jwt_token_admin"

curl -i -X GET "http://127.0.0.1:5001/api/Documents/admin/stats" \
  -H "Authorization: Bearer $TOKEN"
```

Réponse attendue (200 OK) :
```json
{
  "totalFiles": 42,
  "totalStorageUsedMB": 245.5,
  "allowedFormats": ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "png", "txt", "zip"],
  "maxFileSizeMB": 50
}
```

Codes d'erreur :
- **403 Forbidden** : Utilisateur non admin

## Endpoints disponibles

## Audit Logs
- Insertion des AuditLogs : pas d'erreur détectée lors des tests récents.
- Colonnes `NewValues` et `OldValues` : type `text` (voir `alter-audit-columns/` si besoin de modifier le schéma).

## Tests d'intégration

### Exécuter les tests
```bash
cd /Users/steve/Projects/SIGAC/sigac-backend
dotnet test SIGAC.Tests/SIGAC.Tests.csproj -c Debug
```

### Cas de tests disponibles (NUnit)
- `Login_WithValidCredentials_ReturnsOkWithToken` — Vérifie 200 OK et JWT généré
- `Login_WithInvalidPassword_ReturnsUnauthorized` — Vérifie 401 sur mauvais mot de passe
- `Login_WithNonexistentUser_ReturnsUnauthorized` — Vérifie 401 user inexistant
- `Login_WithEmptyUsername_ReturnsBadRequest` — Vérifie validation 400
- `Login_TokenIsValidJwt` — Valide la structure JWT et les claims

Les tests utilisent une base de données in-memory (EF.InMemory) et `WebApplicationFactory<Program>` pour tester sans dépendre de PostgreSQL.

### Vulnérabilités de sécurité
Les paquets suivants ont été **mis à jour** en novembre 2025 :
- ✅ Npgsql : 8.0.0 → 8.0.8
- ✅ System.IdentityModel.Tokens.Jwt : 7.0.0 → 7.6.0
- ✅ Microsoft.AspNetCore.Authentication.JwtBearer : 8.0.0 → 8.0.10
- ✅ Microsoft.EntityFrameworkCore* : 8.0.0 → 8.0.10

Vérifier les vulnérabilités restantes :
```bash
cd /Users/steve/Projects/SIGAC/sigac-backend
dotnet list SIGAC.sln package --vulnerable
```

**Résultat actuel** : Aucun package vulnérable détecté ✅

## Fichiers utiles

| Fichier | Rôle |
|---------|------|
| `SIGAC.API/Program.cs` | Configuration ASP.NET, Serilog, JWT, CORS, etc. |
| `SIGAC.Core/Mapping/MappingProfile.cs` | Mappages AutoMapper (User → UserDto, etc.) |
| `SIGAC.Infrastructure/Data/ApplicationDbContext.cs` | DbContext principal |
| `SIGAC.Core/Services/AuthService.cs` | Service d'authentification (LoginAsync, etc.) |
| `SIGAC.API/Controllers/AuthController.cs` | Endpoints Auth (/api/Auth/*) |

## Prochaines étapes

1. ✅ API démarre et répond (200 OK)
2. ✅ Login admin fonctionne, JWT généré
3. ✅ AuditLogs insérés sans erreur
4. ✅ Health check endpoint disponible
5. ✅ Tests d'intégration en place (NUnit + WebApplicationFactory)
6. ✅ Dépendances vulnérables mises à jour
7. ✅ Endpoints Users : CRUD + activation/désactivation + password change
8. ✅ Endpoints Dossiers : Création, statuts, rapporteurs, filtrage complexe
9. ✅ Endpoints Documents : Upload/download/delete avec validations (MIME, size, hash)
10. ✅ DocumentsControllerTests : Suite de tests compilée et prête
11. ⏳ À faire : exécuter la suite de tests complète (Auth, Users, Dossiers, Documents)
12. ⏳ À faire : intégrer frontend (sigac-frontend/) avec l'API
13. ⏳ À faire : configurer CORS finement pour production
14. ⏳ À faire : déploiement en production (Azure/Docker/etc.)

