#!/bin/bash

API="https://sigac-api.onrender.com/api"

echo "Step 1: Login..."
RESPONSE=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}')

TOKEN=$(echo "$RESPONSE" | jq -r '.token')
WORKSPACE_ID=$(echo "$RESPONSE" | jq -r '.user.defaultWorkspaceId')

echo "Token: ${TOKEN:0:30}..."
echo "WorkspaceId: $WORKSPACE_ID"

if [ "$WORKSPACE_ID" = "null" ] || [ -z "$WORKSPACE_ID" ]; then
  echo "ERROR: No defaultWorkspaceId!"
  exit 1
fi

echo ""
echo "Step 2: Test dashboard WITHOUT workspaceId..."
COUNT_WITHOUT=$(curl -s "$API/dashboard/statistics" \
  -H "Authorization: Bearer $TOKEN" | jq '.userConnections | length // 0')
echo "User connections without workspaceId: $COUNT_WITHOUT"

echo ""
echo "Step 3: Test dashboard WITH workspaceId..."
COUNT_WITH=$(curl -s "$API/dashboard/statistics?workspaceId=$WORKSPACE_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.userConnections | length // 0')
echo "User connections with workspaceId: $COUNT_WITH"

echo ""
echo "=== RESULT ==="
if [ "$COUNT_WITHOUT" = "0" ] && [ "$COUNT_WITH" -gt "0" ]; then
  echo "✓ API WORKS! Problem is: Frontend not sending workspaceId parameter"
elif [ "$COUNT_WITHOUT" = "$COUNT_WITH" ] && [ "$COUNT_WITH" -gt "0" ]; then
  echo "✓ Both work! WorkspaceId filter might not be working though"
else
  echo "✗ API issue - no connections returned even with workspaceId"
fi
