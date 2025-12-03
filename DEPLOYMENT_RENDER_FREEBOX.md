# Déploiement SIGAC: Backend sur Render, Frontend sur Freebox

Ce guide explique comment déployer l'API .NET 8 sur Render et servir le frontend React/Vite via votre Freebox (ou une machine derrière la box) avec reverse proxy (Caddy/Nginx), CORS et TLS.

---

## 1) Pré-requis

- Compte Render connecté à votre GitHub
- Repo SIGAC (branche `main`) accessible
- Freebox avec redirection de ports (80/443) vers une machine locale servant le frontend
- Un domaine public pointant vers votre IP (optionnel mais recommandé pour HTTPS)

---

## 2) Backend sur Render (API)

### Méthode recommandée: Blueprint via `render.yaml`

Le fichier `render.yaml` est déjà ajouté à la racine du repo. Il définit:
- Un service Web `sigac-api` basé sur `docker/Dockerfile.api`
- Un disque persistant pour les uploads
- Les variables d'environnement critiques
- Une base PostgreSQL managée `sigac-db`

Étapes:
1. Allez sur Render → New → Blueprint → Sélectionnez votre repo SIGAC → Branche `main`.
2. Render lit `render.yaml` et propose de créer les services.
3. Renseignez les variables marquées `sync: false`:
   - `ConnectionStrings__DefaultConnection`: DSN Render Postgres (`postgres://user:pass@host:port/db`)
   - `Jwt__SecretKey`: clé secrète 256+ bits
4. Créez le blueprint et déployez.
5. Vérifiez la santé via `GET /api/health`.

### Important: Variables d’environnement
- `ASPNETCORE_ENVIRONMENT=Production`
- `ConnectionStrings__DefaultConnection=postgres://...`
- `Jwt__SecretKey`, `Jwt__Issuer=SIGAC.CourConstitutionnelle.RDC`, `Jwt__Audience=SIGAC.Client`, `Jwt__ExpirationMinutes=30`
- `Cors__AllowedOrigins=["https://<domaine-frontend>"]`
- `FileStorage__BasePath=/var/data/uploads`, `FileStorage__MaxFileSize=52428800`

### Disque Uploads
- Un Render Disk est monté sur `/var/data` (configuré dans `render.yaml`). Les fichiers sont stockés sous `/var/data/uploads`.

### Base de données
- Le service Postgres `sigac-db` est créé par le blueprint.
- Utilisez l'URL externe pour votre `DefaultConnection`.
- Les migrations EF Core doivent être appliquées:
  - Option simple: ajouter `context.Database.Migrate();` au démarrage (si pas déjà présent) pour appliquer automatiquement.
  - Sinon, appliquez manuellement en local contre Render Postgres.

---

## 3) Frontend sur Freebox

### Build
```
cd sigac-frontend
npm ci
npm run build
```
- Les fichiers statiques sont générés dans `sigac-frontend/dist`.

### Déploiement sur une machine derrière la Freebox
- Copiez `dist/` sur la machine: `/var/www/sigac` (par exemple)
- Servez avec Caddy (recommandé) ou Nginx.

#### Caddy (TLS auto, simple)
Caddyfile exemple:
```
sigac.example.com {
  root * /var/www/sigac
  file_server
  try_files {path} /index.html

  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    Referrer-Policy "no-referrer-when-downgrade"
  }
}
```
- Lancez Caddy (systemd ou docker). Redirigez les ports 80/443 de la Freebox vers cette machine.

#### Nginx (SPA)
```
server {
  listen 80;
  server_name sigac.example.com;

  root /var/www/sigac;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  # Sécurité basique
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options DENY;
}
```
- Ajoutez un certificat TLS (Let’s Encrypt via certbot ou proxy derrière Caddy).

### Freebox: redirection de ports
- Freebox OS → Redirections de ports:
  - TCP 80 → IP locale de la machine frontend
  - TCP 443 → IP locale de la machine frontend

### DNS
- Créez un enregistrement A/AAAA pointant vers votre IP publique.
- Optionnel: DDNS si votre IP change.

---

## 4) Connecter Front ↔ Back

### URL API côté frontend
- Utilisez une variable d’environnement Vite:
  - Créez `sigac-frontend/.env.production`:
```
VITE_API_URL=https://<render-service-url>/api
```
- Vérifiez que `src/api/api-client.ts` lit `import.meta.env.VITE_API_URL`.
- Rebuild et redeployez `dist`.

### CORS côté backend
- Ajoutez le domaine du frontend (Freebox) dans `Cors__AllowedOrigins`.
- Ne pas ouvrir à tous en production.

---

## 5) Vérifications et tests
- Backend: `GET /api/health` doit renvoyer 200.
- Frontend: pages accessibles via votre domaine.
- Auth: login et appels AuthController OK.
- Profils Juges: création/édition s’affichent.
- Uploads: testez un PDF (limite 50MB par défaut).

---

## 6) Pièges & Conseils
- Render Disk: quotas limités. Pour du volume, basculer sur S3.
- Logs: privilégiez Serilog Console pour Render; évitez fichiers persistants.
- Sécurité: JWT secret en variable, jamais en repo.
- Performances: activez HTTP/2 sur proxy, servez gzip/br.
- Monitoring: UptimeRobot sur `/api/health`.

---

## 7) Commandes utiles

### Build & test local backend
```
cd sigac-backend
dotnet restore
DOTNET_ENVIRONMENT=Development dotnet run --project SIGAC.API
curl -s http://localhost:5210/api/health
```

### Build frontend
```
cd sigac-frontend
npm ci
npm run build
```

---

## 8) Prochaines améliorations
- CDN (Cloudflare) devant le frontend Freebox
- Cache HTTP et compression optimisée
- CI/CD: build auto et push sur Render/serveur Freebox
- Stockage documents sur S3 + signatures SHA256 côté serveur
