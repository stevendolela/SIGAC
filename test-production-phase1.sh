#!/bin/bash

# Test de mise à jour production - Phase 1 Sécurité + Workspace
# Date: 17 décembre 2024

echo "🔍 SIGAC - Vérification Déploiement Phase 1"
echo "==========================================="
echo ""

# Configuration
BACKEND_URL="https://sigac-api.onrender.com"
FRONTEND_URL="https://taajii.fr"
ADMIN_USER="admin"
ADMIN_PASS="Admin@2024!"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de test
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ OK (HTTP $status)${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $status, expected $expected_status)${NC}"
        return 1
    fi
}

echo "📡 1. Backend Health Check"
echo "─────────────────────────"
test_endpoint "Health endpoint" "$BACKEND_URL/api/health" 200

echo ""
echo "🔐 2. Authentication & JWT"
echo "─────────────────────────"
echo -n "Login test... "
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ OK (Token received)${NC}"
    echo "   Token length: ${#TOKEN} chars"
else
    echo -e "${RED}❌ FAIL (No token)${NC}"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi

echo ""
echo "🚦 3. Rate Limiting Test"
echo "─────────────────────────"
echo "Sending 7 rapid login attempts (limit: 5/min)..."

blocked=false
for i in {1..7}; do
    status=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}')
    
    echo -n "  Attempt $i: HTTP $status"
    
    if [ "$status" -eq 429 ]; then
        echo -e " ${YELLOW}(Rate limited)${NC}"
        blocked=true
        break
    else
        echo ""
    fi
    
    sleep 0.3
done

if [ "$blocked" = true ]; then
    echo -e "${GREEN}✅ Rate limiting is working${NC}"
else
    echo -e "${RED}⚠️  Rate limiting may not be active${NC}"
fi

echo ""
echo "🏢 4. Workspace API Test"
echo "─────────────────────────"
echo -n "Fetching workspaces... "
WORKSPACES=$(curl -s "$BACKEND_URL/api/workspaces" \
    -H "Authorization: Bearer $TOKEN")

if echo "$WORKSPACES" | jq -e '. | length' > /dev/null 2>&1; then
    count=$(echo "$WORKSPACES" | jq '. | length')
    echo -e "${GREEN}✅ OK ($count workspaces)${NC}"
    echo "   Workspaces:"
    echo "$WORKSPACES" | jq -r '.[] | "   - \(.name) (\(.slug))"' 2>/dev/null || echo "   (Unable to parse)"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "   Response: $WORKSPACES"
fi

echo ""
echo "✏️  5. Input Validation Test"
echo "─────────────────────────────"
echo -n "Testing weak password rejection... "
VALIDATION_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$BACKEND_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testvalidation",
        "password": "weak",
        "email": "test@example.com",
        "nomComplet": "Test User"
    }')

status=$(echo "$VALIDATION_RESPONSE" | tail -n1)
body=$(echo "$VALIDATION_RESPONSE" | head -n-1)

if [ "$status" -eq 400 ]; then
    echo -e "${GREEN}✅ OK (Weak password rejected)${NC}"
    echo "   Validation message:"
    echo "$body" | jq -r '.errors // .message // .' | sed 's/^/   /'
else
    echo -e "${RED}⚠️  Validation may not be strict (HTTP $status)${NC}"
fi

echo ""
echo "🌐 6. Frontend Check"
echo "─────────────────────"
test_endpoint "Frontend homepage" "$FRONTEND_URL" 200

echo ""
echo "📊 7. Database Migration Check"
echo "───────────────────────────────"
echo "Checking if Workspace tables exist via API..."
echo -n "Creating test workspace... "

CREATE_WS=$(curl -s -w "\n%{http_code}" \
    -X POST "$BACKEND_URL/api/workspaces" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Workspace",
        "description": "Created by deployment test script"
    }')

status=$(echo "$CREATE_WS" | tail -n1)

if [ "$status" -eq 201 ] || [ "$status" -eq 200 ]; then
    echo -e "${GREEN}✅ OK (Migration applied)${NC}"
    ws_id=$(echo "$CREATE_WS" | head -n-1 | jq -r '.id // empty')
    if [ -n "$ws_id" ]; then
        echo "   Workspace ID: $ws_id"
        # Cleanup: delete test workspace
        curl -s -X DELETE "$BACKEND_URL/api/workspaces/$ws_id" \
            -H "Authorization: Bearer $TOKEN" > /dev/null
        echo "   (Test workspace cleaned up)"
    fi
elif [ "$status" -eq 409 ]; then
    echo -e "${GREEN}✅ OK (Workspace already exists)${NC}"
else
    echo -e "${RED}❌ FAIL (HTTP $status)${NC}"
    echo "   Response: $(echo "$CREATE_WS" | head -n-1)"
    echo -e "${YELLOW}   ⚠️  Database migration may not be applied!${NC}"
fi

echo ""
echo "═══════════════════════════════════════"
echo "🎯 SUMMARY"
echo "═══════════════════════════════════════"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "✅ Tests completed. Check results above."
echo ""
echo "📝 Next Steps:"
echo "   1. If migration check failed, apply it:"
echo "      → Render Dashboard → Service → Shell"
echo "      → cd /app && dotnet ef database update --no-build"
echo ""
echo "   2. Monitor logs for errors:"
echo "      → Render Dashboard → Logs"
echo "      → Vercel Dashboard → Functions"
echo ""
echo "   3. Test manually:"
echo "      → Open $FRONTEND_URL"
echo "      → Login as: $ADMIN_USER"
echo "      → Check workspace selector in sidebar"
echo ""
