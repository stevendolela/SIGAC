#!/bin/bash

###############################################################################
# Script de Test - Historique de Connexion
# Purpose: Tester les endpoints de l'historique de connexion
###############################################################################

# Couleurs pour l'output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${1:-http://localhost:5210/api}"
USERNAME="${2:-admin}"
PASSWORD="${3:-Admin@2024!}"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Test: Historique de Connexion${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}🔗 API URL: ${API_URL}${NC}"
echo -e "${YELLOW}👤 Username: ${USERNAME}${NC}\n"

# ============================================================================
# 1. LOGIN
# ============================================================================
echo -e "${BLUE}[1/5] 🔑 Login...${NC}"

LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/Auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo "Token: ${TOKEN:0:50}..."

# ============================================================================
# 2. GET MY LOGIN HISTORY
# ============================================================================
echo -e "\n${BLUE}[2/5] 📱 Get My Login History...${NC}"

MY_HISTORY=$(curl -s -X GET "${API_URL}/LoginHistory/my-history?limit=10" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

COUNT=$(echo "$MY_HISTORY" | jq 'length // 0')

if [ "$COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Got ${COUNT} login records${NC}"
  
  # Show first record
  echo -e "\n${YELLOW}Sample Record:${NC}"
  echo "$MY_HISTORY" | jq '.[0]' | head -20
else
  echo -e "${YELLOW}⚠️  No login records found (this might be normal on first login)${NC}"
fi

# ============================================================================
# 3. EXTRACT USER ID FOR ADMIN TESTS
# ============================================================================
echo -e "\n${BLUE}[3/5] 👤 Extract User Info...${NC}"

USER_ID=$(echo "$MY_HISTORY" | jq -r '.[0].userId // empty' 2>/dev/null)

if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
  echo -e "${GREEN}✅ User ID: ${USER_ID}${NC}"
else
  echo -e "${YELLOW}⚠️  Could not extract user ID${NC}"
  USER_ID="00000000-0000-0000-0000-000000000000"
fi

# ============================================================================
# 4. GET USER LOGIN HISTORY (Self)
# ============================================================================
echo -e "\n${BLUE}[4/5] 📱 Get User Login History (Self)...${NC}"

USER_HISTORY=$(curl -s -X GET "${API_URL}/LoginHistory/user/${USER_ID}?limit=5" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

USER_COUNT=$(echo "$USER_HISTORY" | jq 'length // 0')

if [ "$USER_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Got ${USER_COUNT} records for user${NC}"
else
  echo -e "${YELLOW}⚠️  No records returned${NC}"
fi

# ============================================================================
# 5. TRY GET ALL HISTORY (Admin endpoint)
# ============================================================================
echo -e "\n${BLUE}[5/5] 👨‍💼 Try Get All Login History (Admin)...${NC}"

ALL_HISTORY=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/LoginHistory/all?limit=5" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$ALL_HISTORY" | tail -1)
RESPONSE=$(echo "$ALL_HISTORY" | head -n -1)

case $HTTP_CODE in
  200)
    COUNT=$(echo "$RESPONSE" | jq 'length // 0')
    echo -e "${GREEN}✅ Admin endpoint accessible - Got ${COUNT} records${NC}"
    ;;
  403)
    echo -e "${YELLOW}⚠️  403 Forbidden (expected if not admin)${NC}"
    ;;
  *)
    echo -e "${RED}❌ HTTP ${HTTP_CODE}${NC}"
    ;;
esac

# ============================================================================
# SUMMARY
# ============================================================================
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Open: ${API_URL/\/api/}/swagger"
echo "2. Login with Bearer token"
echo "3. Test endpoints:"
echo "   - GET /api/LoginHistory/my-history"
echo "   - GET /api/LoginHistory/user/{userId}"
echo "   - GET /api/LoginHistory/all (Admin only)"
echo ""
echo -e "${YELLOW}🌐 Frontend:${NC}"
echo "   - Navigate to: Administration > Historique Connexions"
echo "   - View your login history with IP addresses"
echo ""
