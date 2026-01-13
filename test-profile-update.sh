#!/bin/bash

# Script de test: Profile Update Endpoints
# Usage: bash test-profile-update.sh <token>

set -e

API_URL="${1:-http://localhost:5210/api}"
TOKEN="$2"

if [ -z "$TOKEN" ]; then
  echo "❌ Token required!"
  echo "Usage: bash test-profile-update.sh <api_url> <jwt_token>"
  echo ""
  echo "Example:"
  echo "  # 1. Login to get token:"
  echo "  TOKEN=\$(curl -s -X POST http://localhost:5210/api/auth/login ..."
  echo ""
  echo "  # 2. Then test profile:"
  echo "  bash test-profile-update.sh http://localhost:5210/api \"\$TOKEN\""
  exit 1
fi

echo "🔍 Testing Profile Update Endpoints..."
echo "API_URL: $API_URL"
echo ""

# Test 1: GET current profile
echo "TEST 1️⃣  GET /api/Users/profile/current"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -X GET "$API_URL/Users/profile/current" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$RESPONSE" | grep -q "\"id\""; then
  echo "✅ Successfully fetched current user profile"
  USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "User ID: $USER_ID"
  echo "Response:"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo "❌ Failed to fetch profile"
  echo "Response: $RESPONSE"
fi

echo ""
echo ""

# Test 2: PUT update profile
echo "TEST 2️⃣  PUT /api/Users/profile"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
UPDATE_PAYLOAD='{
  "nomComplet": "Test User Updated",
  "email": "test.updated@example.com",
  "phoneNumber": "+243123456789"
}'

echo "Sending update payload:"
echo "$UPDATE_PAYLOAD" | jq '.'
echo ""

RESPONSE=$(curl -s -X PUT "$API_URL/Users/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_PAYLOAD")

if echo "$RESPONSE" | grep -q "\"id\""; then
  echo "✅ Successfully updated profile!"
  echo "Response:"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo "❌ Failed to update profile"
  echo "Response: $RESPONSE"
fi

echo ""
echo ""
echo "✨ Tests Complete!"
