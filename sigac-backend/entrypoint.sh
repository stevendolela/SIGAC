#!/bin/bash

echo "=========================================="
echo "SIGAC API - Container Initialization"  
echo "=========================================="

cd /app

# Step 1: Apply migrations (non-fatal if they fail)
echo ""
echo "Step 1: Applying EF Core Migrations..."
echo "=========================================="

timeout 60 dotnet ef database update \
    --project /src/SIGAC.Infrastructure \
    --startup-project /src/SIGAC.API \
    --no-build \
    2>&1 || {
        EXIT_CODE=$?
        if [ $EXIT_CODE -ne 124 ]; then
            echo "[WARNING] Migration returned exit code: $EXIT_CODE"
        fi
        echo "[INFO] Proceeding with API startup..."
    }

# Step 2: CRITICAL - Wait for TCP TIME_WAIT socket state to clear
# Linux keeps sockets in TIME_WAIT for 30-60 seconds after close
# We need to wait LONGER than that to ensure the port is free
echo ""
echo "Step 2: Waiting for socket cleanup (TCP TIME_WAIT)..."
echo "=========================================="
echo "Waiting 45 seconds to ensure port 10000 is fully released..."
echo "(TCP TIME_WAIT on Linux typically lasts 30-60 seconds)"
sleep 45

# Step 3: Verify port is free before trying to bind
echo ""
echo "Step 3: Checking port availability..."
echo "=========================================="
API_PORT=10000

# Use netstat if available, otherwise just proceed
if command -v netstat &> /dev/null; then
    if netstat -tuln 2>/dev/null | grep -q ":$API_PORT "; then
        echo "[WARNING] Port $API_PORT appears to still be in use!"
        echo "[INFO] Will attempt to start anyway (may retry)..."
    else
        echo "[INFO] Port $API_PORT is free - proceeding..."
    fi
fi

# Step 4: Start API with final retry (only if first attempt fails)
echo ""
echo "Step 4: Starting SIGAC API Server..."
echo "=========================================="

# First attempt - should succeed if TCP TIME_WAIT cleared
if dotnet SIGAC.API.dll; then
    echo "[SUCCESS] API started successfully!"
    exit 0
fi

# If first attempt fails, wait longer and retry once
echo ""
echo "[FAIL] First attempt failed. Waiting 30 more seconds..."
sleep 30

if dotnet SIGAC.API.dll; then
    echo "[SUCCESS] API started on retry!"
    exit 0
fi

# Both attempts failed
echo ""
echo "[FATAL] Failed to start API after all attempts"
echo "=========================================="
exit 1

