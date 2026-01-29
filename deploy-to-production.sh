#!/bin/bash

# 🚀 Script de Déploiement en Production - SIGAC Rights Management
# ================================================================
# Ce script pousse tous les changements en production sur Render + Vercel

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 DÉPLOIEMENT EN PRODUCTION - SIGAC RIGHTS MANAGEMENT"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Configuration
BACKEND_REPO="sigac-backend"
FRONTEND_REPO="sigac-frontend"
GITHUB_REPO="snk-steve/SIGAC"
COMMIT_MSG="🔐 feat: Intégration complète du système de gestion des droits d'accès (Permissions Management)"

# 1. Vérifier que tous les changements sont validés
echo "📋 Étape 1: Vérification de l'état du git..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Changements non stagés détectés"
    git diff --stat
    echo ""
    read -p "Continuer malgré les changements? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Annulation"
        exit 1
    fi
fi

# 2. Stage tous les changements
echo ""
echo "📝 Étape 2: Staging des fichiers..."
git add -A
git status --short

# 3. Créer le commit
echo ""
echo "💾 Étape 3: Création du commit..."
git commit -m "$COMMIT_MSG" || echo "⚠️  Pas de changements à committer"

# 4. Vérifier les logs
echo ""
echo "📜 Étape 4: Derniers commits..."
git log --oneline -5

# 5. Pousser vers GitHub
echo ""
echo "🌐 Étape 5: Envoi vers GitHub..."
echo "Branch de destination: main (production)"
read -p "Prêt à pousser les changements? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Annulation du push"
    exit 1
fi

git push origin main
echo "✅ Push vers GitHub réussi!"

# 6. Vérification des déploiements
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "⏳ Les déploiements automatiques vont démarrer..."
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📍 Render (Backend): https://sigac-api.onrender.com"
echo "   - Déploiement automatique en cours..."
echo "   - Durée estimée: 3-5 minutes"
echo "   - Statut: https://dashboard.render.com"
echo ""
echo "📍 Vercel (Frontend): https://taajii.fr"
echo "   - Déploiement automatique en cours..."
echo "   - Durée estimée: 1-2 minutes"
echo "   - Statut: https://vercel.com/dashboard"
echo ""

# 7. Migration database
echo "═══════════════════════════════════════════════════════════════"
echo "🗄️  MIGRATION DATABASE (à exécuter sur le serveur Render)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Après le déploiement du backend, exécuter:"
echo ""
echo "  cd sigac-backend"
echo "  dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API"
echo ""
echo "Ou via Render Shell:"
echo "  1. Aller à https://dashboard.render.com"
echo "  2. Sélectionner le service 'sigac-api'"
echo "  3. Cliquer sur 'Shell'"
echo "  4. Exécuter la commande ci-dessus"
echo ""

# 8. Vérification post-déploiement
echo "═══════════════════════════════════════════════════════════════"
echo "✅ VÉRIFICATIONS POST-DÉPLOIEMENT"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Backend API:"
echo "  curl -s https://sigac-api.onrender.com/health | jq ."
echo ""
echo "Frontend:"
echo "  curl -s -o /dev/null -w '%{http_code}' https://taajii.fr"
echo ""
echo "Permissions API (authentifié):"
echo "  curl -X GET https://sigac-api.onrender.com/api/role-permissions/matrix \\"
echo "    -H 'Authorization: Bearer <JWT_TOKEN>'"
echo ""

# 9. Résumé
echo "═══════════════════════════════════════════════════════════════"
echo "🎉 DÉPLOIEMENT LANCÉ!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Fichiers déployés:"
echo "  ✅ Backend Service Layer (RoleModulePermissionService)"
echo "  ✅ API Controller (RolePermissionsController - 10 endpoints)"
echo "  ✅ Repository & EF Migration"
echo "  ✅ Frontend API Client (rolePermissionsApi.ts)"
echo "  ✅ Admin UI (RightsManagementPage.tsx)"
echo ""
echo "Prochaines étapes:"
echo "  1️⃣  Attendre la fin des déploiements (~5-10 minutes)"
echo "  2️⃣  Appliquer la migration database via Render Shell"
echo "  3️⃣  Tester la page admin: https://taajii.fr/admin/rights"
echo "  4️⃣  Vérifier les logs: https://sigac-api.onrender.com/swagger"
echo ""
echo "Support:"
echo "  📖 Docs: RIGHTS_MANAGEMENT_IMPLEMENTATION.md"
echo "  🔗 GitHub: https://github.com/$GITHUB_REPO"
echo ""
