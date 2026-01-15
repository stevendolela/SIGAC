# Guide Complet : Importer des Documents depuis des Serveurs Externes

## 🎯 Vue d'ensemble

SIGAC peut importer des documents depuis des sources externes :
- **FTP/SFTP** - Serveurs FTP classiques ou sécurisés
- **HTTP/HTTPS** - URLs, CDN, serveurs web
- **AWS S3** - Stockage cloud (à implémenter)
- **SMB/CIFS** - Partages réseau Windows (à implémenter)
- **Autres** - Extensible via `IExternalDocumentSourceProvider`

## 🏗️ Architecture

```
┌──────────────────────────────────────┐
│  Source Externe                      │
│  (FTP, HTTP, S3, etc.)               │
└────────────────┬─────────────────────┘
                 │
         ┌───────▼────────┐
         │ Provider Impl. │ ◄─ IExternalDocumentSourceProvider
         │ (FTP, HTTP)    │    ListFilesAsync()
         └───────┬────────┘    DownloadFileAsync()
                 │             TestConnectionAsync()
         ┌───────▼─────────────────────┐
         │ ExternalImportService       │
         │ - Validation                │
         │ - Mapping dossier→fichier   │
         │ - Dédoublonnage             │
         │ - Audit logging             │
         └───────┬─────────────────────┘
                 │
         ┌───────▼──────────────┐
         │ DocumentRepository   │
         │ DatabaseContext      │
         └──────────────────────┘
```

## 📋 Cas d'Usage

### Cas 1 : Import depuis FTP Classique

**Scenario** : Une entreprise stocke ses documents archivés sur un serveur FTP `archive.company.com`

Structure FTP :
```
/documents/
  /2024-001/
    requete.pdf
    contrat.docx
  /2024-002/
    attestation.pdf
    preuve.jpg
```

**Configuration** :
```json
{
  "ftpConfig": {
    "host": "archive.company.com",
    "port": 21,
    "username": "import_user",
    "password": "secure_password",
    "useSsl": false,
    "basePath": "/documents"
  },
  "importConfig": {
    "sourcePath": "/",
    "filePattern": ".*\\.(pdf|docx|jpg)$",
    "allowedExtensions": [".pdf", ".docx", ".jpg"],
    "maxFileSizeMB": 100,
    "recursiveImport": true,
    "dossierMappingStrategy": 1,
    "defaultDocumentType": "Document Archivé"
  }
}
```

**Endpoint API** :
```bash
POST /api/ExternalDocumentImport/from-ftp
Authorization: Bearer {token}
Content-Type: application/json

{
  "ftpConfig": { ... },
  "importConfig": { ... }
}
```

**Réponse** :
```json
{
  "importId": "f3a8b2c1-7890-4567-8901-234567890123",
  "sourceType": "FTP",
  "message": "Import complété: 45 documents importés, 2 erreurs",
  "documentsFound": 47,
  "documentsImported": 45,
  "documentsFailed": 2,
  "totalSize": "256 MB",
  "successRate": 95.74,
  "durationSeconds": 125.34,
  "successfulDocuments": [
    "requete.pdf",
    "contrat.docx",
    "attestation.pdf",
    ...
  ],
  "failedDocuments": [
    {
      "fileName": "too_large.zip",
      "filePath": "/2024-001/too_large.zip",
      "errorMessage": "Fichier trop volumineux: 250MB (max: 100MB)"
    },
    {
      "fileName": "readme.txt",
      "filePath": "/2024-003/readme.txt",
      "errorMessage": "Extension non autorisée: .txt"
    }
  ]
}
```

### Cas 2 : Import depuis API HTTP (REST)

**Scenario** : Un système tiers expose une API HTTP qui liste les documents à importer

API du système tiers retourne :
```json
{
  "files": [
    {
      "name": "[2024-001]_Requete.pdf",
      "url": "https://api.partner.com/files/abc123/download",
      "size": 2048000,
      "modified": "2024-01-10T14:30:00Z"
    },
    {
      "name": "[2024-002]_Contrat.docx",
      "url": "https://api.partner.com/files/def456/download",
      "size": 1024000,
      "modified": "2024-01-11T09:15:00Z"
    }
  ]
}
```

