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

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000
ENTRYPOINT ["dotnet", "SIGAC.API.dll"]
