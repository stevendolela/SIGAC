#!/bin/bash
set -e

echo "=========================================="
echo "SIGAC API - Applying EF Core Migrations"
echo "=========================================="

cd /app

echo "Executing: dotnet ef database update"
echo "  Project: sigac-backend/SIGAC.Infrastructure"
echo "  Startup: sigac-backend/SIGAC.API"
echo ""

# Apply migrations with error handling
dotnet ef database update \
    --project sigac-backend/SIGAC.Infrastructure \
    --startup-project sigac-backend/SIGAC.API \
    --no-build \
    2>&1 || {
        EXIT_CODE=$?
        echo ""
        echo "[WARNING] Migration returned exit code: $EXIT_CODE"
        echo "[INFO] Proceeding with API startup..."
        echo ""
    }

echo ""
echo "Step 2: Starting SIGAC API Server..."

echo ""
echo "=========================================="
echo "SIGAC API - Starting Server"
echo "=========================================="
echo "Port: http://0.0.0.0:10000"
echo ""

# Start the ASP.NET Core application
exec dotnet SIGAC.API.dll
