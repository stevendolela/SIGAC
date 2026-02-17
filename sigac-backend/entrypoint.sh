#!/bin/bash

# Script d'entrée pour conteneur Render
# Applique les migrations EF Core puis démarre l'API

set -e

echo "=========================================="
echo "Applying EF Core migrations..."
echo "=========================================="

cd /app

# Apply migrations
dotnet ef database update \
    --project SIGAC.Infrastructure \
    --startup-project SIGAC.API \
    --no-build \
    || echo "Migration failed or already applied - continuing anyway"

echo ""
echo "=========================================="
echo "Starting SIGAC API..."  
echo "=========================================="

# Start the application
exec dotnet SIGAC.API.dll
