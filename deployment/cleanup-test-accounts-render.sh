#!/bin/bash

# Script pour nettoyer les comptes de test sur Render
# Ce script se connecte à la base Render et supprime tous les comptes contenant 'test'

echo "🧹 Nettoyage des comptes de test sur la base de production Render..."
echo ""

# URL de connexion PostgreSQL Render (à remplacer par la vraie URL)
# Format: postgresql://user:password@host:port/database
RENDER_DB_URL="postgresql://sigac_user:xxx@dpg-xxx.frankfurt-postgres.render.com/sigac_db"

echo "⚠️  ATTENTION: Vous devez remplacer RENDER_DB_URL dans ce script par l'URL complète de votre base Render"
echo "Vous pouvez trouver cette URL dans:"
echo "  1. Dashboard Render > sigac-db > Info > External Database URL"
echo "  2. Ou dans les variables d'environnement du backend: DATABASE_URL"
echo ""
echo "Pour exécuter le script après avoir mis à jour l'URL:"
echo "  chmod +x deployment/cleanup-test-accounts-render.sh"
echo "  ./deployment/cleanup-test-accounts-render.sh"
echo ""

# Décommenter ces lignes une fois l'URL configurée
# echo "📋 Listage des comptes à supprimer..."
# psql "$RENDER_DB_URL" -c "SELECT \"Username\", \"Email\" FROM \"Users\" WHERE LOWER(\"Username\") LIKE '%test%' OR LOWER(\"Email\") LIKE '%test%';"
# 
# echo ""
# read -p "❓ Voulez-vous vraiment supprimer ces comptes ? (oui/non) " confirm
# 
# if [ "$confirm" = "oui" ]; then
#     echo "🗑️  Suppression en cours..."
#     psql "$RENDER_DB_URL" -c "DELETE FROM \"Users\" WHERE LOWER(\"Username\") LIKE '%test%' OR LOWER(\"Email\") LIKE '%test%';"
#     
#     echo ""
#     echo "✅ Nettoyage terminé!"
#     echo ""
#     echo "📊 Vérification - Comptes restants avec 'test':"
#     psql "$RENDER_DB_URL" -c "SELECT COUNT(*) FROM \"Users\" WHERE LOWER(\"Username\") LIKE '%test%' OR LOWER(\"Email\") LIKE '%test%';"
# else
#     echo "❌ Opération annulée"
# fi
