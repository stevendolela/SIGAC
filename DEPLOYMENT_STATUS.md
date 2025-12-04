# 🚀 SIGAC - Déploiement Production

## ✅ État du Déploiement

| Composant | Statut | URL/Détails |
|-----------|--------|-------------|
| **API Backend** | ✅ LIVE | https://sigac-api.onrender.com |
| **Base de Données** | ✅ CONNECTED | PostgreSQL 15 sur Render |
| **Frontend Files** | ✅ UPLOADED | Fichiers statiques sur Freebox (FTPES) |
| **Frontend Dev** | ✅ RUNNING | http://localhost:5675/ (local) |

---

## 🔗 URLs d'Accès

### Backend API
- **Base URL** : `https://sigac-api.onrender.com`
- **Health Check** : `https://sigac-api.onrender.com/api/health`
- **API Docs** : `https://sigac-api.onrender.com/swagger` (if Swagger enabled)
- **Login Endpoint** : `POST https://sigac-api.onrender.com/api/auth/login`

### Frontend
- **Development** : http://localhost:5675/
- **Freebox (FTPES)** : ftpes://report.freeboxos.fr:37554/
- **Production** : À configurer avec serveur web + port forwarding

---

## 📋 Prochaines Étapes

### 1. Initialiser la Base de Données (Data Seeding)
Actuellement la base PostgreSQL est vide. Il faut ajouter les données de test :

**Option A : DbInitializer au startup** (recommandé)
```csharp
// Dans Program.cs
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await DbInitializer.InitializeAsync(dbContext);
}
```

**Option B : Migrations + Seed Data**
- Créer une migration de seed data
- Ou exécuter un script SQL manuel

### 2. Tester l'Authentification
Une fois les données seedées :
```bash
curl -X POST https://sigac-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}'
```

Résultat attendu : JWT token + refresh token

### 3. Configurer le Frontend sur Freebox

**Option 1 : Python HTTP Server (rapide)**
```bash
# SSH sur Freebox, cd vers dossier avec les fichiers
python3 -m http.server 8080
```
Puis accès via : http://192.168.0.x:8080/ (remplacer IP Freebox)

**Option 2 : Nginx (production)**
```bash
# Installer Nginx
apt-get install nginx

# Configurer vhost Nginx pour SIGAC
# Voir ci-dessous : nginx.conf exemple
```

**Option 3 : Docker Container**
```bash
# Créer Dockerfile pour frontend
# Déployer container avec Nginx
```

### 4. Configurer CORS Backend
Si frontend accessible via domaine externe, ajouter en `render.yaml` :

```yaml
env:
  - key: CORS_AllowedOrigins
    value: "http://localhost:5173,http://localhost:5675,https://mafreebox.freebox.fr,http://192.168.x.x:8080"
```

### 5. Configurer Port Forwarding (si accès externe)
Sur Freebox :
1. Admin interface → Paramètres → Port forwarding
2. HTTP (80) → Port 8080 (frontend)
3. Optionnel : HTTPS (443) + Certificat SSL

---

## 🧪 Test Complet du Workflow

```bash
# 1. Vérifier santé API
curl -sS https://sigac-api.onrender.com/api/health | jq .

# 2. Tester login
curl -X POST https://sigac-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}'

# 3. Utiliser JWT pour requête authentifiée
# (copier le token JWT de la réponse login)
curl -H "Authorization: Bearer <JWT_TOKEN>" \
  https://sigac-api.onrender.com/api/dossiers
```

---

## 📁 Structure Freebox (Fichiers Uploadés)

```
ftpes://report.freeboxos.fr:37554/
├── index.html
├── taji-logo.png
└── assets/
    ├── index-CAiXSkR7.css
    └── index-DM_tjMOg.js
```

---

## 🔐 Comptes de Test (À initialiser en DB)

| Utilisateur | Password | Rôle |
|-------------|----------|------|
| admin | Admin@2024! | Admin |
| president.benoit | President@2024! | President |
| juge.mbala | Juge@2024! | JugeConstitutionnel |

---

## 🛠️ Configuration Nginx (Exemple pour Freebox)

```nginx
server {
    listen 8080;
    server_name _;
    
    root /path/to/frontend/files;  # Adapter le chemin
    index index.html;
    
    # Cache for assets
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy vers API Render
    location /api/ {
        proxy_pass https://sigac-api.onrender.com/api/;
        proxy_set_header Host sigac-api.onrender.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
    
    # SPA routing : tout 404 redirige vers index.html
    error_page 404 =200 /index.html;
}
```

---

## 📞 Détails Connexion

### Render (Backend)
- **Service** : sigac-api (Web service, Free plan)
- **Database** : PostgreSQL 15 (managed, Free plan)
- **Region** : Frankfurt
- **Auto-deploys** : Depuis GitHub main branch
- **Status** : Active et healthy

### Freebox (Frontend Files)
- **FTPES URL** : ftpes://report.freeboxos.fr:37554/
- **Credentials** : freebox / PeshoAdmin243?
- **Port FTP** : 37554 (SSL/TLS)

### GitHub
- **Repository** : https://github.com/stevendolela/SIGAC
- **Branch** : main
- **Auto-build** : Render redéploie automatiquement à chaque push

---

## 🔍 Troubleshooting

### "Database Unreachable" sur Health Check
- Vérifier PostgreSQL Render running
- Vérifier ConnectionString format
- Vérifier SSL Mode configuration

### "Unauthorized" au Login
- Base de données vide (besoin data seeding)
- Username/password incorrect
- JWT secret non configuré

### Frontend ne peut pas appeler l'API
- CORS non configuré
- URL API incorrecte dans .env.production
- SSL certificate issue

### Freebox inaccessible en HTTPS
- Port forwarding non configuré
- Certificat SSL à générer (LetsEncrypt)
- Firewall Freebox bloquant

---

## 📦 Déploiement Futur

### Amélioration Frontend
1. **Build optimisation** : Tree-shaking, code splitting
2. **CDN** : Servir assets via CDN pour perfs
3. **PWA** : Service worker pour mode offline
4. **Monitoring** : Sentry ou Datadog pour errors tracking

### Amélioration Backend
1. **Caching** : Redis pour performance
2. **API Rate Limiting** : Throttling par IP/user
3. **Monitoring** : APM, logs centralisés (DataDog, NewRelic)
4. **Database Replicas** : Haute disponibilité PostgreSQL
5. **Load Balancing** : Plusieurs instances API sur Render

### Infrastructure
1. **TLS/HTTPS** : Configurer DNS + Let's Encrypt
2. **Alerting** : UptimeRobot ou Pingdom pour monitoring
3. **Backups** : Backup automatique PostgreSQL
4. **Disaster Recovery** : Plan pour restauration

---

## 📅 Session Summary

**Date** : 4 décembre 2025
**Status** : ✅ Déploiement Phase 1 Complète

- ✅ Backend API deployed on Render (https://sigac-api.onrender.com)
- ✅ Database connected (PostgreSQL)
- ✅ Frontend built et uploadé sur Freebox
- ⏳ Frontend serveur web à configurer
- ⏳ Data seeding à initialiser
- ⏳ CORS à configurer
- ⏳ Testing complet à faire

**Next Immediate Actions** :
1. Initialiser les données de test en DB
2. Tester login endpoint
3. Configurer serveur web sur Freebox
4. Faire test E2E complet
