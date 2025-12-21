#!/bin/bash

# Script de migration SQL pour Render (sans dotnet ef)
# Usage: bash migrate-production-render.sh

set -e

echo "======================================"
echo "Migration LogoBase64 - Render PostgreSQL"
echo "======================================"
echo ""

# Vérifier que le fichier SQL existe
if [ ! -f "migration-base64.sql" ]; then
    echo "❌ Erreur: Le fichier migration-base64.sql n'existe pas"
    exit 1
fi

echo "📄 Fichier SQL trouvé: migration-base64.sql"
echo ""

# Instructions pour l'utilisateur
echo "🔧 Instructions pour appliquer la migration sur Render:"
echo ""
echo "1. Connectez-vous au Shell Render de votre instance backend:"
echo "   - Allez sur https://dashboard.render.com"
echo "   - Sélectionnez votre service 'sigac-api'"
echo "   - Cliquez sur 'Shell' dans le menu de gauche"
echo ""
echo "2. Dans le shell Render, installez PostgreSQL client:"
echo "   apt-get update && apt-get install -y postgresql-client"
echo ""
echo "3. Copiez le contenu du fichier migration-base64.sql"
echo "   (ci-dessous) et exécutez-le dans le shell:"
echo ""
echo "   psql \$DATABASE_URL -f - <<'EOF'"
cat migration-base64.sql
echo "EOF"
echo ""
echo "======================================"
echo ""
echo "OU utilisez cette commande en une ligne dans le Shell Render:"
echo ""
echo "curl -s https://raw.githubusercontent.com/stevendolela/SIGAC/main/migration-base64.sql | psql \$DATABASE_URL"
echo ""
echo "======================================"
