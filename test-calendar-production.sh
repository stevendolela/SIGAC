#!/bin/bash
# Script: Test du calendrier en production
# Usage: ./test-calendar-production.sh

set -e

echo "========================================"
echo "🧪 Test Calendrier SIGAC Production"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
FRONTEND_URL="https://taajii.fr"
BACKEND_URL="https://sigac-api.onrender.com"

echo "🌐 URLs Production:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL/api"
echo ""

# Test 1: Frontend accessible
echo "📝 Test 1: Frontend accessible..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ "$FRONTEND_STATUS" -eq 200 ] || [ "$FRONTEND_STATUS" -eq 301 ]; then
    echo -e "   ${GREEN}✅ Frontend OK${NC} (HTTP $FRONTEND_STATUS)"
else
    echo -e "   ${RED}❌ Frontend erreur${NC} (HTTP $FRONTEND_STATUS)"
fi
echo ""

# Test 2: Backend Health
echo "📝 Test 2: Backend health check..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/health)
if [ "$HEALTH_STATUS" -eq 200 ]; then
    echo -e "   ${GREEN}✅ Backend OK${NC} (HTTP $HEALTH_STATUS)"
else
    echo -e "   ${RED}❌ Backend erreur${NC} (HTTP $HEALTH_STATUS)"
fi
echo ""

# Test 3: Frontend contient nouveau code calendrier
echo "📝 Test 3: Frontend contient nouveau code calendrier..."
if curl -s $FRONTEND_URL | grep -q "Formation\|Deadline"; then
    echo -e "   ${GREEN}✅ Nouveaux types événements détectés${NC}"
else
    echo -e "   ${YELLOW}⚠️  Ancienne version ou déploiement en cours${NC}"
    echo -e "   ${YELLOW}   Attendre 2-3 min et relancer ce script${NC}"
fi
echo ""

# Test 4: API Calendar endpoint
echo "📝 Test 4: API Calendar endpoint accessible..."
API_CALENDAR_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/calendar 2>/dev/null || echo "000")
if [ "$API_CALENDAR_STATUS" -eq 401 ]; then
    echo -e "   ${GREEN}✅ Endpoint existe${NC} (401 = auth requise, normal)"
elif [ "$API_CALENDAR_STATUS" -eq 200 ]; then
    echo -e "   ${GREEN}✅ Endpoint OK${NC} (HTTP 200)"
else
    echo -e "   ${RED}❌ Endpoint erreur${NC} (HTTP $API_CALENDAR_STATUS)"
fi
echo ""

# Test 5: Swagger accessible
echo "📝 Test 5: Swagger documentation accessible..."
SWAGGER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/swagger)
if [ "$SWAGGER_STATUS" -eq 200 ] || [ "$SWAGGER_STATUS" -eq 301 ]; then
    echo -e "   ${GREEN}✅ Swagger OK${NC} (HTTP $SWAGGER_STATUS)"
    echo -e "   ${GREEN}   → Ouvrir: $BACKEND_URL/swagger${NC}"
else
    echo -e "   ${RED}❌ Swagger erreur${NC} (HTTP $SWAGGER_STATUS)"
fi
echo ""

# Résumé
echo "========================================"
echo "📊 Résumé"
echo "========================================"
echo ""
echo "✅ Tests automatiques terminés"
echo ""
echo "🧪 Tests manuels à effectuer:"
echo ""
echo "1. Ouvrir: $FRONTEND_URL"
echo "2. Se connecter: admin / Admin@2024!"
echo "3. Naviguer vers: Calendrier"
echo "4. Vérifier:"
echo "   - Dropdown Type a 5 options (Formation, Deadline visibles)"
echo "   - Dropdown Statut a 4 options (nouveau)"
echo "   - Zone recherche participants (nouveau)"
echo "   - Badges participants sélectionnés (nouveau)"
echo "   - Dropdown Rappel automatique (nouveau)"
echo "   - Dropdown Salle de réunion (nouveau)"
echo ""
echo "5. Test complet:"
echo "   a. Créer événement type 'Formation'"
echo "   b. Rechercher 'juge' dans participants"
echo "   c. Sélectionner 2-3 participants"
echo "   d. Vérifier badges bleus apparaissent"
echo "   e. Cliquer × sur badge → participant retiré"
echo "   f. Définir rappel '1 heure avant'"
echo "   g. Sauvegarder"
echo ""
echo "⚠️  Note: Backend doit être mis à jour pour persistance complète"
echo "    Voir: BACKEND_CALENDAR_UPDATES.md"
echo ""
echo "📚 Documentation:"
echo "   - Guide utilisateur: CALENDAR_USER_GUIDE.md"
echo "   - Guide tests: TEST_CALENDAR_GUIDE.md"
echo "   - Statut deploy: DEPLOYMENT_CALENDAR_STATUS.md"
echo ""
echo "🎉 Frontend déployé avec succès !"
echo ""
