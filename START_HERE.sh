#!/bin/bash

# 🚀 DÉMARRAGE RAPIDE - Migration Base64 Logo/Avatar
# ===================================================

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🎯 MIGRATION BASE64 - Guide Express                          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

echo "📦 Ce qui a été fait automatiquement:"
echo "   ✅ Migration créée: 20251217133725_AddBase64LogoAndAvatar"
echo "   ✅ Migration appliquée localement"
echo "   ✅ Code commité et poussé sur GitHub (commit 040e8ce)"
echo "   ✅ Render va redéployer automatiquement (~10-15 min)"
echo ""

echo "🎬 CE QUE VOUS DEVEZ FAIRE MAINTENANT:"
echo ""
echo "   1️⃣  Attendre que Render finisse de redéployer"
echo "       → Vérifier sur: https://dashboard.render.com/"
echo "       → Service: sigac-api"
echo "       → Status: 'Live' (vert)"
echo ""
echo "   2️⃣  Ouvrir le Shell Render"
echo "       → Cliquer sur 'Shell' dans le menu"
echo ""
echo "   3️⃣  Copier-coller cette commande:"
echo ""
echo "       cd /app && dotnet ef database update --no-build --startup-project SIGAC.API"
echo ""
echo "   4️⃣  Attendre le message 'Done.' (~5 secondes)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Fichiers créés pour vous aider:"
echo ""
echo "   📄 APPLY_MIGRATION_NOW.md       → Guide détaillé avec screenshots"
echo "   📄 LOGO_BASE64_GUIDE.md          → Guide complet d'implémentation"
echo "   📄 apply-migration-production.sh → Script pour Render Shell"
echo "   📄 verify-migration-production.sh→ Script de vérification"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 Vérifier le statut actuel:"
echo ""

# Vérifier l'API
echo "   🌐 API Render Health Check..."
HEALTH_CHECK=$(curl -s https://sigac-api.onrender.com/api/health 2>/dev/null)

if [ ! -z "$HEALTH_CHECK" ]; then
    STATUS=$(echo $HEALTH_CHECK | jq -r '.status' 2>/dev/null)
    if [ "$STATUS" == "Healthy" ]; then
        echo "      ✅ API opérationnelle"
        echo "      ✅ Prêt pour appliquer la migration"
    else
        echo "      ⏳ API en cours de redéploiement..."
        echo "      ⏱️  Attendre quelques minutes et réessayer"
    fi
else
    echo "      ⏳ API en cours de redéploiement..."
    echo "      ⏱️  Attendre quelques minutes"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "❓ Questions fréquentes:"
echo ""
echo "   Q: Combien de temps prend le redéploiement ?"
echo "   R: ~10-15 minutes sur Render (auto-deploy depuis GitHub)"
echo ""
echo "   Q: Comment savoir si Render a fini de redéployer ?"
echo "   R: Dashboard Render → Status 'Live' (vert) + ce script dit 'API opérationnelle'"
echo ""
echo "   Q: La migration est-elle dangereuse ?"
echo "   R: Non, elle ajoute juste 2 colonnes sans toucher aux données existantes"
echo ""
echo "   Q: Que se passe-t-il si j'oublie d'appliquer la migration ?"
echo "   R: L'API va crash au démarrage (colonnes manquantes)"
echo ""
echo "   Q: Puis-je revenir en arrière ?"
echo "   R: Oui, avec 'dotnet ef database update PreviousMigration'"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 RÉSUMÉ - À FAIRE MAINTENANT:"
echo ""
echo "   1. Ouvrir: https://dashboard.render.com/"
echo "   2. Service: sigac-api → Shell"
echo "   3. Commande: cd /app && dotnet ef database update --no-build --startup-project SIGAC.API"
echo "   4. Vérifier: Message 'Done.'"
echo ""
echo "✨ C'est tout ! Vous avez tout le reste de prêt."
echo ""
