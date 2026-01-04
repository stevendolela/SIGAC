# 🚀 Plan de Déploiement SIGAC sur AWS

## 📋 Vue d'Ensemble

Migration de l'infrastructure SIGAC depuis Vercel (frontend) + Render (backend + PostgreSQL) vers une architecture AWS complète.

**Objectifs:**
- ✅ Contrôle total de l'infrastructure
- ✅ Scalabilité automatique
- ✅ Haute disponibilité (99.9%)
- ✅ Réduction coûts long terme
- ✅ Conformité données (hébergement région spécifique)
- ✅ Performance optimisée (CDN global)

---

## 🏗️ Architecture AWS Proposée

### Option 1: Architecture Serverless (Recommandée - Coût Optimisé)

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet Users                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Route 53 (DNS)                                              │
│  - taajii.fr → CloudFront                                    │
│  - api.taajii.fr → API Gateway                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌──────────────────────┐      ┌──────────────────────────┐
│   CloudFront CDN     │      │   API Gateway            │
│   (Frontend)         │      │   (Backend REST)         │
│                      │      │                          │
│   - Cache global     │      │   - Rate limiting        │
│   - SSL/TLS auto     │      │   - Authentication       │
│   - Gzip/Brotli      │      │   - Request validation   │
└──────────┬───────────┘      └──────────┬───────────────┘
           │                             │
           ▼                             ▼
┌──────────────────────┐      ┌──────────────────────────┐
│   S3 Bucket          │      │   Lambda Functions       │
│   (Static Files)     │      │   (.NET 8 Runtime)       │
│                      │      │                          │
│   - React build      │      │   - API Controllers      │
│   - index.html       │      │   - Services             │
│   - assets/          │      │   - Auto-scaling         │
└──────────────────────┘      └──────────┬───────────────┘
                                         │
                                         ▼
                              ┌──────────────────────────┐
                              │   RDS PostgreSQL         │
                              │   (Database)             │
                              │                          │
                              │   - Multi-AZ             │
                              │   - Auto backups         │
                              │   - Encryption           │
                              └──────────┬───────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
          ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
          │   ElastiCache   │  │   S3 (Files)    │  │   CloudWatch    │
          │   (Redis)       │  │   (Documents)   │  │   (Monitoring)  │
          │                 │  │                 │  │                 │
          │   - Sessions    │  │   - Uploads     │  │   - Logs        │
          │   - Cache API   │  │   - PDFs        │  │   - Metrics     │
          └─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Services utilisés:**
- **Route 53**: DNS management
- **CloudFront**: CDN + SSL
- **S3**: Static hosting (frontend) + file storage (documents)
- **API Gateway**: REST API endpoint
- **Lambda**: Backend .NET 8 (serverless)
- **RDS PostgreSQL**: Database (Multi-AZ)
- **ElastiCache Redis**: Cache + sessions
- **CloudWatch**: Monitoring + logs
- **IAM**: Security + permissions
- **Secrets Manager**: Credentials storage

**Avantages:**
- ✅ Coût: Pay-per-use (pas de serveur idle)
- ✅ Scaling: Automatique jusqu'à 10,000 req/s
- ✅ Maintenance: Zéro (serverless)
- ✅ Déploiement: CI/CD avec GitHub Actions

---

### Option 2: Architecture Conteneurisée (High Traffic)

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet Users                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Route 53 + CloudFront                                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Application Load Balancer (ALB)                             │
│  - SSL Termination                                           │
│  - Health checks                                             │
│  - Path-based routing                                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌──────────────────────┐      ┌──────────────────────────┐
│   ECS Fargate        │      │   ECS Fargate            │
│   (Frontend)         │      │   (Backend API)          │
│                      │      │                          │
│   - Nginx + React    │      │   - .NET 8 API           │
│   - Auto-scaling     │      │   - 2-10 containers      │
│   - 2-5 containers   │      │   - Health checks        │
└──────────────────────┘      └──────────┬───────────────┘
                                         │
                                         ▼
                              ┌──────────────────────────┐
                              │   RDS PostgreSQL         │
                              │   (Multi-AZ)             │
                              └──────────────────────────┘
