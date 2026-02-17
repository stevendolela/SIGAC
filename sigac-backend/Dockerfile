# Multi-stage Docker build for SIGAC API
# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0.404 AS builder

WORKDIR /src

# Copy project files
COPY ["SIGAC.API/SIGAC.API.csproj", "SIGAC.API/"]
COPY ["SIGAC.Core/SIGAC.Core.csproj", "SIGAC.Core/"]
COPY ["SIGAC.Infrastructure/SIGAC.Infrastructure.csproj", "SIGAC.Infrastructure/"]

# Restore NuGet packages
RUN dotnet restore "SIGAC.API/SIGAC.API.csproj"

# Copy source code
COPY . .

# Build
RUN dotnet build "SIGAC.API/SIGAC.API.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM mcr.microsoft.com/dotnet/sdk:8.0.404 AS publish

WORKDIR /src

# Copy project files
COPY ["SIGAC.API/SIGAC.API.csproj", "SIGAC.API/"]
COPY ["SIGAC.Core/SIGAC.Core.csproj", "SIGAC.Core/"]
COPY ["SIGAC.Infrastructure/SIGAC.Infrastructure.csproj", "SIGAC.Infrastructure/"]

# Restore
RUN dotnet restore "SIGAC.API/SIGAC.API.csproj"

# Copy all source
COPY . .

# Publish
RUN dotnet publish "SIGAC.API/SIGAC.API.csproj" -c Release -o /app/publish

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0.2

# Install EF Core CLI tools in runtime image
RUN apt-get update && apt-get install -y --no-install-recommends dotnet-ef=8.* \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy published application from publish stage
COPY --from=publish /app/publish .

# Copy migration projects for EF Core operations
COPY --from=publish /src/SIGAC.Infrastructure /app/SIGAC.Infrastructure
COPY --from=publish /src/SIGAC.Core /app/SIGAC.Core
COPY --from=publish /src/SIGAC.API /app/SIGAC.API

# Copy entrypoint script
COPY sigac-backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create data directories
RUN mkdir -p /app/data/uploads && mkdir -p /app/logs

# Default environment
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://0.0.0.0:10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:10000/health || exit 1

# Expose port
EXPOSE 10000

# Run entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
