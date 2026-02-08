# 📚 Documentation : Importer Documents depuis Serveurs Externes

## 📖 Navigation Rapide

### 🎯 Je veux...

| Besoin | Ressource | Durée |
|--------|-----------|-------|
| Comprendre les 3 patterns | `EXTERNAL_DOCUMENT_IMPORT_VISUAL_COMPARISON.md` | 10 min |
| Vue d'ensemble architecture | `EXTERNAL_DOCUMENT_IMPORT_ARCHITECTURE.md` | 30 min |
| Guide utilisateur complet | `EXTERNAL_DOCUMENT_IMPORT_GUIDE.md` | 45 min |
| Exemples pratiques + code | `EXTERNAL_DOCUMENT_IMPORT_EXAMPLES.md` | 30 min |
| Résumé exécutif | `EXTERNAL_DOCUMENT_IMPORT_SUMMARY.md` | 15 min |
| **Commencer rapidement** | **Section "Quick Start" ci-dessous** | **5 min** |

---

## 🚀 Quick Start (5 minutes)

### Pattern 1: Import FTP Simple

```bash
# 1. Test connexion
curl -X POST http://localhost:5210/api/ExternalDocumentImport/test-ftp-connection \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "archive.company.com",
    "port": 21,
    "username": "user",
    "password": "pass"
  }'

# 2. Importer
curl -X POST http://localhost:5210/api/ExternalDocumentImport/from-ftp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ftpConfig": { 
      "host": "archive.company.com", 
      "port": 21, 
      "username": "user", 
      "password": "pass" 
    },
    "importConfig": {
      "sourcePath": "/documents",
      "dossierMappingStrategy": 1,
      "allowedExtensions": [".pdf", ".docx"]
    }
  }'
```

### Pattern 2: Import HTTP API

```bash
curl -X POST http://localhost:5210/api/ExternalDocumentImport/from-http \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "httpConfig": {
      "baseUrl": "https://partner-api.com",
      "headers": { "Authorization": "Bearer partner_token" }
    },
    "importConfig": {
      "sourcePath": "/files",
      "dossierMappingStrategy": 2,
      "dossierPatternRegex": "\\[([^\\]]+)\\]"
    }
  }'
```

---

## 📚 Documentation Complète

### 1️⃣ EXTERNAL_DOCUMENT_IMPORT_VISUAL_COMPARISON.md
**Pour**: Comprendre rapidement les 3 patterns  
**Contient**:
- Diagrammes ASCII des 3 workflows
- Tableau comparatif détaillé
- Matrice de décision
- Courbes de performance
- Scores et recommandations

**Lire si**: Vous devez choisir rapidement quel pattern utiliser

---

### 2️⃣ EXTERNAL_DOCUMENT_IMPORT_ARCHITECTURE.md
**Pour**: Vue d'ensemble technique et design patterns  
**Contient**:
- Architecture complète (diagrammes)
- 3 patterns expliqués en détail
- Code simplifié (FtpProvider, Service)
- Sécurité
- Roadmap future
- Comparaison patterns (tableau)

**Lire si**: Vous êtes architecte ou lead developer validant la solution

---

### 3️⃣ EXTERNAL_DOCUMENT_IMPORT_GUIDE.md
**Pour**: Guide utilisateur complet  
**Contient**:
- 3 cas d'usage réalistes (FTP, HTTP, Filtres avancés)
- Workflow complet avec exemples JSON
- Stratégies d'association dossier→fichier (4 stratégies)
- Options de filtrage (patterns, dates, extensions)
- Test de connexion
- Bonnes pratiques sécurité
- Gestion d'erreurs
- Dépannage (troubleshooting)
- Performance & considérations
- Synchronisation bidirectionnelle

**Lire si**: Vous mettez en place l'import en production

---

