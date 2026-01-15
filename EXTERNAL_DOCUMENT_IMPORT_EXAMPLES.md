# Exemples Pratiques : Importer Documents depuis Serveurs Externes

## 1. Import FTP Simple (Entreprise Archivé)

### Scénario
Une entreprise a archivé ses documents sur un serveur FTP classique `archive.company.com`. Structure :

```
/documents/
  /2024-001/
    requete.pdf
    contrat.docx
    preuve.jpg
  /2024-002/
    attestation.pdf
```

### Implémentation

```bash
#!/bin/bash

# 1. Test de connexion
curl -X POST http://localhost:5210/api/ExternalDocumentImport/test-ftp-connection \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "host": "archive.company.com",
    "port": 21,
    "username": "import_user",
    "password": "MyPassword123!",
    "useSsl": false,
    "basePath": "/documents"
  }'

# Réponse:
# {
#   "isConnected": true,
#   "sourceType": "FTP",
#   "message": "Connexion réussie"
# }

# 2. Lancer l'import
curl -X POST http://localhost:5210/api/ExternalDocumentImport/from-ftp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "ftpConfig": {
      "host": "archive.company.com",
      "port": 21,
      "username": "import_user",
      "password": "MyPassword123!",
      "useSsl": false,
      "basePath": "/documents"
    },
    "importConfig": {
      "sourcePath": "/",
      "allowedExtensions": [".pdf", ".docx", ".jpg"],
      "maxFileSizeMB": 500,
      "recursiveImport": true,
      "dossierMappingStrategy": 1,
      "defaultDocumentType": "Document Archivé"
    }
  }'

# Réponse:
# {
#   "importId": "f3a8b2c1-7890-4567-8901-234567890123",
#   "sourceType": "FTP",
#   "message": "Import complété: 3 documents importés, 0 erreurs",
#   "documentsFound": 3,
#   "documentsImported": 3,
#   "documentsFailed": 0,
#   "totalSize": "5.2 MB",
#   "durationSeconds": 12.34,
#   "successRate": 100.0,
#   "successfulDocuments": [
#     "requete.pdf",
#     "contrat.docx",
#     "preuve.jpg"
#   ],
#   "failedDocuments": []
# }
```

### Résultat
✅ Les 3 documents sont maintenant dans les dossiers correspondants :
- `requete.pdf` → Dossier 2024-001
- `contrat.docx` → Dossier 2024-001
- `preuve.jpg` → Dossier 2024-001
- `attestation.pdf` → Dossier 2024-002

---

## 2. Import HTTP depuis API Tiers (Intégration System)

### Scénario
Un système partenaire expose une API qui liste les documents à importer. Les noms contiennent le numéro du dossier.

```
API GET: https://partner-system.com/api/files
Réponse JSON:
{
  "files": [
    {
      "name": "[2024-001]_Requete.pdf",
      "url": "https://partner-system.com/download/abc123",
      "size": 2048000,
      "modified": "2024-01-10T14:30:00Z"
    },
    {
      "name": "[2024-002]_Contrat.docx",
      "url": "https://partner-system.com/download/def456",
      "size": 1024000,
      "modified": "2024-01-11T09:15:00Z"
    }
  ]
}
```

### Implémentation

```javascript
// Dans une tâche planifiée (ex: tous les soirs à 22h)

async function importDocumentsFromPartner() {
    const config = {
        httpConfig: {
            baseUrl: "https://partner-system.com/api",
            headers: {
                "Authorization": `Bearer ${process.env.PARTNER_API_TOKEN}`,
                "User-Agent": "SIGAC/1.0"
            },
            timeout: 300
        },
        importConfig: {
            sourcePath: "/files",
            filePattern: "^\\[\\d{4}-\\d{3}\\].*",
            allowedExtensions: [".pdf", ".docx"],
            maxFileSizeMB: 500,
            dossierMappingStrategy: 2,  // FileNamePattern
            dossierPatternRegex: "^\\[([^\\]]+)\\]",
            preventDuplicates: true
        }
    };

    const response = await fetch(
        "http://api.sigac.local/api/ExternalDocumentImport/from-http",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${jwt_token}`
            },
            body: JSON.stringify(config)
        }
    );

    const result = await response.json();
    
    // Log résultat
    console.log(`✓ Import complété`);
    console.log(`  Documents trouvés: ${result.documentsFound}`);
    console.log(`  Documents importés: ${result.documentsImported}`);
    console.log(`  Erreurs: ${result.documentsFailed}`);
    console.log(`  Durée: ${result.durationSeconds}s`);
    
    // Envoyer alert si erreurs
    if (result.documentsFailed > 0) {
        await sendEmailAlert(result.failedDocuments);
    }
}