```

**Services utilisés:**
- **ECS Fargate**: Containers (sans gérer serveurs)
- **ECR**: Docker registry
- **ALB**: Load balancing
- Autres: Idem Option 1

**Avantages:**
- ✅ Performance: Meilleure pour trafic constant élevé
- ✅ Contrôle: Total sur runtime
- ✅ Debugging: Plus facile (logs containers)

**Inconvénients:**
- ❌ Coût: Plus élevé (containers toujours running)
- ❌ Maintenance: Mise à jour images Docker

---

## 💰 Estimation des Coûts (Option 1 Serverless)

### Scénario: 1000 utilisateurs/jour, 50,000 req/jour

| Service | Configuration | Coût Mensuel (USD) |
|---------|---------------|-------------------|
| **Route 53** | 1 hosted zone + queries | $1 |
| **CloudFront** | 100 GB transfer/month | $8.50 |
| **S3 (Frontend)** | 5 GB storage + requests | $0.50 |
| **API Gateway** | 1.5M requests/month | $5.25 |
| **Lambda** | 3M invocations, 512 MB, 1s avg | $18 |
| **RDS PostgreSQL** | db.t4g.micro (Multi-AZ) | $30 |
| **ElastiCache Redis** | cache.t4g.micro | $12 |
| **S3 (Documents)** | 50 GB storage | $1.15 |
| **CloudWatch** | Logs + metrics | $5 |
| **Data Transfer** | Outbound 50 GB | $4.50 |
| **Secrets Manager** | 10 secrets | $4 |
| **Certificate Manager** | SSL certificates | **GRATUIT** |
| **IAM** | Permissions | **GRATUIT** |
| **Backup** | RDS automated backups (7j) | $3 |
| **Total** | | **~$93/mois** |

### Comparaison avec Infrastructure Actuelle

| Plateforme | Coût Mensuel | Notes |
|------------|-------------|-------|
| **Vercel** (Pro) | $20/mois | Frontend seulement |
| **Render** (Starter + DB) | $25/mois | Backend + PostgreSQL |
| **Total Actuel** | **$45/mois** | Limites: 1 GB DB, pas de scaling |
| **AWS (Serverless)** | **$93/mois** | Scaling automatique, pas de limites |

**ROI:** Coût +$48/mois mais:
- ✅ Contrôle total infrastructure
- ✅ Scaling jusqu'à 100,000 users
- ✅ 10 GB PostgreSQL (vs 1 GB Render)
- ✅ Backup automatique 7 jours
- ✅ Multi-AZ haute disponibilité
- ✅ Performance optimisée (CDN global)

---

### Scénario: 10,000 utilisateurs/jour (Croissance)

| Service | Coût Mensuel (USD) |
|---------|-------------------|
| API Gateway | $52 (15M req) |
| Lambda | $180 (30M invocations) |
| RDS PostgreSQL | $80 (db.t4g.small Multi-AZ) |
| CloudFront | $25 (500 GB transfer) |
| ElastiCache | $25 (cache.t4g.small) |
| Autres | $20 |
| **Total** | **~$382/mois** |

---

## 📅 Timeline de Migration

### Phase 1: Préparation (Semaine 1)

**Jour 1-2: Setup AWS Account**
- [ ] Créer compte AWS
- [ ] Configurer MFA root account
- [ ] Créer IAM admin user
- [ ] Configurer AWS CLI localement
- [ ] Installer AWS SAM/CDK
- [ ] Créer VPC avec subnets (3 AZ)

**Jour 3-4: Infrastructure as Code**
- [ ] Créer projet AWS CDK (TypeScript ou Python)
- [ ] Définir stacks:
  - NetworkStack (VPC, subnets, security groups)
  - DatabaseStack (RDS PostgreSQL)
  - CacheStack (ElastiCache Redis)
  - StorageStack (S3 buckets)
  - ComputeStack (Lambda functions)
  - FrontendStack (S3 + CloudFront)
- [ ] Version control IaC (Git repo séparé)

**Jour 5-7: Tests Infrastructure Vide**
- [ ] Deploy stacks en environnement dev
- [ ] Vérifier connectivity VPC → RDS
- [ ] Tester Lambda → RDS connection
- [ ] Configurer CloudWatch dashboards
- [ ] Créer alarmes (CPU, mémoire, erreurs)

---

### Phase 2: Migration Base de Données (Semaine 2)

**Jour 1-2: Préparation PostgreSQL**
- [ ] Créer RDS PostgreSQL 15
  - Instance class: db.t4g.micro (dev), db.t4g.small (prod)
  - Multi-AZ: Enabled
  - Storage: 20 GB GP3 (auto-scaling jusqu'à 100 GB)
  - Backup retention: 7 jours
  - Encryption: Enabled (AWS KMS)
- [ ] Configurer security groups (accès depuis Lambda VPC)
- [ ] Créer read replica (optional, pour reporting)

**Jour 3-4: Migration Données**
```bash
# 1. Dump depuis Render PostgreSQL
pg_dump $RENDER_DATABASE_URL > sigac_dump.sql