### 4️⃣ EXTERNAL_DOCUMENT_IMPORT_EXAMPLES.md
**Pour**: Exemples pratiques et code réel  
**Contient**:
- 9 exemples complets (bash, JavaScript, C#)
- Import FTP simple (entreprise archivé)
- Import HTTP depuis API tiers
- Import FTP avec filtres avancés
- Planification import nocturne (Hangfire)
- Monitoring et dashboard React
- Gestion d'erreurs réaliste
- Optimisation gros volume (batch)
- Tests unitaires
- Configuration appsettings

**Lire si**: Vous implémentez le code

---

### 5️⃣ EXTERNAL_DOCUMENT_IMPORT_SUMMARY.md
**Pour**: Résumé exécutif avec prochaines étapes  
**Contient**:
- Réponse résumée à la question
- 3 patterns (tableau)
- Fichiers créés (structure projet)
- Quick start (2 patterns)
- Architecture simplifiée
- Comparaison patterns (tableau)
- Sécurité
- Performance
- Phases implémentation
- Cas d'usage courants
- FAQ
- Ressources

**Lire si**: Vous responsable projet/décideur

---

## 🗂️ Fichiers Source Implémentés

### Backend Code

```
sigac-backend/SIGAC.Core/Interfaces/
├── IExternalDocumentSourceProvider.cs      (Abstraction)
└── IExternalDocumentImportService.cs       (Service interface)

sigac-backend/SIGAC.Core/Services/
└── ExternalDocumentImportService.cs        (Logique orchestration)

sigac-backend/SIGAC.Core/DTOs/
└── ExternalDocumentImportDto.cs            (Configuration + Résultats)

sigac-backend/SIGAC.Infrastructure/ExternalSources/
├── FtpDocumentSourceProvider.cs            (FTP Provider)
└── HttpDocumentSourceProvider.cs           (HTTP Provider)

sigac-backend/SIGAC.API/Controllers/
└── ExternalDocumentImportController.cs     (Endpoints API REST)

sigac-backend/SIGAC.API/
└── Program.cs                              (DI registration)
```

### Documentation

```
/SIGAC/
├── EXTERNAL_DOCUMENT_IMPORT_ARCHITECTURE.md         (Vue d'ensemble)
├── EXTERNAL_DOCUMENT_IMPORT_GUIDE.md                (Guide utilisateur)
├── EXTERNAL_DOCUMENT_IMPORT_EXAMPLES.md             (Exemples + code)
├── EXTERNAL_DOCUMENT_IMPORT_SUMMARY.md              (Résumé exécutif)
├── EXTERNAL_DOCUMENT_IMPORT_VISUAL_COMPARISON.md    (Diagrammes)
└── EXTERNAL_DOCUMENT_IMPORT_DOCS.md                 (CE FICHIER)
```

---

## 🎯 Scénarios d'Utilisation

### Scénario 1: Archivage Historique
> "Nous avons 100 000 documents anciens sur serveur FTP, migrer vers SIGAC"

**Solution**: FTP Pattern  
**Effort**: 2-3 semaines  
**Documentation**: GUIDE.md (Cas 1) + EXAMPLES.md (Exemple 1)

### Scénario 2: Intégration Partenaire
> "Notre partenaire exposes une API pour ses documents, synchroniser"

**Solution**: HTTP Pattern  
**Effort**: 1-2 semaines  
**Documentation**: GUIDE.md (Cas 2) + EXAMPLES.md (Exemple 2)

### Scénario 3: Import Quotidien Automatique
> "Import nightly depuis FTP, rapport admin email"

**Solution**: FTP Pattern + Hangfire  
**Effort**: 1 jour  
**Documentation**: EXAMPLES.md (Exemple 4) + ARCHITECTURE.md

### Scénario 4: Test/POC
> "Tester rapidement avec 100 documents"

**Solution**: CSV Pattern (existant) ou HTTP test  
**Effort**: 30 minutes  
**Documentation**: EXAMPLES.md (Exemple 1) ou GUIDE.md

---

## 🏗️ Roadmap d'Implémentation

### Phase 1: Deployment Code ✅
- [ ] Clone repository
- [ ] Parcourir les fichiers sources (sigac-backend/)
- [ ] Comprendre IExternalDocumentSourceProvider
- [ ] Build + test local

**Durée**: 2-4 heures  
**Docs**: ARCHITECTURE.md + EXAMPLES.md

### Phase 2: Test Local
- [ ] Démarrer backend
- [ ] Tester endpoint test-connection
- [ ] Import FTP simple (petit lot)
- [ ] Vérifier audit logging

**Durée**: 2-4 heures  
**Docs**: EXAMPLES.md + GUIDE.md

### Phase 3: Configuration Production
- [ ] Adapter à infrastructure réelle
- [ ] Sécuriser credentials (env vars)
- [ ] Configurer firewall/NAT si FTP
- [ ] Tester avec production data (staging)

**Durée**: 1-2 jours  
**Docs**: GUIDE.md (Sécurité) + EXAMPLES.md

### Phase 4: Go Live
- [ ] Déployer code
- [ ] Lancer import batch initial
- [ ] Monitor résultats
- [ ] Alert admin si erreurs

**Durée**: 1 jour + support  
**Docs**: EXAMPLES.md (Monitoring)

### Phase 5: Optimisation (Optionnel)
- [ ] Planification Hangfire
- [ ] Dashboard monitoring
- [ ] Webhooks notifications
- [ ] S3 Provider (si besoin)

**Durée**: 1-2 semaines  
**Docs**: EXAMPLES.md (Exemple 4) + ARCHITECTURE.md (Roadmap)

---

## 🔑 Concepts Clés

### IExternalDocumentSourceProvider
Interface abstraite qui définit le contrat pour **toute** source de documents :
- `ListFilesAsync()` - Lister les fichiers
- `DownloadFileAsync()` - Télécharger un fichier
- `TestConnectionAsync()` - Tester la connexion

Implémentations :
- ✅ FtpDocumentSourceProvider
- ✅ HttpDocumentSourceProvider
- ⏳ S3DocumentSourceProvider (futur)
- ⏳ SmbDocumentSourceProvider (futur)

### ExternalDocumentImportService
Service qui orchestre l'import :
1. Valide RBAC (Admin/Manager only)
2. Teste connexion à la source
3. Liste les fichiers (avec filtres)
4. Pour chaque fichier:
   - Télécharge depuis la source
   - Valide taille, extension
   - Associe au dossier (3 stratégies)
   - Calcule SHA256 (dédoublonnage)
   - Crée Document entity
   - Log audit
5. Retourne résultat avec statistiques

### DossierMappingStrategy
Comment associer un fichier à un dossier :
- **0: DefaultDossier** - Tous → même dossier
- **1: FolderName** - Nom dossier parent = numéro dossier
- **2: FileNamePattern** - Pattern regex dans nom fichier
- **3: CreateNewDossier** - Créer nouveau dossier pour batch

---

## 🔐 Sécurité Intégrée

✅ **RBAC** - Admin/Manager only  
✅ **HTTPS/SFTP** - TLS encryption recommandée  
✅ **Credentials** - Variables d'environnement, jamais hardcodé  
✅ **Validation** - Taille fichier, extensions, patterns  
✅ **SHA256** - Intégrité fichier + dédoublonnage  
✅ **Audit** - AuditLog complet (who, what, when, where)  
✅ **No Secrets in Logs** - Passwords/tokens jamais loggés  

Voir **GUIDE.md** section "Sécurité" pour détails.

---

## 📊 Métriques & Monitoring

Chaque import retourne :
```json
{
  "importId": "uuid",
  "sourceType": "FTP",
  "documentsFound": 1000,
  "documentsImported": 998,
  "documentsFailed": 2,
  "totalSize": "2.5 GB",
  "durationSeconds": 125.5,
  "successRate": 99.8,
  "failedDocuments": [
    { "fileName": "...", "errorMessage": "..." }
  ]
}
```

Optionnel : Dashboard Hangfire + Email alerts (voir EXAMPLES.md)

---

## 🐛 Dépannage Rapide

| Symptôme | Cause | Solution |
|----------|-------|----------|
| "401 Unauthorized" | Token JWT expiré | Se reconnecter |
| "403 Forbidden" | Pas Admin/Manager | Demander accès |
| "Connection timeout" | FTP/serveur injoignable | Vérifier host, port, firewall |
| "Authentification échouée" | Credentials invalides | Vérifier username/password env vars |
| "Fichier trop volumineux" | Dépasse limite | Augmenter maxFileSizeMB (config) |
| "Extension non autorisée" | Type refusé | Ajouter à allowedExtensions (config) |
| "Dossier introuvable" | Numero invalide | Vérifier dossierMappingStrategy et pattern |

Voir **GUIDE.md** section "Dépannage" pour guide complet.

---

## 💡 FAQ

### Q: Quel pattern utiliser pour mon cas ?
**R**: 
- **< 1000 fichiers** → CSV ou HTTP
- **> 1000 fichiers** → FTP
- **API disponible** → HTTP
- **Serveur FTP existant** → FTP
- **Doute** → Commence par HTTP (plus moderne)

### Q: Peut-on importer depuis AWS S3 ?
**R**: Pas implémenté yet, mais architecture permet. S3 viendra en Phase 2.

### Q: Combien de temps pour importer 100 000 documents ?
**R**: ~10-20 minutes (dépend réseau + vitesse serveur)

### Q: Les imports peuvent-ils être annulés ?
**R**: Oui, via cancellation token. Chaque fichier importé atomiqu.

### Q: Dois-je créer les dossiers à l'avance ?
**R**: Oui, sauf strategy 3 (CreateNewDossier). Sinon erreur "dossier non trouvé".

### Q: Les doublons sont détectés comment ?
**R**: Via SHA256. Si préventDuplicates=true, 2e fichier = rejeté.

Voir **SUMMARY.md** section "FAQ" pour questions complètes.

---

## 📞 Support

### Documentation
- 📖 5 fichiers de documentation (voir Navigation ci-dessus)
- 🔍 Recherche dans fichiers : grep -r "keyword" /SIGAC/EXTERNAL_*

### Code
- 🔧 Fichiers sources : `/sigac-backend/SIGAC.*/...`
- 🧪 Tests : À ajouter en `/sigac-backend/SIGAC.Tests/...`
- 📝 Comments : Commentaires XML sur interfaces publiques

### Communauté
- 💬 Questions → Issues GitHub
- 🐛 Bugs → Report + Pull Request
- 💡 Idées → Discussions

---

## 🎓 Apprentissage : Ordre Recommandé

1. **5 min** : Lire ce fichier (vue d'ensemble)
2. **10 min** : Consulter VISUAL_COMPARISON.md (diagrammes)
3. **30 min** : Lire ARCHITECTURE.md (design)
4. **45 min** : Lire GUIDE.md (configuration)
5. **30 min** : Parcourir EXAMPLES.md (code)
6. **30 min** : Parcourir code source dans sigac-backend/
7. **1-2h** : Implémenter petit POC localement

**Total**: ~3-4 heures pour maîtriser le sujet

---

## 🏁 Conclusion

SIGAC supporte maintenant **3 patterns d'import** pour couvrir tous les cas d'usage :

| Pattern | Meilleur pour | Effort | Durée Read |
|---------|---------------|--------|-----------|
| CSV + B64 | Petit volume | Facile | 5 min |
| **FTP** | Gros volume | Moyen | 15 min |
| **HTTP/API** | Intégration | Facile | 10 min |

Tous 3 coexistent + extensible pour S3, SMB, etc.

**Prochaine étape** : Choisir documentation selon votre rôle + besoin →

- Architecte/Lead : ARCHITECTURE.md
- Dev/Ops : GUIDE.md + EXAMPLES.md
- Décideur : SUMMARY.md
- Novice : VISUAL_COMPARISON.md

---

**Créé**: 15 Jan 2026  
**Version**: 1.0  
**Status**: Ready for Implementation ✅

---

## 📋 Checklist d'Implémentation

- [ ] Lire VISUAL_COMPARISON.md (10 min)
- [ ] Lire ARCHITECTURE.md (30 min)
- [ ] Parcourir code source sigac-backend/ (30 min)
- [ ] Démarrer backend localement
- [ ] Tester endpoint test-connection
- [ ] Importer petit lot (< 100 docs)
- [ ] Vérifier audit logging
- [ ] Adapter configuration à votre infra
- [ ] Tester avec production data (staging)
- [ ] Déployer sur Render
- [ ] Monitorer premiers imports

---

**Questions ?** Consultez les fichiers ou demandez support.
