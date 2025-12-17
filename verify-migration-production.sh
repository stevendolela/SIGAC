#!/bin/bash

# Script de vérification après application de la migration
# À exécuter localement pour tester la production

echo "🔍 Vérification de la Migration Base64 en Production"
echo "=================================================="
echo ""

echo "1️⃣ Test de l'API Health..."
HEALTH=$(curl -s https://sigac-api.onrender.com/api/health)
STATUS=$(echo $HEALTH | jq -r '.status')

if [ "$STATUS" == "Healthy" ]; then
    echo "   ✅ API opérationnelle"
else
    echo "   ❌ API non accessible"
    exit 1
fi

echo ""
echo "2️⃣ Vérification de la connexion DB..."
DB_STATUS=$(echo $HEALTH | jq -r '.services.database')

if [ "$DB_STATUS" == "Connected" ]; then
    echo "   ✅ Base de données connectée"
else
    echo "   ❌ Base de données non connectée"
    exit 1
fi

echo ""
echo "3️⃣ Test de lecture des workspaces..."
# Note: Nécessite un token valide
# TOKEN="votre_token_ici"
# curl -s -H "Authorization: Bearer $TOKEN" https://sigac-api.onrender.com/api/workspaces

echo "   ℹ️  Nécessite un token d'authentification"
echo "   Commande: curl -H 'Authorization: Bearer TOKEN' https://sigac-api.onrender.com/api/workspaces"

echo ""
echo "=================================================="
echo "✨ Vérification terminée!"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Appliquer la migration via Shell Render"
echo "   2. Tester l'upload d'un logo en base64"
echo "   3. Vérifier l'affichage dans le frontend"
echo ""
echo "📖 Guide complet: LOGO_BASE64_GUIDE.md"
echo "🚀 Instructions: APPLY_MIGRATION_NOW.md"
