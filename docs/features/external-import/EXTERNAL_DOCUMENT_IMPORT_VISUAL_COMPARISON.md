# 📊 Comparaison Visuelle : 3 Patterns d'Import

## 1️⃣ CSV + Base64 (Existant) vs 2️⃣ FTP (Nouveau) vs 3️⃣ HTTP (Nouveau)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PATTERN 1: CSV + BASE64                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  User                                                                             │
│    │                                                                              │
│    └─► [Prepare CSV File]                                                        │
│         │                                                                         │
│         ├─ NumeroDossier | NomFichier | UrlDocument (data:base64...)             │
│         ├─ 2024-001 | Requete.pdf | data:application/pdf;base64,JVB...          │
│         ├─ 2024-002 | Contrat.docx | data:application/vnd.ms-word...            │
│         │                                                                         │
│         └─► [Upload CSV via Web UI]                                              │
│              │                                                                    │
│              └─► POST /api/DocumentImport/dossiers (multipart/form-data)         │
│                   │                                                               │
│                   ├─ Parse CSV                                                    │
│                   ├─ Decode Base64                                                │
│                   ├─ Save file to /uploads/                                       │
│                   ├─ Create Document entity                                       │
│                   ├─ Log audit                                                    │
│                   │                                                               │
│                   └─► Response: { documentsImported: 2, documentsFailed: 0 }     │
│                                                                                   │
│ ✅ AVANTAGES:                     ❌ LIMITATIONS:                                │
│ • Aucun setup infrastructure       • Max ~5000 fichiers                           │
│ • Données inline sécurisées       • Nécessite encodage Base64                    │
│ • Upload manuel flexible           • Pas d'automatisation                        │
│ • Gestion erreur par ligne         • Performance mauvaise pour gros volume        │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PATTERN 2: FTP (NEW)                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  FTP Server (archive.company.com:21)                                             │
│    │                                                                              │
│    ├─ /documents/                                                                │
│    │  ├─ /2024-001/                                                              │
│    │  │  ├─ requete.pdf (100 KB)                                                 │
│    │  │  ├─ contrat.docx (50 KB)                                                 │
│    │  │  └─ preuve.jpg (200 KB)                                                  │
│    │  │                                                                           │
│    │  └─ /2024-002/                                                              │
│    │     └─ attestation.pdf (150 KB)                                             │
│    │                                                                              │
│    └─► [Admin Triggers Import]                                                   │
│         │                                                                         │
│         POST /api/ExternalDocumentImport/from-ftp                                 │
│         {                                                                         │
│           "ftpConfig": {                                                          │
│             "host": "archive.company.com",                                        │
│             "username": "${FTP_USER}",                                            │
│             "password": "${FTP_PASS}"                                             │
│           },                                                                      │
│           "importConfig": {                                                       │
│             "dossierMappingStrategy": 1  // FolderName                            │
│           }                                                                       │
│         }                                                                         │
│         │                                                                         │
│         ├─ Connect FTP                                                            │
│         ├─ List files recursively                                                │
│         ├─ Filter + validate                                                     │
│         ├─ Download each file                                                    │
│         ├─ Resolve dossier (2024-001 → Dossier ID)                               │
│         ├─ Calculate SHA256                                                      │
│         ├─ Create Document + Audit                                               │
│         │                                                                         │
│         └─► Response: {                                                          │
│               documentsImported: 4,                                               │
│               documentsFound: 4,                                                  │
│               totalSize: "500 KB",                                                │
│               durationSeconds: 12.5,                                              │
│               successRate: 100%                                                   │
│             }                                                                     │
│                                                                                   │
│ ✅ AVANTAGES:                     ❌ LIMITATIONS:                                │
│ • Volume très élevé (~10 000+)    • Nécessite serveur FTP                        │
│ • Automatisable (cron job)         • Setup plus complexe                          │
│ • Stratégies flexibles             • Gestion firewall/NAT                         │
│ • Performance excellente           • Maintenance serveur FTP                      │
│ • Gestion batch par dossier        │                                             │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                      PATTERN 3: HTTP/API (NEW)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  External System (partner-system.com)                                            │
│    │                                                                              │
│    └─ API: GET /files                                                            │
│       │                                                                           │
│       └─► Response JSON:                                                         │
│           {                                                                       │
│             "files": [                                                            │
│               {                                                                   │
│                 "name": "[2024-001]_Requete.pdf",                                │
│                 "url": "https://partner.com/files/abc123/download",              │
│                 "size": 100000,                                                   │
│                 "modified": "2024-01-10T14:30:00Z"                               │
│               },                                                                  │
│               {                                                                   │
│                 "name": "[2024-002]_Contrat.docx",                               │
│                 "url": "https://partner.com/files/def456/download",              │
│                 "size": 50000                                                     │
│               }                                                                   │
│             ]                                                                     │
│           }                                                                       │
│                                                                                   │
│    └─► [Scheduled Job (22h00 every day)]                                         │
│         │                                                                         │
│         POST /api/ExternalDocumentImport/from-http                                │
│         {                                                                         │
│           "httpConfig": {                                                         │
│             "baseUrl": "https://partner-system.com",                              │
│             "headers": {                                                          │
│               "Authorization": "Bearer ${API_TOKEN}"                              │
│             }                                                                     │
│           },                                                                      │
│           "importConfig": {                                                       │
│             "dossierMappingStrategy": 2,  // FileNamePattern                      │
│             "dossierPatternRegex": "\\[([^\\]]+)\\]"                              │
│           }                                                                       │
│         }                                                                         │
│         │                                                                         │
│         ├─ GET /files from partner API                                           │
│         ├─ Parse JSON response                                                   │
│         ├─ Filter by pattern/extensions                                          │
│         ├─ Download from each URL                                                │
│         ├─ Extract dossier from pattern: [2024-001] → Dossier ID                 │
│         ├─ Calculate SHA256                                                      │
│         ├─ Create Document + Audit                                               │
│         │                                                                         │
│         └─► Response: {                                                          │
│               documentsImported: 2,                                               │
│               documentsFound: 2,                                                  │
│               totalSize: "150 KB",                                                │
│               durationSeconds: 8.3                                                │
│             }                                                                     │
│                                                                                   │
│  📧 Email Admin: "Import Quotidien: 2 docs importés"                             │
│                                                                                   │
│ ✅ AVANTAGES:                     ❌ LIMITATIONS:                                │
│ • Intégration système tiers        • Volume limité (timeout HTTP)                │
│ • Aucune infrastructure FTP         • Dépend de disponibilité API                │
│ • Facile à tester (Postman)        • Latence réseau variable                     │
│ • Rapide (HTTP keeps-alive)        • Gestion token/auth complexe                 │
│ • URLs directes vs streaming       │                                             │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Tableau Comparatif Détaillé

