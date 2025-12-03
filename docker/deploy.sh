#!/usr/bin/env bash
set -euo pipefail

# SIGAC - Script de déploiement côté serveur (à exécuter sur le VPS)
# Prérequis: docker & docker compose installés

ROOT_DIR=${ROOT_DIR:-"$HOME/sigac"}
COMPOSE_FILE=${COMPOSE_FILE:-"docker/docker-compose.prod.yml"}
NGINX_CONF=${NGINX_CONF:-"docker/nginx/default.conf"}

echo "[SIGAC] Déploiement dans $ROOT_DIR"
mkdir -p "$ROOT_DIR"/docker/nginx

# Copier compose et nginx si disponibles dans le répertoire courant
if [[ -f "$COMPOSE_FILE" ]]; then
  cp -f "$COMPOSE_FILE" "$ROOT_DIR/docker-compose.prod.yml"
fi
if [[ -f "$NGINX_CONF" ]]; then
  cp -f "$NGINX_CONF" "$ROOT_DIR/docker/nginx/default.conf"
fi

cd "$ROOT_DIR"

# Afficher variables critiques
echo "[SIGAC] Domaine: ${DOMAIN:-"(non défini)"}"
echo "[SIGAC] DB: ${POSTGRES_DB:-"(non défini)"} / ${POSTGRES_USER:-"(non défini)"}"
echo "[SIGAC] JWT_SECRET: ${JWT_SECRET:-"(non défini)"}"

if [[ ! -f docker-compose.prod.yml ]]; then
  echo "[ERREUR] docker-compose.prod.yml introuvable dans $ROOT_DIR" >&2
  exit 1
fi

# Créer le réseau si besoin
docker network create sigac >/dev/null 2>&1 || true

echo "[SIGAC] Pull des images (si présentes)"
docker compose -f docker-compose.prod.yml pull || true

echo "[SIGAC] Lancement/MAJ de la stack"
docker compose -f docker-compose.prod.yml up -d

echo "[SIGAC] Services démarrés. Statut:"
docker compose -f docker-compose.prod.yml ps

echo "[SIGAC] Fin du déploiement. Front: http://${DOMAIN:-"<SERVER-IP>"}"
