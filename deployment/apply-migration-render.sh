#!/bin/bash

# Script d'application de la migration SystemSettings sur Render PostgreSQL
# Usage: ./apply-migration-render.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 APPLICATION MIGRATION SYSTEMSETTINGS SUR RENDER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifier que psql est installé
if ! command -v psql &> /dev/null; then
    echo "❌ Erreur: psql n'est pas installé"
    echo "   Installez-le avec: sudo apt-get install postgresql-client"
    exit 1
fi

# Vérifier que le fichier de migration existe
MIGRATION_FILE="./deployment/migration-system-settings.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Erreur: Fichier de migration non trouvé: $MIGRATION_FILE"
    exit 1
fi

echo "📋 Fichier de migration trouvé: $MIGRATION_FILE"
echo ""

# Demander l'URL de connexion Render
echo "🔑 Veuillez fournir l'URL de connexion PostgreSQL Render"
echo "   Format: postgres://user:password@host:port/database"
echo ""
read -p "URL de connexion: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ URL de connexion vide. Abandon."
    exit 1
fi

echo ""
echo "⚠️  ATTENTION: Cette opération va modifier la base de données de PRODUCTION"
echo ""
read -p "Voulez-vous continuer? (oui/non): " CONFIRM

if [ "$CONFIRM" != "oui" ]; then
    echo "❌ Opération annulée."
    exit 0
fi

echo ""
echo "🔄 Application de la migration..."
echo ""

# Appliquer la migration
if psql "$DATABASE_URL" < "$MIGRATION_FILE"; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ MIGRATION APPLIQUÉE AVEC SUCCÈS!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📊 Vérification de la table..."
    psql "$DATABASE_URL" -c '\dt "SystemSettings"'
    echo ""
    echo "✨ La table SystemSettings est maintenant disponible en production!"
    echo ""
    echo "🎯 Prochaines étapes:"
    echo "   1. Redémarrez le backend Render (optionnel)"
    echo "   2. Testez l'upload du logo sur https://taajii.fr"
    echo "   3. Allez dans Système → Gestion du Logo"
    echo ""
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ ERREUR LORS DE L'APPLICATION DE LA MIGRATION"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Vérifiez:"
    echo "   - URL de connexion correcte"
    echo "   - Accès réseau à Render"
    echo "   - Table n'existe pas déjà"
    echo ""
    exit 1
fi