```
┌──────────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Critère              │ CSV + Base64     │ FTP              │ HTTP/API         │
├──────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ VOLUME               │                  │                  │                  │
│ Min                  │ 1                │ 10               │ 1                │
│ Typique              │ 100-1000         │ 1000-100000      │ 100-5000         │
│ Max                  │ 5000             │ 1000000          │ 10000            │
├──────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ TEMPS IMPORT         │                  │                  │                  │
│ 100 docs             │ 2-5s             │ 3-5s             │ 2-4s             │
│ 1000 docs            │ 20-50s           │ 10-30s           │ 10-25s           │
│ 10000 docs           │ ❌ Not suitable  │ 2-5 min          │ ❌ Timeout       │
├──────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ FRÉQUENCE            │                  │                  │                  │
│ Manuelle             │ ✅ Facile        │ ⚠️ Possible      │ ✅ Facile        │
│ Planifiée (cron)     │ ❌ Pas adapté    │ ✅ Idéal         │ ✅ Possible      │
│ Temps réel           │ ❌ Non           │ ⚠️ Lourd         │ ⚠️ Lent          │
├──────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ INFRASTRUCTURE       │                  │                  │                  │
│ Requise              │ Aucune           │ Serveur FTP      │ Aucune (API)     │
│ Complexité setup     │ ⭐              │ ⭐⭐⭐         │ ⭐⭐            │
│ Coût infra           │ Gratuit          │ $300-1000/an     │ Gratuit           │
├──────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ SÉCURITÉ             │                  │                  │                  │
│ Protocole            │ HTTPS            │ FTP/SFTP         │ HTTPS            │
│ Encryption           │ SSL/TLS          │ SFTP idéal       │ SSL/TLS          │
│ Auth                 │ JWT              │ Username/pass    │ Bearer/API key   │
│ Credentials          │ Env vars         │ Env vars         │ Env vars         │
├──────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ FLEXIBILITÉ          │                  │                  │                  │
│ Chemins fichiers     │ Fixe             │ Flexible         │ Flexible         │
│ Mapping dossiers     │ 1 seul           │ 3 stratégies     │ 3 stratégies     │
│ Filtres              │ Limités          │ Complets         │ Limités          │
│ Pattern matching     │ ❌              │ ✅               │ ⚠️ Limité        │
├──────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ MAINTENANCE          │                  │                  │                  │
│ Effort               │ Minimal          │ Moyen            │ Minimal          │
│ Troubleshooting      │ Facile           │ Moyen            │ Facile           │
│ Logs/Audit           │ Complets         │ Complets         │ Complets         │
├──────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ DISPONIBILITÉ        │                  │                  │                  │
│ Source               │ User             │ Serveur externe  │ API partenaire   │
│ MTTR si erreur       │ Manuel           │ ~30 min          │ ~15 min          │
│ Redondance           │ N/A              │ N/A              │ ⚠️ Dépend API   │
├──────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ MONITORING           │                  │                  │                  │
│ Dashboard            │ ❌              │ ✅ Hangfire      │ ✅ Hangfire      │
│ Alertes              │ ❌              │ ✅ Email/Slack   │ ✅ Email/Slack   │
│ Métriques            │ Basiques         │ Détaillées       │ Détaillées       │
├──────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ SCALABILITÉ          │                  │                  │                  │
│ Scaling UP           │ Difficulté       │ Facile           │ Moyen            │
│ Parallelisation      │ ❌              │ ✅ (batch job)   │ ⚠️ (API limit)   │
│ Clustering           │ N/A              │ ✅               │ ⚠️               │
└──────────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

---

## 🎯 Matrice de Décision : Quel Pattern Choisir ?

```
                    ┌──────────────────────────────┐
                    │ Volume de documents?         │
                    └──────────────┬───────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
            [< 1000]           [1-100K]          [> 100K]
                │                  │                  │
                ▼                  ▼                  ▼
            ┌────────┐         ┌────────┐         ┌────────┐
            │ PETIT  │         │ MOYEN  │         │ GRAND  │
            └────┬───┘         └────┬───┘         └────┬───┘
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │ Source des documents?          │
                    └───────────────┬────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
              [Local]            [FTP]               [API]
              [CSV]              [SMB]             [URL]
                │                   │                   │
                ▼                   ▼                   ▼
        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │ CSV+Base64   │   │   FTP/SFTP   │   │  HTTP/API    │
        │              │   │              │   │              │
        │ ✅ Parfait   │   │ ✅ Idéal     │   │ ✅ Parfait   │
        │              │   │              │   │              │
        │ • Upload Web │   │ • Volume ↑   │   │ • Intégration│
        │ • Flex       │   │ • Planifié   │   │ • Partenaire │
        │ • Petit vol. │   │ • Auto       │   │ • API simple │
        └──────────────┘   └──────────────┘   └──────────────┘
