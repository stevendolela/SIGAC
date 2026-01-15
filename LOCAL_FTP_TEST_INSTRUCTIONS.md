# 🔧 Instructions Test Import FTP Local

## Status
✅ Backend compilé et démarre correctement  
✅ PostgreSQL en local sur :5434  
✅ Endpoints disponibles à: `http://localhost:5210/api/ExternalDocumentImport/*`

## Étapes pour Tester

### 1️⃣ Lancer le Backend (Terminal 1)
```bash
cd /workspaces/SIGAC/sigac-backend
dotnet run --project SIGAC.API/SIGAC.API.csproj
```

Attendez le message: **"Application started. Press Ctrl+C to shut down."**

### 2️⃣ Tester l'Authentification (Terminal 2)
```bash
# Obtenez un token
curl -X POST http://localhost:5210/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}'

# Réponse attendue:
# {"token":"eyJhbGc...","refreshToken":"...","user":{...}}
```

Copiez le `token` de la réponse.

### 3️⃣ Tester Connexion FTP
```bash
# Remplacez [TOKEN] par le token obtenu ci-dessus
curl -X POST http://localhost:5210/api/ExternalDocumentImport/test-ftp-connection \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "192.168.102.128",
    "port": 21,
    "username": "Steve",
    "password": "",
    "useSftp": false,
    "basePath": "/"
  }'
```

### 4️⃣ Exécuter l'Import FTP
Si la connexion réussit, lancez l'import:
```bash
curl -X POST http://localhost:5210/api/ExternalDocumentImport/from-ftp \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "ftpConfig": {
      "host": "192.168.102.128",
      "port": 21,
      "username": "Steve",
      "password": "",
      "useSftp": false,
      "basePath": "/"
    },
    "importConfig": {
      "sourcePath": "/",
      "fileExtensionFilter": ["pdf", "docx", "doc"],
      "maxFileSizeInMB": 50,
      "dossierMappingStrategy": "BySourceDirectory",
      "createMissingDossiers": true
    }
  }'
```

## Configuration Locale

| Service | Port | URL |
|---------|------|-----|
| Backend | 5210 | http://localhost:5210 |
| PostgreSQL | 5434 | localhost:5434 |
| Swagger | 5210 | http://localhost:5210/swagger |

## Réponses Attendues

### ✅ Succès (Connection réussie)
```json
{
  "isConnected": true,
  "sourceType": "FTP",
  "message": "Connected successfully to FTP server"
}
```

### ❌ Timeout (Server non accessible)
```json
{
  "isConnected": false,
  "sourceType": "FTP",
  "message": "Connection timeout: Unable to reach 192.168.102.128:21"
}
```

### ❌ Authentication Error
```json
{
  "isConnected": false,
  "sourceType": "FTP",
  "message": "Invalid credentials for Steve"
}
```

## Fichiers Importants

- **Backend**: `/workspaces/SIGAC/sigac-backend/SIGAC.API/`
- **Logs DB**: `docker logs sigac-postgres -f`
- **API Swagger**: http://localhost:5210/swagger
- **Controller**: `sigac-backend/SIGAC.API/Controllers/ExternalDocumentImportController.cs`
- **Service**: `sigac-backend/SIGAC.Core/Services/ExternalDocumentImportService.cs`

## Comptes de Test Locaux

```
Admin:     admin / Admin@2024!
President: president.benoit / President@2024!
Juge:      juge.mbala / Juge@2024!
```

## Troubleshooting

### Backend n'écoute pas sur :5210
```bash
# Vérifier le port
netstat -tlnp | grep 5210

# Tuer le processus existant
pkill -f "dotnet run"
```

### PostgreSQL connection refused
```bash
# Vérifier container Docker
docker ps | grep postgres

# Redémarrer si besoin
docker-compose restart postgres
```

### Token expiré (401 Unauthorized)
Récupérez un nouveau token avec le login endpoint.

## API Endpoints Locaux

```
POST /api/auth/login
POST /api/ExternalDocumentImport/test-ftp-connection
POST /api/ExternalDocumentImport/test-http-connection
POST /api/ExternalDocumentImport/from-ftp
POST /api/ExternalDocumentImport/from-http
GET  /api/ExternalDocumentImport/history
```

---

**Note**: Ces endpoints testent la connexion depuis votre machine locale, donc l'accès au serveur FTP interne (192.168.102.128) devrait fonctionner maintenant.
