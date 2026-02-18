#!/bin/bash
set -e

echo "=========================================="
echo "SIGAC API - Container Initialization"  
echo "==========================================" 

cd /app

# CRITICAL: Kill any existing dotnet processes holding the port
echo ""
echo "Step 0: Killing any zombie processes on port 10000..."
echo "=========================================="
killall -9 dotnet 2>/dev/null || true
fuser -k 10000/tcp 2>/dev/null || true
sleep 2
echo "[OK] Cleanup complete"

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

# Step 2: Quick port check (no long wait - we already killed processes)
echo ""
echo "Step 2: Verifying port is free..."
echo "=========================================="
if lsof -i :10000 2>/dev/null; then
    echo "[WARNING] Port 10000 still in use - force killing..."
    fuser -k 10000/tcp 2>/dev/null || true
    sleep 5
fi
echo "[OK] Port 10000 is ready"

# Step 3: Start API (exec replaces shell process - proper signal handling)
echo ""
echo "Step 3: Starting SIGAC API Server..."
echo "=========================================="
echo "[INFO] Listening on http://0.0.0.0:10000"
echo ""

# Use exec to replace shell - ensures clean shutdown on SIGTERM
exec dotnet SIGAC.API.dll