```

---

## 📈 Courbe de Performance

```
Temps d'import (secondes)
│
│
2000 ├────────────────────────────────────────────────────────
│     │                                    CSV+Base64 ⚠️
1500 ├────────────────┐────────────────────────────────────
│     │                │                         (max: ~5000)
│     │                │ ┌─────────────────────────
1000 ├────────────────┤─┘                       
│     │                │                    
│     │                │    ┌──────────────────────── FTP ✅
 500 ├────────────────┼───┐│ ┌───────────────────────
│     │                │   └─┼─────────────────────── HTTP ✅
│     │                │     │
  0 ├─┬──┬──┬──┬──┬──┬──┬───┴──┬─────────────────────
│   │  │  │  │  │  │  │      │  │   │    │    │    │
│   100 500 1K 5K 10K 50K 100K 500K 1M   │    │    │
│   ▲    ▲    ▲   ▲   ▲    ▲   ▲   ▲  1000K 10M
│   │    │    │   │   │    │   │   └─ CSV max
│   │    │    │   │   │    │   └────── HTTP max
│   │    │    │   │   │    └────────── FTP start
│   │    │    │   │   └──────────────── Batch mode
│   │    │    │   └────────────────────CSV typical
│    tiny  small  medium  LARGE   VERY LARGE
         
