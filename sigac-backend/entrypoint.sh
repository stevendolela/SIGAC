#!/bin/bash
set -e

echo "=========================================="
echo "SIGAC API - Container Initialization"
echo "=========================================="

cd /app

# Step 1: Apply migrations (non-fatal if they fail)
echo ""
echo "Step 1: Applying EF Core Migrations..."
echo "=========================================="

dotnet ef database update \
    --project /src/SIGAC.Infrastructure \
    --startup-project /src/SIGAC.API \
    --no-build \
    2>&1 || {
        EXIT_CODE=$?
        echo ""
        echo "[WARNING] Migration returned exit code: $EXIT_CODE"
        echo "[INFO] Proceeding with API startup anyway..."
        echo ""
    }

# Step 2: Wait for previous socket to fully release from TIME_WAIT state
# Linux TCP TIME_WAIT is typically 30-60 seconds, but we'll be conservative
echo ""
echo "Step 2: Waiting for socket cleanup..."
echo "=========================================="
echo "Waiting 10 seconds to ensure port 10000 is fully released..."
sleep 10

# Step 3: Start API with retry logic
echo ""
echo "Step 3: Starting SIGAC API Server..."
echo "=========================================="

MAX_RETRIES=5
RETRY_COUNT=0
API_PORT=10000

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    ATTEMPT=$((RETRY_COUNT + 1))
    echo ""
    echo "[Attempt $ATTEMPT/$MAX_RETRIES] Starting API on port $API_PORT..."
    
    # Try to start the API
    if dotnet SIGAC.API.dll; then
        # If it starts successfully, exit cleanly
        echo "[SUCCESS] API started successfully!"
        exit 0
    fi
    
    # API failed to start
    RETRY_COUNT=$((RETRY_COUNT + 1))
    
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        # Calculate exponential backoff: 10s, 15s, 20s, 25s, 30s
        SLEEP_TIME=$((10 + RETRY_COUNT * 5))
        echo "[FAIL] API startup failed (exit code: $?)"
        echo "[RETRY] Waiting $SLEEP_TIME seconds before retry..."
        sleep $SLEEP_TIME
    fi
done

# All retries exhausted
echo ""
echo "[FATAL] Failed to start API after $MAX_RETRIES attempts"
echo "=========================================="
exit 1
