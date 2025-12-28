# SIGAC (Taajii) - Plateforme GED Universelle

**Système Intelligent de Gestion Administrative et Collaborative**

Plateforme moderne de gestion électronique des documents (GED) et des workflows métiers, adaptable à tous les secteurs d'activité.

## 🎯 Description

SIGAC est une solution complète de gestion documentaire et de workflows collaboratifs conçue pour digitaliser les processus métiers de toute organisation, quelle que soit sa taille ou son secteur.

### 🌟 Points Clés

- ✅ **Multi-secteurs** : Juridique, Santé, Administration, Entreprises, etc.
- ✅ **Workflows personnalisables** : Adaptés à vos processus métiers
- ✅ **Multi-tenant** : Gestion de plusieurs entités/workspaces
- ✅ **Collaboration** : Chat intégré, équipes, notifications temps réel
- ✅ **Sécurité** : Authentification robuste, traçabilité complète, conformité RGPD
- ✅ **Analytics** : Tableaux de bord et rapports configurables

### 💼 Secteurs d'Application

🏛️ **Juridique** : Cabinets d'avocats, tribunaux, cours, notaires  
🏥 **Santé** : Hôpitaux, cliniques, cabinets médicaux  
🏢 **Entreprises** : PME, grandes entreprises, groupes  
🏛️ **Administration** : Services publics, collectivités locales  
🎓 **Éducation** : Universités, écoles, centres de formation  
🏗️ **Construction** : Bureaux d'études, promoteurs immobiliers  

### Technologies

- **Backend**: .NET 8, ASP.NET Core Web API, Entity Framework Core, PostgreSQL
- **Frontend**: React 18, TypeScript, Vite, Zustand
- **UI**: Design moderne avec Material UI, gradients, glassmorphism, animations
- **Déploiement**: Vercel (frontend), Render (backend + database)

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
- **Manager**: `president.benoit` / `President@2024!`
- **Collaborateur**: `juge.mbala` / `Juge@2024!`

## ✨ Fonctionnalités Principales

### 📂 Gestion Documentaire
- Upload et stockage sécurisé de tous types de documents
- Versioning automatique et historique complet
- Recherche full-text et filtres avancés
- Tags, catégories et organisation personnalisables
- Prévisualisation en ligne, OCR automatique

### 🔄 Workflows Métiers
- Workflows configurables selon vos processus
- Statuts personnalisables (Nouveau → En cours → Validé → Archivé)
- Niveaux de priorité (Normale, Haute, Critique)
- Affectation automatique ou manuelle
- Notifications et alertes intelligentes

### 🏢 Multi-tenant & Workspaces
- Gestion de plusieurs organisations/entités
- Isolation complète des données par workspace
- Quotas configurables (stockage, utilisateurs)
- Personnalisation (logo, branding, couleurs)
- Facturation séparée (mode SaaS)

### 👥 Collaboration
- Chat 1-to-1 et groupes de discussion
- Équipes et rôles personnalisables
- Notifications temps réel
- Historique de communication
- Pièces jointes dans les conversations

### 📅 Calendrier & Événements
- Planification d'événements/réunions/audiences
- Gestion des salles et ressources
- Prévention de conflits
- Notifications automatiques aux participants

### 📊 Analytics & Reporting
- Tableaux de bord configurables
- KPI personnalisés par métier
- Graphiques interactifs
- Export Excel/PDF
- Rapports automatisés

### 🔒 Sécurité & Conformité
- Authentification robuste + 2FA optionnel
- Traçabilité complète (audit logs)
- Chiffrement des données
- Conformité RGPD
- Sauvegardes automatiques

### 👤 Gestion des Utilisateurs
- Rôles et permissions granulaires
- Hiérarchies d'accès configurables
- SSO compatible
- Gestion des sessions
- Matrice de compétences

## 🛠️ Commandes Utiles

```bash
# Arrêter PostgreSQL
docker-compose down

# Voir les logs PostgreSQL
docker-compose logs -f postgres

# Redémarrer PostgreSQL
docker-compose restart postgres
```

## 🌐 Environnements

### Production
- **Frontend**: https://taajii.fr
- **Backend API**: https://sigac-api.onrender.com/api
- **Swagger**: https://sigac-api.onrender.com/swagger

### Développement Local
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:5210
- **Swagger**: http://localhost:5210/swagger
- **PostgreSQL**: localhost:5434

## 📚 Documentation

- [Présentation SIGAC](docs/PRESENTATION_SIGAC.md) - Vue d'ensemble de la plateforme
- [Roadmap](ROADMAP.md) - Évolutions futures
- [Guides utilisateur](docs/guides/) - Documentation métier

## 📞 Contact & Support

- **Site web** : https://taajii.fr
- **Email** : contact@taajii.fr
- **Support** : support@taajii.fr
- **Démo** : demo@taajii.fr

## 📝 License

SIGAC/Taajii © 2025 - Plateforme GED Universelle
