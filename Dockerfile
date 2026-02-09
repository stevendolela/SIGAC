# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY sigac-backend/SIGAC.Core/SIGAC.Core.csproj SIGAC.Core/
COPY sigac-backend/SIGAC.Infrastructure/SIGAC.Infrastructure.csproj SIGAC.Infrastructure/
COPY sigac-backend/SIGAC.API/SIGAC.API.csproj SIGAC.API/

# Restore dependencies
RUN cd SIGAC.Core && dotnet restore
RUN cd SIGAC.Infrastructure && dotnet restore
RUN cd SIGAC.API && dotnet restore

# Copy source code
COPY sigac-backend/ ./

# Build
RUN cd SIGAC.API && dotnet build -c Release --no-restore

# Publish
RUN cd SIGAC.API && dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Copy published app
COPY --from=build /app/publish .

# Set environment
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:10000/api/health || exit 1

# Run app
EXPOSE 10000
ENTRYPOINT ["dotnet", "SIGAC.API.dll"]