**Configuration** :
```json
{
  "httpConfig": {
    "baseUrl": "https://api.partner.com/api/documents",
    "headers": {
      "Authorization": "Bearer api_key_123456",
      "User-Agent": "SIGAC/1.0"
    },
    "timeout": 300
  },
  "importConfig": {
    "sourcePath": "/list",
    "filePattern": "^\\[\\d{4}-\\d{3}\\].*",
    "maxFileSizeMB": 500,
    "dossierMappingStrategy": 2,
    "dossierPatternRegex": "\\[([^\\]]+)\\]",
    "preventDuplicates": true
  }
}
```

**Endpoint API** :
```bash
POST /api/ExternalDocumentImport/from-http
Authorization: Bearer {token}
Content-Type: application/json

{
  "httpConfig": { ... },
  "importConfig": { ... }
}
```

### Cas 3 : Import Planifié (Scheduled)

**Workflow** :
1. Chaque nuit : Déclencher un import FTP automatique
2. Récupérer les fichiers modifiés depuis 24h
3. Associer aux dossiers via pattern du nom
4. Envoyer rapport aux administrateurs

```csharp
// Dans une tâche planifiée (Hangfire, etc.)
public async Task ImportDailyDocumentsAsync()
{
    var config = new ExternalDocumentImportConfigDto
    {
        SourcePath = "/daily",
        MinModifiedDate = DateTime.UtcNow.AddHours(-24),
        FilePattern = @"^\d{4}-\d{3}_.*\.pdf$",
        DossierMappingStrategy = DossierMappingStrategy.FileNamePattern,
        DossierPatternRegex = @"^(\d{4}-\d{3})_"
    };

    var ftpProvider = new FtpDocumentSourceProvider(...);
    var result = await _externalImportService.ImportFromSourceAsync(
        ftpProvider,
        config,
        AdminUserId,
        UserRole.Admin);

    // Envoyer rapport
    await _emailService.SendAsync(
        admins,
        $"Import Quotidien : {result.DocumentsImported} docs",
        BuildEmailBody(result));
}
```

## 🔧 Configuration : Stratégies d'Association Dossier→Fichier

### Strategy 1 : DefaultDossier (Tous → même dossier)

```json
{
  "dossierMappingStrategy": 0,
  "defaultDossierId": "f3a8b2c1-7890-4567-8901-234567890123"
}
```

**Cas d'usage** : Importer tous les documents dans un dossier centralisé (exemple: dossier d'accueil)

### Strategy 2 : FolderName (Dossier parent = Dossier SIGAC)

```json
{
  "dossierMappingStrategy": 1
}
```

Structure source :
```
/uploads/
  /2024-001/
    doc1.pdf ──► Associé au Dossier 2024-001
  /2024-002/
    doc2.pdf ──► Associé au Dossier 2024-002
```

### Strategy 3 : FileNamePattern (Regex dans le nom du fichier)

```json
{
  "dossierMappingStrategy": 2,
  "dossierPatternRegex": "^\\[([^\\]]+)\\]"
}
```

Formats supportés :
```
[2024-001]_document.pdf          ──► Dossier 2024-001
2024-001_requete.docx            ──► Dossier 2024-001
DOC_2024-001_contrat.pdf         ──► Dossier 2024-001
```

### Strategy 4 : CreateNewDossier (Créer nouveau dossier pour chaque batch)

```json
{
  "dossierMappingStrategy": 3,
  "defaultDocumentType": "Import Batch"
}
```

## 🧪 Test des Connexions

Avant de lancer un import volumineux, testez la connexion :

### Test FTP
```bash
POST /api/ExternalDocumentImport/test-ftp-connection
Content-Type: application/json

{
  "host": "ftp.example.com",
  "port": 21,
  "username": "user",
  "password": "pass",
  "useSsl": false,
  "basePath": "/"
}

# Réponse
{
  "isConnected": true,
  "sourceType": "FTP",
  "message": "Connexion réussie"
}
```