# 2. Upload vers S3 (stockage temporaire)
aws s3 cp sigac_dump.sql s3://sigac-migration-temp/

# 3. Restore vers RDS
psql $RDS_DATABASE_URL < sigac_dump.sql

# 4. Vérifier intégrité
psql $RDS_DATABASE_URL -c "SELECT COUNT(*) FROM \"Users\";"
psql $RDS_DATABASE_URL -c "SELECT COUNT(*) FROM \"Dossiers\";"
```

**Jour 5-7: Tests & Validation**
- [ ] Comparer counts tables (Render vs RDS)
- [ ] Tester requêtes complexes (performance)
- [ ] Configurer paramètres PostgreSQL optimaux
- [ ] Setup automated backups vers S3
- [ ] Créer script rollback si besoin

---

### Phase 3: Migration Backend (Semaine 3)

**Jour 1-3: Adapter Code pour Lambda**

**Fichier: `SIGAC.Lambda/Function.cs`**
```csharp
using Amazon.Lambda.AspNetCoreServer;
using Microsoft.AspNetCore.Hosting;

namespace SIGAC.Lambda
{
    public class Function : APIGatewayProxyFunction
    {
        protected override void Init(IWebHostBuilder builder)
        {
            builder.UseStartup<Startup>();
        }
    }
}
```

**Modifications nécessaires:**
- [ ] Ajouter package `Amazon.Lambda.AspNetCoreServer.Hosting`
- [ ] Modifier `Program.cs` pour Lambda bootstrap
- [ ] Configurer `appsettings.json` avec AWS Parameter Store
- [ ] Remplacer file storage local par S3
- [ ] Configurer Redis (ElastiCache) pour sessions
- [ ] Adapter logging vers CloudWatch

**Jour 4-5: Build & Deploy Backend**
```bash
# 1. Build projet Lambda
cd sigac-backend
dotnet lambda package -c Release -o deploy-package.zip

# 2. Upload vers Lambda
aws lambda create-function \
  --function-name sigac-api \
  --runtime dotnet8 \
  --handler SIGAC.Lambda::SIGAC.Lambda.Function::FunctionHandlerAsync \dd
  --zip-file fileb://deploy-package.zip \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --memory-size 512 \
  --timeout 30 \
  --environment Variables={ConnectionStrings__DefaultConnection=$RDS_URL}

# 3. Créer API Gateway
aws apigatewayv2 create-api \
  --name sigac-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:REGION:ACCOUNT_ID:function:sigac-api
