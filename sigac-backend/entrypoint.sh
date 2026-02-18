#!/bin/bash

echo "=========================================="
echo "SIGAC API - Starting..."
echo "=========================================="

cd /app

# Brief wait for any socket cleanup
sleep 2

# Start API directly
echo "[INFO] Launching SIGAC API on port 10000..."
exec dotnet SIGAC.API.dll