Nombre de documents →
```

---

## 🔄 Cycle de Vie Comparé

```
CSV + Base64:
User uploads CSV
    ↓
[1-2 minutes]
    ↓
Documents visible
    ↓
(Pas d'automatisation)


FTP (Auto - Planifié):
Setup FTP connection
    ↓
Hang fire job (22h00)
    ↓
[1-30 minutes]
    ↓
Documents visible
    ↓
Email rapport admin
    ↓
(Répète chaque nuit automatiquement)


HTTP/API (Auto - On demand):
Partner API setup
    ↓
Trigger import (Web/API)
    ↓
[10 secondes - 5 minutes]
    ↓
Documents visible
    ↓
Webhook optional
    ↓
(Appelable à la demande ou planifié)
```

---

## 🏆 Scores (Sur 10)

```
                    CSV+Base64    FTP           HTTP/API
                    ──────────────────────────────────────
Facilité setup      ██████████ 10  ████░░░░░░░  4  ████████░░  8
Scalabilité         ███░░░░░░░  3  ██████████ 10  ████████░░  8
Performance         ██░░░░░░░░  2  ██████████ 10  █████████░  9
Automatisation      ░░░░░░░░░░  0  ██████████ 10  █████████░  9
Flexibilité         ████░░░░░░  4  ██████████ 10  ███████░░░  7
Sécurité            ████████░░  8  ████████░░  8  ████████░░  8
Support Métier      ██████░░░░  6  ████░░░░░░  4  ████░░░░░░  4
Maintenance         ██████████ 10  ██████░░░░  6  ████████░░  8
────────────────────────────────────────────────────────────
SCORE GLOBAL        40/100          60/100         69/100

                    ✅ Simple        ⚠️ Moyen       ✅ Bon
                    Manuel           Planifié       Intégration
```

---

## 🎓 Résumé Visuel

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    Choisir le Pattern d'Import                             │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  "Je dois importer des documents une fois"                                 │
│  └─► CSV + Base64 (Upload web, simple)                                     │
│                                                                             │
│  "Je dois importer des documents depuis FTP toutes les nuits"              │
│  └─► FTP Pattern (Planifié via Hangfire, massif)                          │
│                                                                             │
│  "Je dois synchroniser documents avec un système partenaire"               │
│  └─► HTTP/API Pattern (Intégration, flexible)                             │
│                                                                             │
│  "Je ne sais pas lequel choisir"                                           │
│  └─► Commence par CSV + Base64, migre à FTP si volume > 10K               │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Cas d'Usage par Pattern

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   CSV + Base64   │  │       FTP        │  │     HTTP/API     │
├──────────────────┼──┼──────────────────┼──┼──────────────────┤
│ • Importation    │  │ • Archivage      │  │ • Intégration    │
│   initiale       │  │   massive        │  │   partenaire     │
│ • Migration      │  │ • Backup         │  │ • Sync temps     │
│   petite base    │  │   restauration   │  │   réel           │
│ • Test/Demo      │  │ • Import auto    │  │ • Multi-tenancy  │
│ • Upload ad hoc  │  │   nightly        │  │ • Webhooks       │
│                  │  │ • Multi-dossier  │  │ • SaaS           │
│                  │  │ • Batch massive  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

**Conclusion** : 
- **CSV** = Simple & Manuel
- **FTP** = Puissant & Automatisé
- **HTTP** = Moderne & Flexible

Tous 3 coexistent harmonieusement dans SIGAC ! 🎉
