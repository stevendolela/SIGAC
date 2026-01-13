#!/bin/bash

# Test endpoint dashboard avec un token admin réel
API_URL="http://localhost:5210/api"

echo "=== Step 1: Login as admin ==="
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@2024!"
  }')

echo "Login response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)
USER_JSON=$(echo "$LOGIN_RESPONSE" | jq -r '.user' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "ERROR: Failed to get token"
  exit 1
fi

echo ""
echo "=== User info from token ==="
echo "$USER_JSON" | jq '.' 2>/dev/null

DEFAULT_WORKSPACE_ID=$(echo "$USER_JSON" | jq -r '.defaultWorkspaceId' 2>/dev/null)
echo ""
echo "DefaultWorkspaceId from user: $DEFAULT_WORKSPACE_ID"

echo ""
echo "=== Step 2: Call dashboard/statistics WITHOUT workspaceId ==="
curl -s "$API_URL/dashboard/statistics" \
  -H "Authorization: Bearer $TOKEN" | jq '.' | head -30

echo ""
echo "=== Step 3: Call dashboard/statistics WITH workspaceId ==="
if [ -n "$DEFAULT_WORKSPACE_ID" ] && [ "$DEFAULT_WORKSPACE_ID" != "null" ]; then
  curl -s "$API_URL/dashboard/statistics?workspaceId=$DEFAULT_WORKSPACE_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.userConnections' 2>/dev/null || echo "Error parsing response"
else
  echo "ERROR: No defaultWorkspaceId in user object!"
fi
