# SIGAC — Feuille de route et tâches restantes

**Date de création** : 13 novembre 2025  
**Dernière mise à jour** : 13 novembre 2025  
**Statut global** : ✅ Phase 1 (API Foundation) complétée

---

## 🎯 Vue d'ensemble des phases

### Phase 1 : Fondations API ✅ COMPLÈTE
**Objectif** : Mettre en place une API .NET Core stable avec authentification et audit.

**Réalisé** :
- ✅ Scaffold solution .NET avec 4 projets (API, Core, Infrastructure, Tests)
- ✅ Authentification JWT + refresh tokens
- ✅ EF Core + PostgreSQL
- ✅ Audit logging complet
- ✅ Health check endpoint
- ✅ Tests d'intégration (5 cas)
- ✅ Mise à jour sécurité packages
- ✅ API démarre et répond (http://127.0.0.1:5001)

**Statut** : ✅ Livrable et stable

---

### Phase 2 : Endpoints métier (À démarrer)
**Objectif** : Implémenter les endpoints pour Dossiers, Documents et Utilisateurs.

#### 2.1 Utilisateurs (UsersController)
**Tâches** :
- [ ] Implémenter `GET /api/Users` (list avec pagination)
- [ ] Implémenter `GET /api/Users/{id}` (détails)
- [ ] Implémenter `POST /api/Users` (créer, admin seulement)
- [ ] Implémenter `PUT /api/Users/{id}` (modifier, admin seulement)
- [ ] Implémenter `DELETE /api/Users/{id}` (supprimer, admin seulement)
- [ ] Valider avec FluentValidation
- [ ] Ajouter tests d'intégration (5+ cas)
- [ ] Documenter dans Swagger

**Estimation** : 4-6 heures

#### 2.2 Dossiers (DossiersController)
**Tâches** :
- [ ] Implémenter `GET /api/Dossiers` (list avec filtrage + pagination)
- [ ] Implémenter `GET /api/Dossiers/{id}` (détails complets)
- [ ] Implémenter `POST /api/Dossiers` (créer)
- [ ] Implémenter `PUT /api/Dossiers/{id}` (modifier statut, priorité, etc.)
- [ ] Implémenter `GET /api/Dossiers/{id}/statistiques` (stats par statut)
- [ ] Implémenter `GET /api/Dossiers/{id}/historique` (timeline des changements)
- [ ] Valider avec FluentValidation
- [ ] Ajouter tests d'intégration (10+ cas)
- [ ] Documenter dans Swagger

**Estimation** : 8-10 heures

**Options de filtrage suggérées** :
- Par statut (En cours, Jugé, Archivé, etc.)
- Par priorité (Basse, Normal, Haute, Urgente)
- Par type d'affaire
- Par rapporteur (UserId)
- Par date (avant/après)
- Recherche par numéro/titre

#### 2.3 Documents (DocumentsController)
**Tâches** :
- [ ] Implémenter `GET /api/Documents` (list avec filtrage)
- [ ] Implémenter `POST /api/Documents` (upload fichier associé à Dossier)
- [ ] Implémenter `DELETE /api/Documents/{id}` (supprimer)
- [ ] Gérer stockage fichiers (disque local, S3, Azure Blob Storage)
- [ ] Implémenter scan virus (ClamAV ou équivalent)
- [ ] Validations (type MIME, taille max 50MB, etc.)
- [ ] Ajouter tests d'intégration (5+ cas)
- [ ] Documenter dans Swagger

**Estimation** : 6-8 heures

---

### Phase 3 : Frontend intégration (À démarrer)
**Objectif** : Intégrer l'API avec le frontend React/Next.js.

**Tâches** :
- [ ] Configurer API client (Axios, TanStack Query, etc.)
- [ ] Implémenter login/logout côté frontend
- [ ] Implémenter pages liste dossiers
- [ ] Implémenter pages détail dossier
- [ ] Implémenter upload documents
- [ ] Implémenter formulaires création/modification
- [ ] Tester intégration API end-to-end
- [ ] Implémenter error handling et retry logic

**Estimation** : 15-20 heures

---

### Phase 4 : DevOps & Déploiement (À planifier)
**Objectif** : Préparer l'application pour production.

**Tâches** :
- [ ] Créer Dockerfile pour API
- [ ] Créer docker-compose.yml (API + PostgreSQL)
- [ ] Implémenter CI/CD (GitHub Actions, Azure Pipelines, etc.)
- [ ] Configurer secrets management (Environment variables / Key Vault)
- [ ] Configurer monitoring (Application Insights, Prometheus, etc.)
- [ ] Configurer logs centralisés (ELK stack, Splunk, etc.)
- [ ] Implémenter health checks pour K8s/load balancer
- [ ] Tester en environment staging
- [ ] Documentar runbook de déploiement

**Estimation** : 10-15 heures

---

### Phase 5 : Fonctionnalités avancées (À planifier)
**Objectif** : Ajouter des fonctionnalités de confort et de sécurité.

#### 5.1 Rapports & Export
- [ ] Générer rapports PDF (dossiers, statistiques)
- [ ] Export CSV (dossiers, décisions)
- [ ] Email notifications (changement statut, deadline, etc.)

#### 5.2 Notifications & Alertes
- [ ] WebSockets pour notifications real-time
- [ ] Push notifications (desktop/mobile)
- [ ] Email triggers (reminders, notifications)

#### 5.3 Conformité & Gouvernance
- [ ] Authentification LDAP/AD (optional)
- [ ] 2FA (TOTP, SMS, email)
- [ ] Chiffrement des données sensibles
- [ ] Conformité RGPD (droit à l'oubli, export données)
- [ ] Compliance audit trail (immuable, signé)

#### 5.4 Performance & Scalabilité
- [ ] Caching (Redis)
- [ ] Pagination optimisée
- [ ] Compression réponses
- [ ] Rate limiting
- [ ] Load testing & benchmarking

---

## 📊 Matrice de dépendances

```
Phase 1 (Fondations)
    ↓
Phase 2 (Endpoints)
    ↓
Phase 3 (Frontend)
    ↓
Phase 4 (DevOps)
    ↓
Phase 5 (Avancé)
```

**Note** : Les phases peuvent être parallélisées (ex: Phase 2.1 pendant que 2.2 est en cours).

---

## 🛠️ Outils et Technologies recommandés (Phase 2+)

### Backend (optionnel, amélioration)
- **Mediator Pattern** : MediatR pour simplifier handlers
- **CQRS** : Séparer Command/Query si complexité augmente
- **Rate Limiting** : AspNetCoreRateLimit
- **Validation avancée** : FluentValidation avec custom rules
- **Caching** : StackExchange.Redis
- **Background Jobs** : Hangfire pour tâches asynchrones

### DevOps (Phase 4)
- **Docker** : Containerisation
- **Kubernetes** : Orchestration (optionnel)
- **Terraform** : Infrastructure as Code
- **GitHub Actions** / **Azure Pipelines** : CI/CD
- **Prometheus** : Monitoring
- **Grafana** : Dashboards
- **ELK** ou **Splunk** : Log aggregation

### Frontend (Phase 3)
- **TanStack Query** : Gestion state serveur
- **React Hook Form** : Gestion formulaires
- **Zod** ou **Yup** : Validation côté client
- **Zustand** ou **Redux** : State management
- **Chart.js** : Graphiques/statistiques

---

## 📋 Checklist avant production

### Sécurité
- [ ] Tous les endpoints autenticados (sauf login, health)
- [ ] Validation input stricte (FluentValidation)
- [ ] CORS configuré pour domaines spécifiques
- [ ] HTTPS obligatoire
- [ ] JWT secret sécurisé (32+ caractères)
- [ ] Passwords en BCrypt (coût 12+)
- [ ] Audit logging de toutes les modifications
- [ ] Rate limiting sur /api/Auth/login
- [ ] CSRF protection si nécessaire
- [ ] SQL injection : protégé par EF Core
- [ ] Aucun secret en appsettings.json (utiliser Key Vault)

### Performance
- [ ] Tests de charge (1000+ req/s)
- [ ] Pagination sur tous les GET list
- [ ] Indexation DB optimale (explain plans)
- [ ] Caching où approprié
- [ ] Compression réponses (gzip)
- [ ] CDN pour assets statiques

### Qualité code
- [ ] Coverage tests ≥ 70%
- [ ] Pas de warning compilation
- [ ] Code style uniforme (EditorConfig)
- [ ] Documentation complète (Swagger, README)
- [ ] Pas de secrets hardcodés
- [ ] Dépendances à jour (pas vulnérabilités)

### Opérabilité
- [ ] Health checks fonctionnels
- [ ] Logs structurés et traçables
- [ ] Monitoring & alertes configurés
- [ ] Runbook de déploiement
- [ ] Procédure de rollback
- [ ] Backup/restauration DB testée
- [ ] Disaster recovery plan

---

## 📞 Prochaines actions immédiates

### Court terme (cette semaine)
1. **Implémenter Phase 2.1 (Utilisateurs)**
   - [ ] API endpoints GET/POST/PUT/DELETE /api/Users
   - [ ] Tests intégration
   - [ ] Documentation Swagger

2. **Implémenter Phase 2.2 (Dossiers)**
   - [ ] API endpoints avec filtrage/pagination
   - [ ] Tests intégration

### Moyen terme (2-3 semaines)
1. **Phase 2.3 (Documents)**
2. **Phase 3 (Frontend intégration)**
3. **Configuration staging environment**

### Long terme (1-2 mois)
1. **Phase 4 (DevOps & Deployment)**
2. **Phase 5 (Fonctionnalités avancées)**
3. **Préparation production**

---

## 📞 Contact & Support

Pour questions ou clarifications :
- Consultez `/Users/steve/Projects/SIGAC/PROJECT_SUMMARY.md` (vue d'ensemble complète)
- Consultez `/Users/steve/Projects/SIGAC/sigac-backend/API_STARTUP.md` (commandes de démarrage)
- Vérifiez les logs : `/tmp/sigac_api.log`
- Tests : `dotnet test SIGAC.Tests/SIGAC.Tests.csproj`

---

**Note finale** : Cette feuille de route est vivante et peut être ajustée selon les priorités métier et contraintes techniques.