// Exécuter tous les jours à 22h
cron.schedule('0 22 * * *', importDocumentsFromPartner);
```

### Résultat
✅ Les documents sont associés aux bons dossiers via le pattern `[2024-XXX]`:
- `[2024-001]_Requete.pdf` → Dossier 2024-001
- `[2024-002]_Contrat.docx` → Dossier 2024-002

---

## 3. Import FTP avec Filtres Avancés (Production)

### Scénario
Import uniquement les fichiers PDF modifiés ce mois-ci, en excluant les fichiers temporaires.

```bash
# Configuration avancée
curl -X POST http://localhost:5210/api/ExternalDocumentImport/from-ftp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "ftpConfig": {
      "host": "archive.company.com",
      "port": 21,
      "username": "import_user",
      "password": "MyPassword123!",
      "useSsl": true,
      "basePath": "/documents"
    },
    "importConfig": {
      "sourcePath": "/2024",
      "filePattern": ".*\\.pdf$",
      "allowedExtensions": [".pdf"],
      "exclusionPatterns": ["temp", "backup", ".tmp", "~"],
      "maxFileSizeMB": 100,
      "minModifiedDate": "2024-01-01T00:00:00Z",
      "maxModifiedDate": "2024-01-31T23:59:59Z",
      "recursiveImport": true,
      "ignoreHiddenFiles": true,
      "maxFilesCount": 5000,
      "preventDuplicates": true,
      "dossierMappingStrategy": 1,
      "defaultDocumentType": "Requête",
      "markAsConfidential": false,
      "fileNamePrefix": "ARCHIVE_",
      "fileNameSuffix": "_JAN2024"
    }
  }'
```

### Résultat
✅ Seuls les PDFs de janvier, non-temporaires, non-cachés sont importés

---

## 4. Planification : Import Nocturne Automatique

### Implémentation avec Hangfire (Recommended)

```csharp
// Dans Program.cs
builder.Services.AddHangfire(config => config.UseSqlServerStorage(connectionString));
builder.Services.AddHangfireServer();

// Dans un controller ou service
[ApiController]
[Route("api/[controller]")]
public class ScheduledImportController : ControllerBase
{
    private readonly IBackgroundJobClient _jobClient;
    private readonly IExternalDocumentImportService _importService;

    [HttpPost("schedule-nightly-import")]
    [Authorize(Roles = "Admin")]
    public IActionResult ScheduleNightlyImport()
    {
        // Planifier import tous les jours à 22h
        RecurringJob.AddOrUpdate(
            "nightly-ftp-import",
            () => RunNightlyImportAsync(),
            Cron.Daily(22, 0));  // 22h00

        return Ok(new { message = "Import nocturne planifié" });
    }

    public async Task RunNightlyImportAsync()
    {
        var config = new ExternalDocumentImportConfigDto
        {
            SourcePath = "/daily",
            MinModifiedDate = DateTime.UtcNow.AddDays(-1),
            FilePattern = @"^\d{4}-\d{3}_.*\.pdf$",
            DossierMappingStrategy = DossierMappingStrategy.FileNamePattern,
            DossierPatternRegex = @"^(\d{4}-\d{3})_",
            PreventDuplicates = true
        };

        try
        {
            var provider = new FtpDocumentSourceProvider(
                host: Environment.GetEnvironmentVariable("FTP_HOST"),
                username: Environment.GetEnvironmentVariable("FTP_USER"),
                password: Environment.GetEnvironmentVariable("FTP_PASSWORD"));

            var result = await _importService.ImportFromSourceAsync(
                provider,
                config,
                AdminUserId,  // Utilisateur "système"
                UserRole.Admin);

            // Envoyer rapport
            await SendImportReportEmailAsync(result);

            System.Diagnostics.Debug.WriteLine(
                $"[Nightly] ✓ Import: {result.DocumentsImported} docs");
        }
        catch (Exception ex)
        {
            // Logger l'erreur
            System.Diagnostics.Debug.WriteLine(
                $"[Nightly] ✗ Erreur: {ex.Message}");
            
            // Envoyer alerte admin
            await SendErrorAlertEmailAsync(ex);
        }
    }

