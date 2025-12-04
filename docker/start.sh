#!/bin/sh
# Render startup script - use PORT environment variable
PORT=${PORT:-10000}
export ASPNETCORE_URLS="http://0.0.0.0:${PORT}"
echo "Starting SIGAC API on port ${PORT}..."
exec dotnet SIGAC.API.dll
