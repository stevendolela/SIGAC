# TAJI - Système de gestion des affaires judiciaires

Projet TAJI pour la Cour Constitutionnelle RDC

## 🎯 Description

Application complète de gestion électronique des dossiers (GED) pour la Cour Constitutionnelle de la République Démocratique du Congo.

### Technologies

- **Backend**: .NET 8, ASP.NET Core, Entity Framework Core, PostgreSQL
- **Frontend**: React 18, TypeScript, Vite
- **UI**: Design moderne avec gradients, glassmorphism, animations

## 🚀 Démarrage Rapide

### Prérequis

- Docker Desktop
- .NET 8 SDK
- Node.js 18+

### 1. Démarrer PostgreSQL

```bash
cd ~/Projects/SIGAC
docker-compose up -d
```

### 2. Démarrer le Backend

```bash
cd sigac-backend
dotnet restore
dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API
dotnet run --project SIGAC.API
```

### 3. Démarrer le Frontend

```bash
cd sigac-frontend
npm install
npm run dev
```

### 4. Accéder à l'Application

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:5210
- **Swagger**: http://localhost:5210/swagger

## 👤 Comptes de Test

- **Admin**: `admin` / `Admin@2024!`
- **Président**: `president.benoit` / `President@2024!`
- **Juge**: `juge.mbala` / `Juge@2024!`

## ✨ Fonctionnalités

- 📊 Dashboard avec KPIs et statistiques
- 📁 Gestion complète des dossiers
- ➕ Création de nouveaux dossiers
- 🔍 Recherche avancée multicritère
- 📅 Calendrier des audiences
- 📤 Upload de documents
- 👥 Gestion des utilisateurs
- 🎨 UI moderne avec design system cohérent

## 🛠️ Commandes Utiles

```bash
# Arrêter PostgreSQL
docker-compose down

# Voir les logs PostgreSQL
docker-compose logs -f postgres

# Redémarrer PostgreSQL
docker-compose restart postgres
```

## 📝 License

Cour Constitutionnelle RDC © 2025