### Test HTTP
```bash
POST /api/ExternalDocumentImport/test-http-connection
Content-Type: application/json

{
  "baseUrl": "https://api.example.com",
  "headers": {
    "Authorization": "Bearer token123"
  },
  "timeout": 300
}

# Réponse
{
  "isConnected": true,
  "sourceType": "HTTP",
  "message": "Connexion réussie"
}
```

## 📊 Options de Filtrage

```json
{
  "importConfig": {
    // Pattern regex pour filtrer les fichiers
    "filePattern": ".*\\.(pdf|docx)$",

    // Extensions autorisées (empty = toutes)
    "allowedExtensions": [".pdf", ".docx", ".xlsx"],

    // Extensions/patterns à exclure
    "exclusionPatterns": ["temp", "backup", ".tmp"],

    // Taille maximale en MB
    "maxFileSizeMB": 500,

    // Import récursif des sous-dossiers
    "recursiveImport": true,

    // Ignorer fichiers cachés/système
    "ignoreHiddenFiles": true,

    // Date minimale de modification
    "minModifiedDate": "2024-01-01T00:00:00Z",

    // Date maximale de modification
    "maxModifiedDate": "2024-12-31T23:59:59Z",

    // Nombre maximal de fichiers (-1 = illimité)
    "maxFilesCount": 1000,

    // Éviter les doublons via SHA256
    "preventDuplicates": true,

    // Type de document par défaut
    "defaultDocumentType": "Document Importé",

    // Tous les documents confidentiels
    "markAsConfidential": false,

    // Préfixe/Suffixe aux noms
    "fileNamePrefix": "IMPORT_",
    "fileNameSuffix": "_ARCHIVED"
  }
}
```

## 🛡️ Sécurité & Bonnes Pratiques

### 1. Authentification

```json
{
  "ftpConfig": {
    "username": "{{ FTP_USERNAME }}",
    "password": "{{ FTP_PASSWORD }}"
  },
  "httpConfig": {
    "headers": {
      "Authorization": "Bearer {{ API_TOKEN }}"
    }
  }
}
```

**À faire** :
- Utiliser des variables d'environnement pour les credentials
- Utiliser SFTP au lieu de FTP classique
- Utiliser HTTPS au lieu de HTTP
- Rotation régulière des credentials

**À éviter** :
- Hard-coder les mots de passe dans le code
- Inclure les credentials en logs
- Envoyer credentials via plaintext

### 2. Validation

Le système valide automatiquement :
- ✅ Taille maximale des fichiers
- ✅ Extensions autorisées
- ✅ Patterns d'exclusion
- ✅ Dossier destination existe
- ✅ SHA256 pour dédoublonnage
- ✅ Intégrité du fichier

### 3. Audit

Chaque import génère :
- ✅ AuditLog avec action `IMPORT_EXTERNAL_DOCUMENTS`
- ✅ UserId et timestamp
- ✅ Nombre de documents importés
- ✅ Liste des erreurs
- ✅ ImportId pour traçabilité

```sql
-- Requête audit
SELECT * FROM AuditLog 
WHERE Action = 'IMPORT_EXTERNAL_DOCUMENTS' 
ORDER BY Timestamp DESC;
```

### 4. Gestion d'Erreurs

Les erreurs **n'interrompent pas** l'import global :
- Document trop volumineux → Skip + logged
- Dossier introuvable → Skip + logged
- Extension refusée → Skip + logged
- Connexion réseau → Retry ou logged

**Résultat final** :
```json
{
  "documentsImported": 98,
  "documentsFailed": 2,
  "failedDocuments": [
    { "fileName": "....", "errorMessage": "..." }
  ]
}
```

## 🚀 Implémentation Pas-à-Pas

### Étape 1 : Créer un Provider (FTP exemple)

```csharp
var ftpProvider = new FtpDocumentSourceProvider(
    host: "ftp.example.com",
    port: 21,
    username: "user",
    password: "pass",
    useSsl: false,
    basePath: "/documents");
```

### Étape 2 : Configurer l'import

```csharp
var config = new ExternalDocumentImportConfigDto
{
    SourcePath = "/2024",
    AllowedExtensions = new List<string> { ".pdf", ".docx" },
    MaxFileSizeMB = 100,
    DossierMappingStrategy = DossierMappingStrategy.FolderName,
    DefaultDocumentType = "Requête",
    PreventDuplicates = true
};
```

