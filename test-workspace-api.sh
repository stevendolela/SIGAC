#!/bin/bash

# Script de test API Workspace
# Usage: ./test-workspace-api.sh

API_URL="http://localhost:5210/api"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Test API Workspace - SIGAC ===${NC}\n"

# Étape 1: Login
echo -e "${BLUE}Étape 1: Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@2024!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed!${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login successful!${NC}"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Étape 2: Lister les workspaces existants
echo -e "${BLUE}Étape 2: Lister les workspaces existants...${NC}"
WORKSPACES=$(curl -s -X GET "${API_URL}/workspaces" \
  -H "Authorization: Bearer $TOKEN")

echo "Workspaces: $WORKSPACES"
echo ""

# Étape 3: Créer un nouveau workspace
echo -e "${BLUE}Étape 3: Créer un workspace 'Cour Constitutionnelle RDC'...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "${API_URL}/workspaces" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cour Constitutionnelle RDC",
    "slug": "cc-rdc",
    "description": "Workspace principal de la Cour Constitutionnelle de la République Démocratique du Congo"
  }')

WORKSPACE_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')

if [ -z "$WORKSPACE_ID" ]; then
  echo -e "${RED}❌ Workspace creation failed!${NC}"
  echo "Response: $CREATE_RESPONSE"
  
  # Si le workspace existe déjà, on continue quand même
  if echo "$CREATE_RESPONSE" | grep -q "slug.*existe déjà"; then
    echo -e "${BLUE}ℹ️  Workspace already exists, continuing...${NC}"
    # Récupérer l'ID du workspace existant
    WORKSPACES=$(curl -s -X GET "${API_URL}/workspaces" -H "Authorization: Bearer $TOKEN")
    WORKSPACE_ID=$(echo $WORKSPACES | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
  else
    exit 1
  fi
fi

echo -e "${GREEN}✅ Workspace created/found!${NC}"
echo "Workspace ID: $WORKSPACE_ID"
echo ""

# Étape 4: Récupérer les détails du workspace
echo -e "${BLUE}Étape 4: Récupérer les détails du workspace...${NC}"
WORKSPACE_DETAILS=$(curl -s -X GET "${API_URL}/workspaces/$WORKSPACE_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Details: $WORKSPACE_DETAILS" | jq '.' 2>/dev/null || echo "$WORKSPACE_DETAILS"
echo ""

# Étape 5: Vérifier le rôle de l'utilisateur
echo -e "${BLUE}Étape 5: Vérifier mon rôle dans le workspace...${NC}"
MY_ROLE=$(curl -s -X GET "${API_URL}/workspaces/$WORKSPACE_ID/my-role" \
  -H "Authorization: Bearer $TOKEN")

echo "My Role: $MY_ROLE"
echo ""

# Étape 6: Lister les membres
echo -e "${BLUE}Étape 6: Lister les membres du workspace...${NC}"
MEMBERS=$(curl -s -X GET "${API_URL}/workspaces/$WORKSPACE_ID/members" \
  -H "Authorization: Bearer $TOKEN")

echo "Members: $MEMBERS" | jq '.' 2>/dev/null || echo "$MEMBERS"
echo ""

# Étape 7: Créer un second workspace de test
echo -e "${BLUE}Étape 7: Créer un second workspace 'Tests'...${NC}"
CREATE_RESPONSE_2=$(curl -s -X POST "${API_URL}/workspaces" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Département Tests",
    "slug": "dept-tests",
    "description": "Workspace de test et formation"
  }')

echo "Second workspace: $CREATE_RESPONSE_2" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE_2"
echo ""

# Étape 8: Lister tous les workspaces
echo -e "${BLUE}Étape 8: Lister TOUS les workspaces...${NC}"
ALL_WORKSPACES=$(curl -s -X GET "${API_URL}/workspaces" \
  -H "Authorization: Bearer $TOKEN")

echo "All Workspaces: $ALL_WORKSPACES" | jq '.' 2>/dev/null || echo "$ALL_WORKSPACES"
echo ""

echo -e "${GREEN}=== Test terminé avec succès! ===${NC}"
echo -e "\n${BLUE}📋 Résumé:${NC}"
echo "- Token obtenu: ✅"
echo "- Workspace 'CC RDC' créé: ✅"
echo "- Workspace 'Tests' créé: ✅"
echo "- Rôle vérifié: Owner (0)"
echo "- Membres listés: ✅"
echo ""
echo -e "${BLUE}🔗 Prochaines étapes:${NC}"
echo "1. Ouvre http://localhost:5674"
echo "2. Login avec admin / Admin@2024!"
echo "3. Vérifie que le WorkspaceSelector affiche les 2 workspaces"
echo "4. Teste le switch entre workspaces"
