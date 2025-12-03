# Déploiement en production (Docker)

Ce guide explique comment déployer SIGAC sur un serveur (VPS/VM) avec Docker, Nginx (static + reverse proxy) et PostgreSQL.

## Pré-requis

- Un serveur Linux avec Docker et Docker Compose
- Un domaine (ex: sigac.votre-domaine.tld) pointant vers l’IP du serveur
- Un compte GitHub pour exécuter le workflow CI/CD

## Aperçu de l’architecture

- `web` (nginx): sert le frontend statique et reverse proxy `/api` vers l’API
- `api` (.NET 8 Kestrel): API SIGAC
- `postgres` (optionnel): base PostgreSQL dans Docker (sinon utilisez un service managé)
- Volumes persistants: `postgres-data`, `uploads` (fichiers stockés)

## Fichiers ajoutés

- `docker/Dockerfile.api`: image API .NET 8
- `docker/Dockerfile.web`: build Vite + Nginx
- `docker/nginx/default.conf`: vhost Nginx (static + proxy /api)
- `docker/docker-compose.prod.yml`: stack de prod
- `sigac-backend/SIGAC.API/appsettings.Production.json`: configuration par défaut prod (overridable par variables d’environnement)
- `.github/workflows/deploy.yml`: pipeline CI/CD (build/push images + déploiement SSH)
- `sigac-frontend/.env.production`: VITE_API_URL=/api

## Variables à définir (GitHub Secrets)

- `SSH_HOST`, `SSH_USER`, `SSH_KEY` (clé privée PEM du user)
- `DOMAIN` (ex: sigac.votre-domaine.tld)
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `JWT_SECRET` (chaîne >= 32 chars)

## Première installation sur le serveur

Sur le serveur (une fois):

1. Créez le dossier de déploiement:
   - `mkdir -p ~/sigac`
2. Le workflow CI/CD copiera `docker-compose.prod.yml`, `default.conf` et `deploy.sh` dans `~/sigac` automatiquement.
3. Déployer (manuel):
   - Exportez les variables nécessaires puis lancez le script:
     - `export DOMAIN=sigac.votre-domaine.tld`
     - `export POSTGRES_DB=sigac_db`
     - `export POSTGRES_USER=sigac_user`
     - `export POSTGRES_PASSWORD='ChangeMeStrong!'`
     - `export JWT_SECRET='UnVraiSecretTresLongEtComplexe123!@#'`
     - `bash docker/deploy.sh`

La stack expose HTTP sur le port 80. Configurez un firewall en conséquence.

## HTTPS (recommandé)

Deux options:

1) Variante Caddy (auto-HTTPS)
- Utilisez `docker/docker-compose.prod-https.yml` et le `docker/Dockerfile.web.https` (Caddy)
- Prérequis: votre domaine pointe vers le serveur, ports 80/443 ouverts
- Variables: `DOMAIN`, `ACME_EMAIL`, `POSTGRES_*`, `JWT_SECRET`
- Déploiement manuel:
  - `export COMPOSE_FILE=docker/docker-compose.prod-https.yml`
  - `export DOMAIN=sigac.votre-domaine.tld`
  - `export ACME_EMAIL=admin@votre-domaine.tld`
  - `export POSTGRES_DB=sigac_db && export POSTGRES_USER=sigac_user && export POSTGRES_PASSWORD='ChangeMeStrong!'`
  - `export JWT_SECRET='UnVraiSecretTresLongEtComplexe123!@#'`
  - `bash docker/deploy.sh`

2) Variante Nginx + Certbot
- Non fournie dans ce dépôt (à ajouter si préférence), Caddy est plus simple pour auto-HTTPS.

## Configuration CORS & uploads

- CORS est réglé par `Cors:AllowedOrigins` et variables d’env. Dans `docker-compose.prod.yml`, on injecte `https://${DOMAIN}`.
- Les fichiers sont stockés dans le volume `uploads` (monté dans `/var/sigac/uploads`) et sécurisés via l’API (pas d’accès direct public).

## DB managée (alternative)

Si vous utilisez un PostgreSQL managé, supprimez le service `postgres` et remplacez `ConnectionStrings__DefaultConnection` du service `api` par la chaîne du service managé.

## Dépannage

- Logs API: `docker logs sigac-api -f`
- Logs Nginx: `docker logs sigac-web -f`
- Logs Postgres: `docker logs sigac-postgres -f`
- Vérifier l’API: `curl http://<SERVER>:80/api/health`
- Vérifier frontend: ouvrez `http://<DOMAIN>`

## Mises à jour

Pousser sur `main` déclenche le workflow qui reconstruit les images, les pousse sur GHCR, copie les fichiers de déploiement et exécute `docker/deploy.sh` sur le serveur.