```

**Jour 6-7: Tests Backend**
- [ ] Tester endpoints: `/api/auth/login`
- [ ] Vérifier JWT generation
- [ ] Tester CRUD dossiers
- [ ] Vérifier upload documents (S3)
- [ ] Load testing (Artillery ou k6)
- [ ] Monitoring CloudWatch Logs

---

### Phase 4: Migration Frontend (Semaine 4)

**Jour 1-2: Build Optimisé**
```bash
cd sigac-frontend

# 1. Update API URL dans .env.production
echo "VITE_API_URL=https://api.taajii.fr" > .env.production

# 2. Build production
npm run build
# Output: dist/

# 3. Optimiser assets
npm run build -- --mode production
```

**Jour 3-4: Déploiement S3 + CloudFront**
```bash
# 1. Créer S3 bucket
aws s3 mb s3://taajii-fr-frontend

# 2. Configurer bucket pour static hosting
aws s3 website s3://taajii-fr-frontend \
  --index-document index.html \
  --error-document index.html

# 3. Upload build
aws s3 sync dist/ s3://taajii-fr-frontend \
  --delete \
  --cache-control "public, max-age=31536000"

# 4. Créer CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name taajii-fr-frontend.s3.amazonaws.com \
  --default-root-object index.html

# 5. Configurer custom domain (taajii.fr)
aws cloudfront create-distribution \
  --aliases taajii.fr www.taajii.fr
```

**Jour 5-7: DNS & SSL**
- [ ] Créer certificat SSL dans ACM (us-east-1 pour CloudFront)
- [ ] Valider certificat via DNS (TXT records)
- [ ] Créer Route 53 hosted zone pour taajii.fr
- [ ] Créer A record: taajii.fr → CloudFront
- [ ] Créer CNAME: www.taajii.fr → CloudFront
- [ ] Tester HTTPS: https://taajii.fr

---

### Phase 5: CI/CD Pipeline (Semaine 5)

**GitHub Actions Workflow**

**Fichier: `.github/workflows/deploy-aws.yml`**
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      
      - name: Build Lambda package
        run: |
          cd sigac-backend
          dotnet lambda package -c Release -o ../deploy-package.zip
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1
      
      - name: Deploy to Lambda
        run: |
          aws lambda update-function-code \
            --function-name sigac-api \
            --zip-file fileb://deploy-package.zip
  
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install & Build
        run: |
          cd sigac-frontend
          npm ci
          npm run build
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1
      
      - name: Deploy to S3
        run: |
          aws s3 sync sigac-frontend/dist/ s3://taajii-fr-frontend \
            --delete \
            --cache-control "public, max-age=31536000"
      
      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

**Configuration secrets GitHub:**
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `CLOUDFRONT_DISTRIBUTION_ID`
- [ ] `RDS_DATABASE_URL` (via AWS Secrets Manager)

---

## 🔒 Sécurité

### Configuration IAM

**Lambda Execution Role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::sigac-documents/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:sigac/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticache:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Security Groups

**RDS PostgreSQL:**
- Inbound: Port 5432 from Lambda security group only
- Outbound: None

**ElastiCache Redis:**
- Inbound: Port 6379 from Lambda security group only
- Outbound: None

**Lambda:**
- Inbound: None (via API Gateway)
- Outbound: All (pour accès RDS, Redis, S3)

### Encryption

- [x] RDS: Encryption at rest (AWS KMS)
- [x] S3: Server-side encryption (SSE-S3)
- [x] Secrets Manager: Automatic encryption
- [x] CloudFront: SSL/TLS (ACM certificate)
- [x] ElastiCache: Encryption in transit

---

## 📊 Monitoring & Alerting

### CloudWatch Dashboards

**Dashboard: SIGAC Production**
- Lambda invocations/min
- Lambda errors/min
- Lambda duration (p50, p95, p99)
- API Gateway 4xx/5xx errors
- RDS CPU utilization
- RDS connections count
- ElastiCache hit rate
- S3 GET/PUT requests

### Alarmes Critiques

| Metric | Threshold | Action |
|--------|-----------|--------|
| Lambda errors | > 10/min | SNS → Email équipe |
| RDS CPU | > 80% | SNS → Email + SMS |
| RDS storage | > 85% | Auto-scale storage |
| API Gateway 5xx | > 50/min | SNS → PagerDuty |
| Lambda throttles | > 0 | Increase concurrency |

### Logs Centralisés

**CloudWatch Logs Groups:**
- `/aws/lambda/sigac-api` - Backend logs
- `/aws/rds/instance/sigac-db/postgresql` - Database logs
- `/aws/apigateway/sigac-api` - API Gateway logs

**Retention:** 7 jours (dev), 30 jours (prod)

**Export:** S3 (pour archivage long terme)

---

## 🔄 Plan de Rollback

### Si Migration Échoue

**Scénario 1: Backend issues (API errors)**
```bash
# 1. Rollback DNS
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch file://rollback-dns.json

