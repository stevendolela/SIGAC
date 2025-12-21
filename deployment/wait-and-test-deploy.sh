#!/bin/bash

# Attendre le déploiement et re-tester
# Date: 17 décembre 2024

echo "⏳ Attente du déploiement..."
echo ""
echo "🔄 Render redéploie depuis commit 11b1a0a"
echo "🔄 Vercel redéploie depuis commit 11b1a0a"
echo ""
echo "Temps estimé: 5-10 minutes"
echo ""

# Attendre 2 minutes avant de commencer les tests
echo "Attente de 2 minutes avant les premiers tests..."
sleep 120

BACKEND_URL="https://sigac-api.onrender.com"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

for attempt in {1..5}; do
    echo ""
    echo "═══════════════════════════════════"
    echo "Test #$attempt (toutes les 2 minutes)"
    echo "═══════════════════════════════════"
    
    # Health check
    echo -n "Health check... "
    health=$(curl -s "$BACKEND_URL/api/health" 2>/dev/null)
    if echo "$health" | jq -e '.status' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ En cours de déploiement${NC}"
    fi
    
    # Rate limiting check
    echo -n "Rate limiting... "
    blocked=false
    for i in {1..7}; do
        status=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST "$BACKEND_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"username":"test","password":"test"}' 2>/dev/null)
        
        if [ "$status" -eq 429 ]; then
            blocked=true
            break
        fi
        sleep 0.2
    done
    
    if [ "$blocked" = true ]; then
        echo -e "${GREEN}✅ Actif${NC}"
    else
        echo -e "${YELLOW}⏳ Pas encore actif${NC}"
    fi
    
    # Si tout est OK, terminer
    if echo "$health" | jq -e '.status' > /dev/null 2>&1 && [ "$blocked" = true ]; then
        echo ""
        echo -e "${GREEN}✅ Déploiement terminé !${NC}"
        echo ""
        echo "Exécute maintenant:"
        echo "  ./test-production-phase1.sh"
        break
    fi
    
    if [ $attempt -lt 5 ]; then
        echo ""
        echo "Attente de 2 minutes avant le prochain test..."
        sleep 120
    fi
done

echo ""
echo "📝 Prochaines étapes:"
echo "   1. Applique la migration database:"
echo "      → Render Dashboard → Service → Shell"
echo "      → cd /app && dotnet ef database update --no-build"
echo ""
echo "   2. Re-teste tout:"
echo "      → ./test-production-phase1.sh"
echo ""
