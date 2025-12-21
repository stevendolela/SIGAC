#!/bin/bash

# Vérifier si la migration Workspace a été appliquée en production
# Date: 17 décembre 2024

BACKEND_URL="https://sigac-api.onrender.com"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🔍 Vérification Migration Workspace en Production"
echo "=================================================="
echo ""
echo "Backend: $BACKEND_URL"
echo ""

# 1. Login pour obtenir token
echo -n "1️⃣  Login... "
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"Admin@2024!"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ ERREUR${NC}"
    echo "Impossible de se connecter. Vérifiez les credentials."
    exit 1
fi

# 2. Tester l'endpoint workspace
echo ""
echo -n "2️⃣  Test endpoint /api/workspaces... "
WS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/workspaces" \
    -H "Authorization: Bearer $TOKEN")

STATUS=$(echo "$WS_RESPONSE" | tail -n1)
BODY=$(echo "$WS_RESPONSE" | head -n-1)

if [ "$STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ OK (HTTP 200)${NC}"
    
    # Compter les workspaces
    COUNT=$(echo "$BODY" | jq '. | length' 2>/dev/null || echo "0")
    echo "   Workspaces trouvés: $COUNT"
    
    if [ "$COUNT" -gt 0 ]; then
        echo ""
        echo "   Liste des workspaces:"
        echo "$BODY" | jq -r '.[] | "   - \(.name) (\(.slug))"' 2>/dev/null
    fi
    
    echo ""
    echo -e "${GREEN}✅ MIGRATION DÉJÀ APPLIQUÉE${NC}"
    echo ""
    echo "Les tables Workspaces et WorkspaceUsers existent en production."
    echo "Aucune action requise !"
    
elif [ "$STATUS" -eq 404 ]; then
    echo -e "${RED}❌ ERREUR (HTTP 404)${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  MIGRATION NON APPLIQUÉE${NC}"
    echo ""
    echo "L'endpoint /api/workspaces n'existe pas encore."
    echo "Le backend n'a pas encore été redéployé avec le nouveau code."
    echo ""
    echo "📝 Actions requises:"
    echo "   1. Attendre que Render finisse le déploiement"
    echo "   2. Vérifier le statut: https://dashboard.render.com/"
    echo "   3. Une fois 'Live', appliquer la migration"
    
elif [ "$STATUS" -eq 500 ]; then
    echo -e "${YELLOW}⚠️  ERREUR SERVEUR (HTTP 500)${NC}"
    echo ""
    echo -e "${YELLOW}🔧 MIGRATION NON APPLIQUÉE${NC}"
    echo ""
    echo "Le backend est déployé mais la migration database n'est pas appliquée."
    echo ""
    echo "📝 Actions requises:"
    echo ""
    echo -e "${BLUE}Via Render Shell (RECOMMANDÉ):${NC}"
    echo "   1. https://dashboard.render.com/"
    echo "   2. Clique sur ton service backend"
    echo "   3. Onglet 'Shell'"
    echo "   4. Exécute:"
    echo -e "${BLUE}      cd /app${NC}"
    echo -e "${BLUE}      dotnet ef database update --no-build${NC}"
    echo ""
    echo "Ou vois le guide: APPLY_MIGRATION_PRODUCTION.md"
    
else
    echo -e "${YELLOW}⚠️  STATUT INATTENDU (HTTP $STATUS)${NC}"
    echo ""
    echo "Réponse:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

# 3. Tester la création d'un workspace (si migration OK)
if [ "$STATUS" -eq 200 ]; then
    echo ""
    echo -n "3️⃣  Test création workspace... "
    
    CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST "$BACKEND_URL/api/workspaces" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test Auto Migration",
            "description": "Workspace de test créé automatiquement"
        }')
    
    CREATE_STATUS=$(echo "$CREATE_RESPONSE" | tail -n1)
    CREATE_BODY=$(echo "$CREATE_RESPONSE" | head -n-1)
    
    if [ "$CREATE_STATUS" -eq 201 ] || [ "$CREATE_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ OK${NC}"
        
        WS_ID=$(echo "$CREATE_BODY" | jq -r '.id // empty')
        if [ -n "$WS_ID" ]; then
            echo "   Workspace créé: $WS_ID"
            
            # Cleanup
            echo -n "   Suppression du workspace de test... "
            DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
                -X DELETE "$BACKEND_URL/api/workspaces/$WS_ID" \
                -H "Authorization: Bearer $TOKEN")
            
            if [ "$DELETE_STATUS" -eq 200 ] || [ "$DELETE_STATUS" -eq 204 ]; then
                echo -e "${GREEN}✅${NC}"
            else
                echo -e "${YELLOW}⚠️  (HTTP $DELETE_STATUS)${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  (HTTP $CREATE_STATUS)${NC}"
        echo "   Réponse: $(echo "$CREATE_BODY" | jq -c '.' 2>/dev/null || echo "$CREATE_BODY")"
    fi
fi

echo ""
echo "=================================================="
echo ""

# Résumé final
if [ "$STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ TOUT EST OK !${NC}"
    echo ""
    echo "La migration Workspace est appliquée en production."
    echo "Tu peux maintenant utiliser les workspaces sur:"
    echo "   https://taajii.fr"
    echo ""
    echo "Prochaines étapes:"
    echo "   1. Teste le sélecteur workspace dans la sidebar"
    echo "   2. Crée des workspaces via l'interface admin"
    echo "   3. Vérifie le filtrage des dossiers par workspace"
elif [ "$STATUS" -eq 404 ]; then
    echo -e "${YELLOW}⏳ ATTENTE DÉPLOIEMENT${NC}"
    echo ""
    echo "Le code n'est pas encore déployé sur Render."
    echo "Vérifie: https://dashboard.render.com/"
else
    echo -e "${YELLOW}🔧 ACTION REQUISE${NC}"
    echo ""
    echo "Migration à appliquer via Render Shell."
    echo "Vois: APPLY_MIGRATION_PRODUCTION.md"
fi

echo ""
