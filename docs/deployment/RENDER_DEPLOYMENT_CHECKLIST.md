# SIGAC - Checklist Déploiement Render

## 📋 Prérequis

- [x] Compte Render actif
- [x] Repository GitHub `stevendolela/SIGAC` accessible
- [x] Base PostgreSQL créée: `postgresql-sigac` (Frankfurt, PostgreSQL 15)
- [ ] Domaine pour frontend (ex: `sigac.yourdomain.com` ou Freebox local)

---

## 🚀 Étape 1: Déployer via Blueprint

### 1.1 Créer le service depuis le Blueprint

1. Dans Render Dashboard → **New** → **Blueprint**
2. Connecter le repo: `stevendolela/SIGAC`
3. Branch: `main`
4. Render détecte `render.yaml` et propose:
   - **Service Web**: `sigac-api` (Docker, Frankfurt, Starter plan)
   - **Database**: `postgresql-sigac` (déjà existante, sera reliée)
   - **Disk**: `uploads` (5GB monté sur `/var/data`)

5. Cliquer **Apply**

### 1.2 Attendre le premier build

- Render va:
  - Cloner le repo
  - Build l'image Docker depuis `docker/Dockerfile.api`
  - Démarrer le service
  - Exécuter les migrations EF Core au startup (si configuré)

**⚠️ Premier déploiement peut échouer** si variables secrètes manquantes → passer à Étape 2.

---

## 🔐 Étape 2: Configurer Variables d'Environnement

### 2.1 Variables générées automatiquement

Ces variables sont déjà configurées par `render.yaml`:

| Variable | Valeur | Source |
|----------|--------|--------|
| `ASPNETCORE_ENVIRONMENT` | `Production` | render.yaml |
| `ConnectionStrings__DefaultConnection` | `postgres://...` | Auto depuis `postgresql-sigac` |
| `Jwt__Issuer` | `SIGAC.CourConstitutionnelle.RDC` | render.yaml |
| `Jwt__Audience` | `SIGAC.Client` | render.yaml |
| `Jwt__ExpirationMinutes` | `30` | render.yaml |
| `FileStorage__BasePath` | `/var/data/uploads` | render.yaml |
| `FileStorage__MaxFileSize` | `52428800` (50MB) | render.yaml |

### 2.2 Variables secrètes à configurer manuellement

**Dans Render Dashboard → Service `sigac-api` → Environment**:

#### JWT Secret Key (REQUIS)

```
Clé: Jwt__SecretKey
Valeur: <générer une clé de 64 caractères minimum>
```

**Générer une clé sécurisée** (sur ton Mac):

```bash
openssl rand -base64 64 | tr -d '\n'
```

Copier la sortie et coller dans Render.

#### CORS AllowedOrigins (REQUIS)

```
Clé: Cors__AllowedOrigins
Valeur: ["https://sigac.yourdomain.com","http://localhost:5173"]
```

**⚠️ Remplacer** `sigac.yourdomain.com` par:
- Ton domaine Freebox réel (ex: `https://sigac.freebox.local` ou DynDNS)
- Ou adresse IP publique si pas de domaine

**Format JSON array** requis avec guillemets doubles échappés ou syntaxe JSON valide.

#### Optionnel: Refresh Token Expiration

```
Clé: Jwt__RefreshTokenExpirationDays
Valeur: 7
```

Déjà dans `render.yaml`, vérifier qu'il apparaît bien.

### 2.3 Sauvegarder et Redéployer

1. Cliquer **Save Changes**
2. Render redémarre automatiquement le service
3. Surveiller les **Logs** en temps réel

---

## ✅ Étape 3: Vérifications Post-Déploiement

### 3.1 Health Check

```bash
curl https://sigac-api.onrender.com/api/health
```

**Réponse attendue** (HTTP 200):

```json
{
  "status": "Healthy",
  "timestamp": "2025-12-03T22:50:00Z",
  "services": {
    "database": "Connected",
    "version": "1.0.0"
  }
}
```

### 3.2 Test Login

```bash
curl -X POST https://sigac-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}'
```

