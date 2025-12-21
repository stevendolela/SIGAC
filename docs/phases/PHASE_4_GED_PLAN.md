# Phase 4 – GED: Modules complémentaires livrés

Ce commit ajoute les modules suivants (backend + frontend) selon l’expression de besoin GED:

- Ressources judiciaires: Profils des juges (JugeProfile)
- Formation continue: Formations + participations
- Notifications internes: CRUD minimal + marque comme lue
- Recherche avancée: Endpoints de recherche Dossiers/Documents (LIKE/ILIKE)
- Calendrier générique: Événements (Audience/Formation/Général)

## Backend (.NET 8)

Entités ajoutées:
- Core/Entities: `JugeProfile`, `Formation`, `FormationParticipation`, `Notification`, `CalendarEvent`

DbContext:
- `ApplicationDbContext` expose les `DbSet<>` et configurations Fluent API

Services/Repositories/Controllers:
- Services: `JugeProfileService`, `FormationService`, `NotificationService`, `CalendarService`, `SearchService`
- Repositories: `JugeProfileRepository`, `FormationRepository`, `NotificationRepository`, `CalendarRepository`
- Controllers: `JugeProfilesController`, `FormationsController`, `NotificationsController`, `CalendarController`, `SearchController`
- AutoMapper: mapping DTOs mis à jour

Endpoints principaux:
- `GET /api/JugeProfiles`, `GET /api/JugeProfiles/me`, `POST/PUT/DELETE` (Admin/President)
- `GET/POST/PUT/DELETE /api/Formations` (Admin/President)
- `POST /api/Formations/{id}/participants` ; `POST /api/Formations/{id}/participants/{userId}/complete`
- `GET /api/Notifications/me?top=50`, `POST /api/Notifications` (Admin/President/Greffier), `POST /api/Notifications/{id}/lu`
- `GET /api/Search/dossiers?q=...`, `GET /api/Search/documents?q=...`
- `GET /api/Calendar?start=...&end=...`, `POST/PUT/DELETE /api/Calendar` (Admin/President/Greffier)

⚠️ Migrations EF Core à exécuter:

```bash
# Depuis sigac-backend
dotnet ef migrations add AddGedModules \
  --project SIGAC.Infrastructure \
  --startup-project SIGAC.API

dotnet ef database update \
  --project SIGAC.Infrastructure \
  --startup-project SIGAC.API
```

## Frontend (React/TS)

Nouveaux types et API clients:
- `src/types/{juge,formation,notification,calendar,search}.ts`
- `src/api/{jugeApi,formationApi,notificationApi,calendarApi,searchApi}.ts`

Nouvelles pages et composants:
- `src/pages/JugeProfilesPage.tsx`
- `src/pages/FormationsPage.tsx`
- `src/pages/CalendarPage.tsx`
- `src/components/common/NotificationsBell.tsx` (icône cloche + dropdown)

Intégration App:
- Onglets ajoutés: Profils Juges, Formations, Calendrier
- Cloche de notifications dans l’en-tête

## Sécurité & Rôles

- Accès d’édition réservé à `Administrateur`, `President` (Formations, Profils) et `Greffier` (Calendrier/Notifications création)
- Lecture pour tous les authentifiés

## Prochaines étapes

- Étendre la recherche vers PostgreSQL FTS (tsvector) pour `Dossiers`/`Documents`
- Liaison stricte Audience → `SalleId` (remplacer `Lieu` texte)
- Exposition des profils juges par jointure User → affichage noms au lieu de `userId`
- Notifications temps-réel (SignalR) et toasts
- UI calendrier plus riche (vue mois/semaine)