    private async Task SendImportReportEmailAsync(ExternalImportResultDto result)
    {
        var emailBody = $"""
            Import Quotidien - Rapport
            
            ✓ Documents importés: {result.DocumentsImported}
            ✗ Erreurs: {result.DocumentsFailed}
            📊 Taux de succès: {result.SuccessRate:F1}%
            ⏱️ Durée: {result.DurationSeconds:F1}s
            💾 Taille totale: {result.FormattedSize}
            
            Détails des erreurs:
            {string.Join("\n", result.FailedDocuments.Select(e => $"- {e.FileName}: {e.ErrorMessage}"))}
            """;

        // Utiliser votre service d'email
        await _emailService.SendAsync(
            to: "admin@sigac.local",
            subject: $"Import Quotidien: {result.DocumentsImported} documents",
            body: emailBody);
    }
}
```

### Configuration Appsettings
```json
{
  "ExternalImport": {
    "Ftp": {
      "Host": "archive.company.com",
      "Port": 21,
      "Username": "${FTP_USERNAME}",
      "Password": "${FTP_PASSWORD}",
      "UseSsl": false
    },
    "Http": {
      "BaseUrl": "https://partner-system.com/api",
      "Timeout": 300
    }
  },
  "Hangfire": {
    "ConnectionString": "Server=...;Database=sigac_hangfire"
  }
}
```

---

## 5. Monitorin : Statut des Imports

### Dashboard pour Admin

```typescript
// React component pour voir les imports récents
function ImportHistoryPage() {
    const [imports, setImports] = useState([]);

    useEffect(() => {
        // GET /api/ExternalDocumentImport/history
        fetch('/api/ExternalDocumentImport/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(r => r.json())
        .then(data => setImports(data));
    }, []);

    return (
        <div>
            <h2>Historique des Imports Externes</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Source</th>
                        <th>Documents</th>
                        <th>Succès</th>
                        <th>Erreurs</th>
                        <th>Durée</th>
                    </tr>
                </thead>
                <tbody>
                    {imports.map(imp => (
                        <tr key={imp.importId}>
                            <td>{new Date(imp.startTime).toLocaleString()}</td>
                            <td>{imp.sourceType}</td>
                            <td>{imp.documentsFound}</td>
                            <td className="success">{imp.documentsImported}</td>
                            <td className="error">{imp.documentsFailed}</td>
                            <td>{imp.durationSeconds.toFixed(1)}s</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

---

## 6. Gestion d'Erreurs : Exemple Réaliste

### Import qui échoue partiellement

```
Fichiers trouvés sur FTP:
1. requete.pdf (100 KB) ✓
2. contrat.docx (50 KB) ✓
3. BACKUP_old.pdf (1.5 GB) ✗ Trop volumineux
4. readme.txt (2 KB) ✗ Extension .txt refusée
5. [2024-999]_doc.pdf (200 KB) ✗ Dossier 2024-999 n'existe pas
6. attestation.pdf (300 KB) ✓
```

### Résultat API

```json
{
  "importId": "abc123",
  "sourceType": "FTP",
  "message": "Import complété: 3 documents importés, 3 erreurs",
  "documentsFound": 6,
  "documentsImported": 3,
  "documentsFailed": 3,
  "successRate": 50.0,
  "successfulDocuments": [
    "requete.pdf",
    "contrat.docx",
    "attestation.pdf"
  ],
  "failedDocuments": [
    {
      "fileName": "BACKUP_old.pdf",
      "filePath": "/2024/BACKUP_old.pdf",
      "errorMessage": "Fichier trop volumineux: 1500MB (max: 500MB)"
    },
    {
      "fileName": "readme.txt",
      "filePath": "/2024/readme.txt",
      "errorMessage": "Extension non autorisée: .txt. Autorisées: .pdf, .docx"
    },
    {
      "fileName": "[2024-999]_doc.pdf",
      "filePath": "/2024/[2024-999]_doc.pdf",
      "errorMessage": "Impossible d'associer le fichier à un dossier. Dossier '2024-999' non trouvé"
    }
  ]
}
```

**Comportement** : 
- ✅ Les 3 bons fichiers sont importés
- ❌ Les 3 fichiers problématiques sont loggés avec explication
- ✅ L'admin peut corriger et relancer

---

## 7. Optimisation : Gros Volume (10 000+ fichiers)

### Stratégie : Import par Batch

```csharp
public async Task ImportLargeVolumeAsync()
{
    const int batchSize = 1000;
    var allFiles = await _sourceProvider.ListFilesAsync("/");
    var batches = allFiles.Chunk(batchSize);

    foreach (var batch in batches)
    {
        var config = new ExternalDocumentImportConfigDto
        {
            SourcePath = "/",
            MaxFilesCount = batchSize
        };

        var result = await _importService.ImportFromSourceAsync(
            _sourceProvider,
            config,
            userId,
            userRole);

        Console.WriteLine($"Batch: {result.DocumentsImported}/{batchSize}");
        
        // Pause entre batches pour ne pas surcharger le serveur
        await Task.Delay(TimeSpan.FromSeconds(10));
    }
}
```

---

## 8. Test Unitaire : Valider la Logique

```csharp
[TestFixture]
public class ExternalDocumentImportServiceTests
{
    private Mock<IExternalDocumentSourceProvider> _sourceMock;
    private Mock<IDossierRepository> _dossierRepoMock;
    private Mock<IDocumentRepository> _documentRepoMock;
    private ExternalDocumentImportService _service;

    [SetUp]
    public void Setup()
    {
        _sourceMock = new Mock<IExternalDocumentSourceProvider>();
        _dossierRepoMock = new Mock<IDossierRepository>();
        _documentRepoMock = new Mock<IDocumentRepository>();
        
        _service = new ExternalDocumentImportService(
            _dossierRepoMock.Object,
            _documentRepoMock.Object,
            null, null);
    }

    [Test]
    public async Task ImportFromSourceAsync_WithFileTooLarge_SkipsFile()
    {
        // Arrange
        var tooLargeFile = new RemoteFileDto
        {
            FileName = "huge.pdf",
            FilePath = "/huge.pdf",
            FileSize = 1000 * 1024 * 1024  // 1 GB
        };

        _sourceMock
            .Setup(s => s.ListFilesAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RemoteFileDto> { tooLargeFile });

        var config = new ExternalDocumentImportConfigDto { MaxFileSizeMB = 500 };

        // Act
        var result = await _service.ImportFromSourceAsync(
            _sourceMock.Object,
            config,
            Guid.NewGuid(),
            UserRole.Admin);

        // Assert
        Assert.AreEqual(0, result.DocumentsImported);
        Assert.AreEqual(1, result.DocumentsFailed);
        Assert.IsTrue(result.FailedDocuments[0].ErrorMessage
            .Contains("trop volumineux"));
    }
}
```

---

## 9. Intégration Complète : API + Frontend

### Postman Collection

```json
{
  "info": {
    "name": "External Document Import",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Test FTP Connection",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "url": {"raw": "{{baseUrl}}/ExternalDocumentImport/test-ftp-connection"},
        "body": {
          "raw": "{...}"
        }
      }
    },
    {
      "name": "Import from FTP",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "url": {"raw": "{{baseUrl}}/ExternalDocumentImport/from-ftp"},
        "body": {"raw": "{...}"}
      }
    }
  ]
}
```

---

## Conclusion

**Résumé des 3 Patterns :**

| Pattern | Meilleur pour | Setup |
|---------|---------------|-------|
| **CSV + B64** | Volume petit, upload manuel | ~5 min |
| **FTP** | Archives massives, structure dossiers | ~30 min |
| **HTTP/API** | Intégration système tiers | ~20 min |

**Prochaines étapes** :
1. Choisir le pattern adapté à votre infrastructure
2. Tester avec le endpoint test-connection
3. Configurer les credentials de manière sécurisée
4. Planifier l'import (manual ou cron job)
5. Monitorer les résultats

**Questions ?** Consultez le guide complet ou contactez l'équipe devops.