### Étape 3 : Lancer l'import

```csharp
var result = await _externalImportService.ImportFromSourceAsync(
    source: ftpProvider,
    config: config,
    userId: currentUserId,
    userRole: UserRole.Admin);

Console.WriteLine($"✓ {result.DocumentsImported} documents importés");
Console.WriteLine($"✗ {result.DocumentsFailed} erreurs");
```

## 📈 Performance & Considérations

### Taille des Fichiers
- **Petits** (< 50MB) : Chargement direct en mémoire
- **Grands** (> 50MB) : Streaming pour économiser RAM
- **Très gros** (> 1GB) : À diviser en plusieurs lots

### Réseau
- Timeout par défaut : **300 secondes**
- Connexion persistante FTP : Oui (réutilisation)
- Retry automatique : Non (log l'erreur)

### Base de Données
- Chaque document = 1 INSERT + 1 AuditLog INSERT
- 1000 documents ≈ 2-5 secondes (+ temps réseau)
- Transactions atomiques par fichier (rollback si erreur)

## 🔄 Cas d'Usage Avancé : Synchronisation Bidirectionnelle

Vous pouvez aussi **exporter** des documents SIGAC vers FTP :

```csharp
public async Task SyncDocumentsToFtpAsync(Guid workspaceId)
{
    var documents = await _documentRepository.GetAllAsync(workspaceId);
    
    var ftpProvider = new FtpDocumentSourceProvider(...);
    
    foreach (var doc in documents)
    {
        var fileBytes = await _documentRepository.GetFileContentAsync(doc.Id);
        await ftpProvider.UploadFileAsync(
            fileBytes,
            $"/archive/{doc.DossierId}/{doc.NomFichier}");
    }
}
```

## 🐛 Dépannage

| Problème | Cause | Solution |
|----------|-------|----------|
| "Impossible de se connecter" | Serveur injoignable | Vérifier host, port, firewall |
| "Authentification échouée" | Credentials invalides | Vérifier username/password |
| "Fichier trop volumineux" | Dépassement limite | Augmenter maxFileSizeMB ou découper fichier |
| "Extension non autorisée" | Pattern refusé | Ajouter extension à allowedExtensions |
| "Dossier introuvable" | Numero invalide | Vérifier dossierMappingStrategy et pattern |
| "Timeout réseau" | Lenteur du réseau | Augmenter Timeout ou diviser import |

## 📚 Référence Complète des Stratégies

```csharp
public enum DossierMappingStrategy
{
    DefaultDossier = 0,      // Tous → même dossier
    FolderName = 1,          // /2024-001/file → Dossier 2024-001
    FileNamePattern = 2,     // [2024-001]_file → Dossier 2024-001
    CreateNewDossier = 3     // Créer nouveau dossier
}
```

## 🎓 Exemples Complets

### Import Journalier depuis FTP avec Rapport

```csharp
[HttpPost("daily-import")]
public async Task<IActionResult> DailyImportAsync()
{
    var config = new ExternalDocumentImportConfigDto
    {
        SourcePath = "/daily",
        FilePattern = @"^\d{4}-\d{3}_.*\.pdf$",
        MaxFileSizeMB = 100,
        MinModifiedDate = DateTime.UtcNow.AddDays(-1),
        DossierMappingStrategy = DossierMappingStrategy.FileNamePattern,
        DossierPatternRegex = @"^(\d{4}-\d{3})_",
        PreventDuplicates = true
    };

    var provider = new FtpDocumentSourceProvider(
        host: _config["FTP:Host"],
        username: _config["FTP:Username"],
        password: _config["FTP:Password"]);

    var result = await _externalImportService.ImportFromSourceAsync(
        provider, config, UserId, UserRole.Admin);

    // Envoyer email de rapport
    await _emailService.SendAsync(
        admins: ["admin@example.com"],
        subject: $"Import Quotidien: {result.DocumentsImported} docs",
        body: FormatEmailReport(result));

    return Ok(result);
}
```

---

**Questions ?** Consultez les tests ou contactez l'équipe DevOps.