# DNS pointe vers ancien backend Render
# Users continuent sur ancienne version
```

**Scénario 2: Database corruption**
```bash
# 1. Restore snapshot RDS
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier sigac-db-restored \
  --db-snapshot-identifier sigac-db-snapshot-pre-migration

# 2. Update Lambda connection string
aws lambda update-function-configuration \
  --function-name sigac-api \
  --environment Variables={ConnectionStrings__DefaultConnection=$RESTORED_DB_URL}
```

**Scénario 3: Total disaster**
- [ ] Conserver Vercel + Render actifs pendant 1 mois post-migration
- [ ] Snapshot RDS quotidien pendant 2 semaines
- [ ] Tests smoke automatiques toutes les heures
- [ ] Rollback DNS en < 5 minutes

---

## ✅ Checklist Pré-Migration

### Infrastructure
- [ ] Compte AWS créé et configuré
- [ ] MFA activé sur root account
- [ ] IAM users créés (admin + CI/CD)
- [ ] AWS CLI configuré localement
- [ ] Billing alerts configurés ($50, $100, $200)
- [ ] Support plan sélectionné (Developer ou Business)

### Réseau
- [ ] VPC créé (3 availability zones)
- [ ] Subnets publics créés (pour ALB)
- [ ] Subnets privés créés (pour Lambda, RDS)
- [ ] NAT Gateway créé (pour Lambda outbound)
- [ ] Security groups configurés
- [ ] Route tables configurées

### Base de Données
- [ ] RDS PostgreSQL créé (Multi-AZ)
- [ ] Parameter group optimisé
- [ ] Backup automatique configuré
- [ ] Encryption enabled
- [ ] Read replica créé (optional)
- [ ] CloudWatch alarms configurés

### Backend
- [ ] Code adapté pour Lambda
- [ ] Tests unitaires passent
- [ ] Tests intégration passent
- [ ] Package Lambda créé
- [ ] Lambda function déployée
- [ ] API Gateway créé
- [ ] Custom domain configuré

### Frontend
- [ ] Build production OK
- [ ] Assets optimisés
- [ ] S3 bucket créé
- [ ] CloudFront distribution créée
- [ ] SSL certificate créé (ACM)
- [ ] DNS configuré (Route 53)

### Sécurité
- [ ] IAM roles créés
- [ ] Policies attachées
- [ ] Secrets dans Secrets Manager
- [ ] Security groups testés
- [ ] Penetration testing planifié

### Monitoring
- [ ] CloudWatch dashboards créés
- [ ] Alarmes configurées
- [ ] SNS topics créés
- [ ] Email notifications testées
- [ ] Log groups créés

---

## 📞 Équipe & Responsabilités

| Rôle | Responsable | Tâches |
|------|------------|--------|
| **DevOps Lead** | À désigner | Infrastructure AWS, CI/CD, monitoring |
| **Backend Lead** | À désigner | Adaptation code Lambda, tests API |
| **Frontend Lead** | À désigner | Build optimisé, déploiement S3 |
| **DBA** | À désigner | Migration PostgreSQL, optimisation |
| **Security** | À désigner | IAM, security groups, audit |
| **QA** | À désigner | Tests end-to-end, performance |

---

## 💡 Recommandations

### Court Terme (Mois 1-2)

1. **Commencer avec environnement Dev/Staging**
   - Tester architecture complète
   - Valider coûts réels
   - Former l'équipe AWS

2. **Migration progressive**
   - Week 1: Base de données (RDS)
   - Week 2: Backend (Lambda + API Gateway)
   - Week 3: Frontend (S3 + CloudFront)
   - Week 4: Tests intensifs
   - Week 5: Production cutover (weekend)

3. **Conserver backup Vercel/Render 1 mois**
   - Rollback facile si problèmes
   - Comparaison performance

### Moyen Terme (Mois 3-6)

1. **Optimisations performance**
   - Activer Lambda Provisioned Concurrency (endpoints critiques)
   - Tuning PostgreSQL parameters
   - Redis caching stratégique
   - CloudFront cache optimizations

2. **Haute disponibilité**
   - Multi-region deployment (backup région)
   - RDS cross-region replica
   - S3 cross-region replication

3. **Coûts**
   - Reserved capacity RDS (-40% coût)
   - Savings Plans Lambda (-20% coût)
   - Lifecycle policies S3 (archivage ancien documents)

### Long Terme (Mois 6+)

1. **Infrastructure as Code**
   - Tout dans CDK/Terraform
   - Versioning infrastructure
   - Environnements reproductibles

2. **Observability avancée**
   - AWS X-Ray (distributed tracing)
   - CloudWatch Insights (analytics)
   - Custom metrics business

3. **Disaster Recovery**
   - Plan DR complet
   - RPO: 1 heure
   - RTO: 4 heures
   - Tests DR trimestriels

---

## 🎯 Alternatives à Considérer

### AWS Amplify (Alternative Vercel)

**Pour:** Déploiement frontend simplifié
- CI/CD intégré
- Preview environments automatiques
- Rollback en 1 clic

**Contre:** Moins de contrôle

**Coût:** ~$15/mois (inclut hosting + build minutes)

### AWS App Runner (Alternative Render)

**Pour:** Déploiement backend conteneurisé simple
- Build depuis Dockerfile automatique
- Auto-scaling natif
- Moins cher que ECS Fargate

**Contre:** Moins flexible que Lambda

**Coût:** ~$35/mois (2 vCPU, 4 GB RAM)

### Combinaison Hybride

**Option recommandée pour débuter:**
- Frontend: **AWS Amplify** (simple, coût prévisible)
- Backend: **Lambda + API Gateway** (scaling automatique)
- Database: **RDS PostgreSQL** (fiable, géré)
- Files: **S3** (stockage illimité)

**Coût total:** ~$60-80/mois

**Migration progressive vers full infrastructure custom après 6 mois.**

---

## 📝 Conclusion

**Temps total migration:** 4-5 semaines

**Coût migration:** ~$500 (temps développeur + tests)

**Coût mensuel récurrent:** $93-382 selon trafic

**ROI:** Contrôle infrastructure + scalabilité + conformité

**Risque:** Moyen (migration base données critique)

**Recommandation:** ✅ **GO** si besoin de scalabilité et contrôle

**Alternative:** Rester Vercel/Render si coût prioritaire et trafic <5000 users/jour

---

**Prochaines étapes immédiates:**

1. ✅ Créer compte AWS
2. ✅ Setup environnement dev AWS
3. ✅ Migration base de données test
4. ✅ Adapter code backend pour Lambda
5. ✅ Tests performance comparatifs

**Besoin d'aide ?**
- AWS Solutions Architects: architecture@aws.com
- AWS Support: support.aws.amazon.com
- Documentation: docs.aws.amazon.com

---

**Créé le:** 4 janvier 2026  
**Version:** 1.0  
**Maintenu par:** Équipe DevOps SIGAC