**Réponse attendue** (HTTP 200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "username": "admin",
    "role": "Administrateur"
  }
}
```

### 3.3 Vérifier Migrations DB

**Logs Render** doivent contenir:

```
Applying migration '20251202222338_AddJugeProfilesTable'
Applied migration '20251202222338_AddJugeProfilesTable'
Database migration completed successfully
```

Si migrations échouent:
- Vérifier `ConnectionStrings__DefaultConnection` dans Env Vars
- Vérifier logs PostgreSQL dans Render → Database → Logs

### 3.4 Test Upload (optionnel)

Connecte-toi via Swagger ou Postman:
1. Login → récupérer token
2. POST `/api/documents/upload` avec fichier PDF
3. Vérifier dans Render Dashboard → Disk `uploads` → Files

---

## 🌐 Étape 4: Configurer Frontend Freebox

### 4.1 Build Frontend avec API URL Render

**Sur ton Mac**:

```bash
cd /Users/steve/Projects/SIGAC/sigac-frontend

# Créer .env.production
cat > .env.production << EOF
VITE_API_URL=https://sigac-api.onrender.com/api
EOF

# Build production
npm run build
```

### 4.2 Résultat

Dossier `dist/` contient:
- `index.html`
- `assets/` (JS, CSS, images)

### 4.3 Déployer sur Freebox

**Copier** `dist/` vers ta Freebox:

```bash
# Option 1: SCP (si SSH activé sur Freebox)
scp -r dist/* user@freebox.local:/var/www/sigac/

# Option 2: FTP/SFTP
# Utiliser FileZilla ou Cyberduck
```

### 4.4 Configurer Caddy/Nginx

**Exemple Caddy** (`/etc/caddy/Caddyfile` sur Freebox):

```caddy
sigac.yourdomain.com {
    root * /var/www/sigac
    encode gzip
    file_server
    
    # SPA fallback
    try_files {path} /index.html
    
    # Headers sécurité
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # TLS auto via Let's Encrypt
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
}
```

**Exemple Nginx** (`/etc/nginx/sites-available/sigac`):

```nginx
server {
    listen 80;
    server_name sigac.yourdomain.com;
    
    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sigac.yourdomain.com;
    
    root /var/www/sigac;
    index index.html;
    
    # TLS
    ssl_certificate /etc/letsencrypt/live/sigac.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sigac.yourdomain.com/privkey.pem;
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip
    gzip on;
    gzip_types text/css application/javascript application/json;
    
    # Headers sécurité
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
}
```

### 4.5 Port Forwarding Freebox

**Dans Freebox OS** (http://mafreebox.freebox.fr):

1. **Paramètres** → **Mode avancé** → **Gestion des ports**
2. Ajouter redirections:
   - **HTTP**: Port externe `80` → IP Freebox Server, Port `80`
   - **HTTPS**: Port externe `443` → IP Freebox Server, Port `443`
3. Protocole: `TCP`
4. Activer

### 4.6 DNS et TLS

#### Option A: DynDNS Freebox

1. Activer DynDNS Freebox: `xxxxx.freeboxos.fr`
2. Utiliser ce domaine dans CORS backend

#### Option B: Domaine personnalisé

1. Chez ton registrar (OVH, Cloudflare, etc.):
   - Créer enregistrement A: `sigac.yourdomain.com` → IP publique Freebox
2. Installer Let's Encrypt:

```bash
# Sur Freebox Server
sudo certbot certonly --standalone -d sigac.yourdomain.com
```

3. Recharger Nginx/Caddy:

```bash
sudo systemctl reload nginx
# ou
sudo systemctl reload caddy
```

---

## 🔧 Étape 5: Finaliser CORS Backend

### 5.1 Mettre à jour CORS sur Render

**Render Dashboard → sigac-api → Environment**:

```
Clé: Cors__AllowedOrigins
Valeur: ["https://sigac.yourdomain.com"]
```

(Retirer `http://localhost:5173` en production si pas nécessaire)

### 5.2 Sauvegarder et Redéployer

Le service redémarre automatiquement.

---

## ✅ Étape 6: Tests End-to-End

### 6.1 Ouvrir Frontend

https://sigac.yourdomain.com

### 6.2 Login

- Username: `admin`
- Password: `Admin@2024!`

### 6.3 Vérifier Fonctionnalités

- ✅ Dashboard charge
- ✅ Liste dossiers (appel API Render)
- ✅ Créer dossier
- ✅ Upload document
- ✅ Mon Profil (pour juges)

### 6.4 Vérifier Console Navigateur

Pas d'erreurs CORS → OK ✅

---

## 📊 Monitoring

### Render Logs

**En temps réel**:

```bash
# Via Render CLI (optionnel)
render logs -s sigac-api -f
```

Ou Dashboard → Service → Logs tab

### Métriques

**Render Dashboard → sigac-api → Metrics**:
- CPU usage
- Memory usage
- Request rate
- Response times

### Alertes

Configurer notifications Email/Slack:
- Service down
- Health check failed
- High error rate

---

## 🐛 Troubleshooting

### Problème: Service ne démarre pas

**Causes possibles**:
1. `Jwt__SecretKey` manquant → Ajouter dans Env Vars
2. `ConnectionStrings__DefaultConnection` invalide → Vérifier DB attachée
3. Migrations échouent → Vérifier logs PostgreSQL

**Solution**: Consulter Render Logs pour stack trace.

### Problème: CORS errors côté frontend

**Symptôme**: Console navigateur affiche:
```
Access to fetch at 'https://sigac-api.onrender.com/api/dossiers' 
from origin 'https://sigac.yourdomain.com' has been blocked by CORS policy
```

**Solution**:
1. Vérifier `Cors__AllowedOrigins` inclut bien `https://sigac.yourdomain.com`
2. Format JSON array correct: `["https://..."]`
3. Pas de trailing slash dans l'origine
4. Redémarrer service après modification

### Problème: Uploads échouent

**Causes**:
1. Disk non monté → Vérifier Dashboard → Disk `uploads`
2. Permissions → Logs montreront "Permission denied"
3. Taille fichier > 50MB → Ajuster `FileStorage__MaxFileSize`

**Solution**: Vérifier path `/var/data/uploads` accessible.

### Problème: DB Connection timeout

**Causes**:
1. PostgreSQL service arrêté → Redémarrer dans Dashboard
2. IP Allow List trop restrictif → Vérifier `0.0.0.0/0` inclus
3. Connection string malformée

**Solution**: Tester connexion depuis Render Shell:

```bash
# Dans Render Dashboard → Service → Shell
psql $DATABASE_URL
```

---

## 📚 Ressources

- [Render Docs - Blueprints](https://render.com/docs/infrastructure-as-code)
- [Render Docs - Environment Variables](https://render.com/docs/environment-variables)
- [Render Docs - Persistent Disks](https://render.com/docs/disks)
- [Let's Encrypt](https://letsencrypt.org/)
- [Caddy Docs](https://caddyserver.com/docs/)
- [Nginx Docs](https://nginx.org/en/docs/)

---

## 🎯 Checklist Finale

- [ ] Service `sigac-api` déployé et Healthy
- [ ] PostgreSQL `postgresql-sigac` connectée
- [ ] Variables secrètes configurées (JWT, CORS)
- [ ] Migrations appliquées automatiquement
- [ ] Health check retourne 200
- [ ] Login fonctionne via API
- [ ] Frontend buildé avec VITE_API_URL Render
- [ ] Frontend déployé sur Freebox
- [ ] Caddy/Nginx configuré avec SPA fallback
- [ ] Port forwarding 80/443 actif
- [ ] DNS pointe vers IP Freebox
- [ ] TLS Let's Encrypt installé
- [ ] CORS backend mis à jour avec domaine final
- [ ] Tests E2E passent (login, dossiers, upload)

---

**🎉 Une fois toutes les cases cochées, SIGAC est en production !**

Pour toute question, consulter `DEPLOYMENT_RENDER_FREEBOX.md` ou les logs Render.
