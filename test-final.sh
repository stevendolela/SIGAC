#!/bin/bash

echo "🧪 Test Final - Phase 1 Sécurité en Production"
echo "=============================================="
echo ""

BACKEND="https://sigac-api.onrender.com"

# Test Rate Limiting
echo "1️⃣  Test Rate Limiting (7 tentatives rapides)..."
blocked=false
for i in {1..7}; do
    status=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$BACKEND/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}')
    
    echo -n "   Tentative $i: HTTP $status"
    
    if [ "$status" -eq 429 ]; then
        echo " ← BLOQUÉ ✅"
        blocked=true
        break
    else
        echo ""
    fi
    sleep 0.3
done

if [ "$blocked" = true ]; then
    echo "   ✅ Rate limiting actif !"
else
    echo "   ⏳ Pas encore actif (redéploiement en cours)"
fi

echo ""
echo "2️⃣  Test Input Validation (password faible)..."
response=$(curl -s -w "\n%{http_code}" \
    -X POST "$BACKEND/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username":"testval",
        "password":"weak",
        "email":"test@test.com",
        "nomComplet":"Test"
    }')

status=$(echo "$response" | tail -n1)

if [ "$status" -eq 400 ]; then
    echo "   ✅ Validation stricte active !"
else
    echo "   ⏳ Pas encore actif (HTTP $status)"
fi

echo ""
echo "3️⃣  Frontend accessible..."
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "https://taajii.fr")
if [ "$frontend_status" -eq 200 ] || [ "$frontend_status" -eq 307 ]; then
    echo "   ✅ OK"
else
    echo "   ⏳ HTTP $frontend_status"
fi

echo ""
echo "=============================================="
echo "✅ Si tout est actif, Phase 1 est LIVE !"
echo "   Sinon, attends encore 5 minutes."
