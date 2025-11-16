# SIGAC - Installation sur macOS

## ✅ Installation Terminée !

Votre environnement SIGAC est prêt. Voici les prochaines étapes :

### 1. Copier le Code Source

Vous devez maintenant copier le code source depuis les artefacts Claude dans les fichiers appropriés :

- Backend: Copier dans `sigac-backend/`
- Frontend: Copier dans `sigac-frontend/`

### 2. Démarrer PostgreSQL

```bash
cd ~/Projects/SIGAC
docker-compose up -d
```

### 3. Configurer le Backend

```bash
cd sigac-backend

# Créer les projets .NET
dotnet new webapi -n SIGAC.API -o SIGAC.API
dotnet new classlib -n SIGAC.Core -o SIGAC.Core
dotnet new classlib -n SIGAC.Infrastructure -o SIGAC.Infrastructure

# Créer la solution
dotnet new sln -n SIGAC
dotnet sln add SIGAC.API/SIGAC.API.csproj
dotnet sln add SIGAC.Core/SIGAC.Core.csproj
dotnet sln add SIGAC.Infrastructure/SIGAC.Infrastructure.csproj

# Après avoir copié tout le code:
dotnet restore
dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API
dotnet run --project SIGAC.API
```

### 4. Configurer le Frontend

```bash
cd sigac-frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

### 5. Accéder à l'Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Swagger: http://localhost:5000/swagger

### Comptes de Test

- Admin: `admin` / `Admin@2024!`
- Président: `president.benoit` / `President@2024!`
- Juge: `juge.mbala` / `Juge@2024!`

## Commandes Utiles

```bash
# Arrêter PostgreSQL
docker-compose down

# Voir les logs PostgreSQL
docker-compose logs -f postgres

# Redémarrer PostgreSQL
docker-compose restart postgres
```
