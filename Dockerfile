FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY sigac-backend/SIGAC.Core/SIGAC.Core.csproj SIGAC.Core/
COPY sigac-backend/SIGAC.Infrastructure/SIGAC.Infrastructure.csproj SIGAC.Infrastructure/
COPY sigac-backend/SIGAC.API/SIGAC.API.csproj SIGAC.API/
RUN cd SIGAC.Core && dotnet restore
RUN cd SIGAC.Infrastructure && dotnet restore
RUN cd SIGAC.API && dotnet restore
COPY sigac-backend/ ./
RUN cd SIGAC.API && dotnet build -c Release --no-restore
RUN cd SIGAC.API && dotnet publish -c Release -o /app/publish

# Runtime image with SDK included for EF Core migrations
FROM mcr.microsoft.com/dotnet/sdk:8.0
WORKDIR /app

# Copy published application
COPY --from=build /app/publish .

# Copy entire sigac-backend directory with all source + .csproj files for EF migrations
COPY sigac-backend/ ./sigac-backend/

# Copy and make startup script executable
COPY sigac-backend/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["./entrypoint.sh"]
