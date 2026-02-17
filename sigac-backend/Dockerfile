# Multi-stage Docker build for SIGAC API - Simplified for Render
# Build stage: Compile and publish the application
FROM mcr.microsoft.com/dotnet/sdk:8.0.404 AS build

WORKDIR /src

# Copy project files
COPY ["sigac-backend/SIGAC.API/SIGAC.API.csproj", "SIGAC.API/"]
COPY ["sigac-backend/SIGAC.Core/SIGAC.Core.csproj", "SIGAC.Core/"]
COPY ["sigac-backend/SIGAC.Infrastructure/SIGAC.Infrastructure.csproj", "SIGAC.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "SIGAC.API/SIGAC.API.csproj"

# Copy all source code from sigac-backend
COPY sigac-backend/ ./

# Publish the application (not just build)
RUN dotnet publish "SIGAC.API/SIGAC.API.csproj" \
    -c Release \
    -o /app/publish \
    --no-restore

# Runtime stage: Execute the published binary
FROM mcr.microsoft.com/dotnet/sdk:8.0.404 AS runtime

# Keep SDK for EF Core CLI tools (for migration support)
WORKDIR /app

# Copy published binaries from build stage
COPY --from=build /app/publish .

# Copy source code for EF Core migrations
COPY sigac-backend/ ./src/

# Copy entrypoint script
COPY sigac-backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create persistent data directories
RUN mkdir -p /app/data/uploads /app/logs

# Environment configuration for production
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://0.0.0.0:10000

# Expose API port
EXPOSE 10000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:10000/health || exit 1

# Start application with entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
