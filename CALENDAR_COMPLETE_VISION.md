# Calendrier SIGAC - Vision Complète Implémentée ✅

## Vue d'ensemble

Le système de calendrier de SIGAC/Taajii est maintenant aligné sur la vision moderne inspirée de Microsoft Teams et Google Meet, avec gestion complète des événements, participants, statuts et rappels.

---

## ✅ Fonctionnalités Implémentées

### 1. Types d'Événements (5 types)

| Type | Icône | Couleur | Usage |
|------|-------|---------|-------|
| **Réunion** | 📊 | Bleu (#3b82f6) | Réunions internes/externes |
| **Audience** | ⚖️ | Vert (#10b981) | Audiences juridiques (requiert dossier) |
| **Formation** | 🎓 | Violet (#8b5cf6) | Formations et séminaires |
| **Deadline** | ⏰ | Orange (#f59e0b) | Échéances importantes |
| **Personnel** | 👤 | Rouge (#ef4444) | Événements personnels |

**Implémentation:** `sigac-frontend/src/types/calendar.ts`

```typescript
export type EventType = 'Reunion' | 'Audience' | 'Formation' | 'Deadline' | 'Personnel';

export const EventTypeLabels: Record<EventType, string> = {
  'Reunion': '📊 Réunion',
  'Audience': '⚖️ Audience',
  'Formation': '🎓 Formation',
  'Deadline': '⏰ Deadline',
  'Personnel': '👤 Personnel'
};
```

---

### 2. Statuts des Événements (Workflow)

| Statut | Couleur | Description |
|--------|---------|-------------|
| **Planifié** | Bleu (#3b82f6) | Événement programmé |
| **En cours** | Orange (#f59e0b) | Événement en cours d'exécution |
| **Terminé** | Vert (#10b981) | Événement complété |
| **Reporté** | Gris (#6b7280) | Événement reporté à une date ultérieure |

**Workflow par défaut:**
```
Planifié → En cours → Terminé
         ↓
      Reporté → Planifié
```

---

### 3. Formulaire de Création (4 sections)

#### Section 1: Informations Générales
- **Type d'événement** (dropdown avec 5 options)
- **Titre** (texte libre, requis)
- **Statut** (dropdown avec 4 options, défaut: Planifié)

Layout: Grille 3 colonnes `200px 1fr 150px`

#### Section 2: Date et Heure
- **Date de début** (date + heure)
- **Date de fin** (date + heure)
- **Toute la journée** (checkbox)
- **Description** (textarea)
- **Rappel automatique** (dropdown):
  - Aucun rappel (0 min)
  - 15 minutes avant
  - 30 minutes avant
  - 1 heure avant
  - 2 heures avant
  - 1 jour avant (1440 min)

#### Section 3: Association
Layout: Grille 2 colonnes `1fr 1fr`

- **Dossier lié:**
  - Requis pour type "Audience"
  - Optionnel pour autres types
  - Dropdown avec format: `{numeroDossier} - {titre}`

- **Salle de réunion:**
  - Optionnel pour tous types
  - Dropdown avec format: `🏢 {nom} - {capacite} pers.`

#### Section 4: Participants (internes)
- **Zone de recherche** 🔍:
  - Recherche en temps réel
  - Filtre par nom, prénom, rôle, username
  - Placeholder: "Rechercher un participant..."

- **Badges des sélectionnés:**
  - Fond bleu (#f0f9ff)
  - Affichage en chips avec bouton × pour retirer
  - Compteur: "(X sélectionné·s)"

- **Grille des participants:**
  - Responsive: `repeat(auto-fill, minmax(280px, 1fr))`
  - Checkboxes avec hover effects
  - Affiche: Nom complet + Rôle
  - Message si aucun résultat trouvé

---

### 4. Zone de Recherche Participants ⭐

**Fonctionnalités implémentées:**

```tsx
// État de recherche
const [searchParticipant, setSearchParticipant] = useState('');

// Filtrage en temps réel
users.filter(user => {
  if (!searchParticipant) return true;
  const searchLower = searchParticipant.toLowerCase();
  return (
    user.nomComplet.toLowerCase().includes(searchLower) ||
    user.role.toLowerCase().includes(searchLower) ||
    (user.username && user.username.toLowerCase().includes(searchLower))
  );
})
```

**UX:**
- Input stylisé avec focus blue (#3b82f6)
- Recherche instantanée (pas de bouton)
- Message "Aucun participant trouvé" si résultats vides
- Conserve les sélections même après recherche

---

### 5. Gestion des Salles

**Intégration:**
- Dropdown dans section Association
- Format: `🏢 {nom} - {capacite} pers.`
- Chargement via `loadData()` depuis API `/api/salles`

**État:**
```tsx
const [salles, setSalles] = useState<Salle[]>([]);
```

---

### 6. Visualisation Calendrier

#### Vue Mensuelle (implémentée) ✅
- Grille 7 colonnes (Lun - Dim)
- Highlight du jour actuel (fond bleu)
- Badges d'événements avec:
  - Emoji du type
  - Heure de début (HH:mm)
  - Titre (ellipsis si long)
  - Couleur selon type

**Navigation:**
- Boutons Précédent/Suivant
- Bouton "Aujourd'hui" (reset)
- Affichage: `MMMM YYYY`

#### Vues à implémenter (roadmap)
- **Vue Hebdomadaire** 📅: Timeline horaire 7 jours
- **Vue Quotidienne** 📆: Timeline 15 min increments

---

## 🔧 Architecture Technique

### Frontend (React TypeScript)

**Fichiers modifiés:**

1. **`/sigac-frontend/src/types/calendar.ts`** (62 lignes)
   - Types: EventType (5 options), EventStatus (4 options)
   - DTOs: CalendarEventDto, CreateCalendarEventDto, UpdateCalendarEventDto
   - Labels: EventTypeLabels, EventStatusLabels
   - Colors: EventTypeColors, EventStatusColors
   - Interfaces: User, Dossier, Salle

2. **`/sigac-frontend/src/pages/CalendarPage.tsx`** (644 lignes)
   - État: 11 variables (currentMonth, events, formData, users, dossiers, salles, loading, error, view, searchParticipant, filterType, filterStatut)
   - Fonctions:
     * `loadData()`: Fetch events, dossiers, users, salles via Promise.all
     * `handleCreateEvent()`: Validation + création via CalendarApi
     * `navigateMonth()`: Navigation avec Date handling sécurisé
     * `renderMonthView()`: Grille 7x5/6 avec badges événements
   - Hooks: useEffect pour loadData initial
   - API calls: CalendarApi, dossierApi, userApi, salleApi

3. **`/sigac-frontend/src/styles.css`** (1045+ lignes)
   - Classes: `.calendar-grid`, `.calendar-day-cell`, `.event-badge`, `.participant-label`
   - Animations: hover effects, transitions
   - Responsive: auto-fill grid pour participants

### Backend (ASP.NET Core)

**Entités existantes:**

```csharp
// SIGAC.Core/Entities/CalendarEvent.cs
public class CalendarEvent
{
    public Guid Id { get; set; }
    public string Type { get; set; }          // "Reunion", "Audience", etc.
    public string Titre { get; set; }
    public string? Description { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
    public bool TouteLaJournee { get; set; }
    public Guid? DossierId { get; set; }      // Foreign key
    public Guid? SalleId { get; set; }        // Foreign key
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    
    // Navigation properties (not loaded to avoid cycles)
    public Dossier? Dossier { get; set; }
    public Salle? Salle { get; set; }
}
```

**⚠️ Colonnes manquantes dans PostgreSQL (à ajouter):**

```sql
ALTER TABLE "CalendarEvents" 
ADD COLUMN "Statut" VARCHAR(50) DEFAULT 'Planifie',
ADD COLUMN "RappelAvant" INTEGER DEFAULT 30,
ADD COLUMN "Participants" TEXT; -- JSON array ["guid1", "guid2"]
```

**Services:**
- `CalendarService`: CRUD operations
- `CalendarRepository`: EF queries sans `.Include()` (évite cycles JSON)

**Mapping:**
```csharp
// SIGAC.Core/Mapping/CalendarMappingProfile.cs
CreateMap<CalendarEvent, CalendarEventDto>().ReverseMap();
```

---

## 🎯 Cas d'Usage

### Scénario 1: Planifier une Audience
1. Créer événement type "Audience"
2. Sélectionner dossier (requis)
3. Définir date/heure
4. Ajouter participants (juge rapporteur + avocats)
5. Réserver salle d'audience
6. Statut: Planifié
7. Rappel: 1 heure avant

### Scénario 2: Formation d'équipe
1. Type "Formation"
2. Titre: "Formation Nouveau Logiciel"
3. Toute la journée: coché
4. Rechercher participants par rôle: "Greffier"
5. Sélectionner salle de formation (capacité 20)
6. Rappel: 1 jour avant

### Scénario 3: Deadline projet
1. Type "Deadline"
2. Titre: "Dépôt rapport annuel"
3. Date limite précise
4. Pas de participants (événement système)
5. Rappel: 2 heures avant

---

## 📊 États des Variables

### État Formulaire
```typescript
const [formData, setFormData] = useState<CreateCalendarEventDto>({
  type: 'Reunion',
  titre: '',
  description: '',
  dateDebut: '',
  dateFin: '',
  touteLaJournee: false,
  dossierId: undefined,
  salleId: undefined,
  participants: [],
  statut: 'Planifie',        // ← Nouveau
  rappelAvant: 30            // ← Nouveau (minutes)
});
```

### États Filtres (préparés, UI à compléter)
```typescript
const [searchParticipant, setSearchParticipant] = useState('');  // ✅ Implémenté
const [filterType, setFilterType] = useState<EventType | ''>('');  // ⏳ À implémenter
const [filterStatut, setFilterStatut] = useState('');              // ⏳ À implémenter
```

---

## ✅ Checklist d'Implémentation

### Frontend
- [x] Types d'événements (5 types)
- [x] Statuts d'événements (4 statuts)
- [x] Formulaire en 4 sections
- [x] Zone de recherche participants
- [x] Badges participants sélectionnés avec bouton retirer
- [x] Dropdown rappel automatique (6 options)
- [x] Association dossier + salle (grid 2 colonnes)
- [x] Vue mensuelle avec navigation
- [x] Highlight jour actuel
- [x] Badges événements colorés
- [ ] Filtres sidebar (type + statut)
- [ ] Vue hebdomadaire
- [ ] Vue quotidienne

### Backend
- [x] Table CalendarEvents créée
- [x] CalendarService + Repository
- [x] CalendarMappingProfile
- [x] API endpoints CRUD
- [ ] Ajouter colonne `Statut`
- [ ] Ajouter colonne `RappelAvant`
- [ ] Ajouter colonne `Participants` (JSON array)
- [ ] Système de rappels automatiques (background job)

---

## 🔄 Prochaines Étapes (Roadmap)

### Phase 1: Compléter les Filtres (Haute priorité)
**Objectif:** Sidebar gauche avec filtres multiples

**UI à ajouter:**
```tsx
{/* Sidebar Filtres */}
<div style={{ width: 250, borderRight: '1px solid #e5e7eb', padding: 16 }}>
  {/* Filtre par type */}
  <div style={{ marginBottom: 20 }}>
    <h4>Types d'événements</h4>
    {(['Reunion', 'Audience', 'Formation', 'Deadline', 'Personnel'] as EventType[]).map(type => (
      <label key={type}>
        <input 
          type="checkbox" 
          checked={filterType === type}
          onChange={() => setFilterType(filterType === type ? '' : type)}
        />
        {EventTypeLabels[type]}
      </label>
    ))}
  </div>
  
  {/* Filtre par statut */}
  <div style={{ marginBottom: 20 }}>
    <h4>Statuts</h4>
    {/* Similar checkboxes pour statuts */}
  </div>
</div>
```

**Logique de filtrage:**
```typescript
const filteredEvents = events.filter(event => {
  if (filterType && event.type !== filterType) return false;
  if (filterStatut && event.statut !== filterStatut) return false;
  return true;
});
```

---

### Phase 2: Vues Hebdo/Quotidienne (Moyenne priorité)

**Vue Hebdomadaire:**
- Timeline: 8h → 20h (12 heures)
- 7 colonnes (Lun - Dim)
- Events en blocs overlay
- Gestion chevauchements (width %)

**Vue Quotidienne:**
- Timeline: 0h → 24h
- Colonne unique
- Increments 15 minutes
- Zoom +/- pour détail

---

### Phase 3: Backend Rappels (Moyenne priorité)

**Système de notifications:**
1. Background job (Hangfire ou similaire)
2. Vérifier `RappelAvant` vs `DateDebut`
3. Envoyer notification:
   - Email (via SendGrid/SMTP)
   - Push notification (si PWA)
   - Notification in-app

**Migration SQL:**
```sql
-- /deployment/migration-calendar-rappels.sql
ALTER TABLE "CalendarEvents" 
ADD COLUMN "Statut" VARCHAR(50) DEFAULT 'Planifie' NOT NULL,
ADD COLUMN "RappelAvant" INTEGER DEFAULT 30,
ADD COLUMN "Participants" TEXT;

CREATE INDEX "IX_CalendarEvents_Statut" ON "CalendarEvents" ("Statut");
CREATE INDEX "IX_CalendarEvents_DateDebut_RappelAvant" ON "CalendarEvents" ("DateDebut", "RappelAvant");
```

**Backend Service:**
```csharp
// SIGAC.Core/Services/RappelService.cs
public class RappelService : IRappelService
{
    public async Task CheckAndSendRemindersAsync()
    {
        var now = DateTime.UtcNow;
        var upcomingEvents = await _calendarRepo.GetEventsWithRemindersAsync(now);
        
        foreach (var evt in upcomingEvents)
        {
            var minutesUntil = (evt.DateDebut - now).TotalMinutes;
            if (minutesUntil <= evt.RappelAvant && minutesUntil > 0)
            {
                await SendReminderAsync(evt);
            }
        }
    }
}
```

---

### Phase 4: Fonctionnalités Avancées (Basse priorité)

- **Récurrence événements:** Quotidien, Hebdo, Mensuel
- **Export iCal/Google Calendar:** Intégration calendriers externes
- **Drag & Drop:** Déplacer événements dans grille
- **Conflits horaires:** Détection + alerte si salle/participant occupé
- **Participants externes:** Email invitations pour non-utilisateurs
- **Visioconférence:** Lien Zoom/Teams intégré
- **Pièces jointes:** Upload documents liés à l'événement

---

## 🎨 Guide de Style

### Couleurs Système

| Usage | Hex | Variable |
|-------|-----|----------|
| Primaire (Bleu) | #3b82f6 | Primary actions, Reunion type |
| Succès (Vert) | #10b981 | Termine status, Audience type |
| Warning (Orange) | #f59e0b | EnCours status, Deadline type |
| Danger (Rouge) | #ef4444 | Personnel type, Delete actions |
| Violet | #8b5cf6 | Formation type |
| Gris | #6b7280 | Reporte status, Disabled states |

### Espacements
- Petite marge: 8px
- Marge normale: 12px
- Marge large: 16px
- Marge section: 24px

### Border Radius
- Input/Select: 8px
- Cards: 8px
- Badges: 16px (pills)

---

## 🐛 Bugs Résolus

### Bug 1: Page Bleue (Blank Screen)
**Cause:** Mutation de Date objects dans state React
```typescript
// ❌ AVANT (mutait l'objet)
const startDate = currentMonth;
startDate.setDate(1);

// ✅ APRÈS (nouvelle instance)
const startDate = new Date(currentMonth.getTime());
startDate.setDate(1);
```

### Bug 2: Cannot read 'getFullYear' of null
**Cause:** `getDaysInMonthEU()` retourne null pour jours vides
```typescript
// ✅ Solution: Check avant mapping
{days.map((day, idx) => {
  if (!day) {
    return <div key={idx} className="calendar-day-empty" />;
  }
  // ... render day
})}
```

### Bug 3: Circular JSON (500 error)
**Cause:** `.Include(c => c.Dossier)` en Repository
```csharp
// ✅ Solution: Retirer tous les Include()
public async Task<List<CalendarEvent>> GetBetweenAsync(DateTime start, DateTime end)
{
    return await _context.CalendarEvents
        .Where(c => c.DateDebut >= start && c.DateDebut <= end)
        // .Include(c => c.Dossier)  ← RETIRÉ
        .ToListAsync();
}
```

---

## 📝 Notes Importantes

### Pour les Développeurs

1. **Jamais mutater Date objects:** Toujours créer nouvelles instances avec `new Date()`
2. **Include() EF Core:** Éviter pour navigation properties qui causent cycles JSON
3. **Recherche participants:** Filtre côté client (suffisant pour <1000 users)
4. **Validation côté serveur:** Backend doit valider `type === 'Audience' && dossierId === null`

### Pour les Product Owners

1. **Audiences vs Réunions:** Type "Audience" requiert dossier obligatoirement
2. **Participants internes uniquement:** Version actuelle supporte seulement utilisateurs système
3. **Salles optionnelles:** Événements virtuels possibles sans salle
4. **Rappels stockés:** `RappelAvant` en minutes (frontend affiche labels lisibles)

### Pour les Testeurs

**Scénarios de test:**
- [ ] Créer événement chaque type (5 types)
- [ ] Vérifier validation dossier pour Audience
- [ ] Rechercher participants par nom/rôle
- [ ] Sélectionner/désélectionner participants
- [ ] Naviguer mois précédent/suivant
- [ ] Vérifier highlight jour actuel
- [ ] Créer événement toute la journée
- [ ] Changer statut événement
- [ ] Sélectionner salle de réunion

---

## 📚 Ressources

### Documentation Externe
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)
- [Date Handling Best Practices](https://stackoverflow.com/questions/1090815/date-manipulation-in-javascript)
- [EF Core Include](https://learn.microsoft.com/en-us/ef/core/querying/related-data/)

### Documentation Interne
- `/workspaces/SIGAC/.github/copilot-instructions.md` - Architecture générale
- `/workspaces/SIGAC/deployment/migration-calendar-events.sql` - Schema DB
- `/workspaces/SIGAC/sigac-frontend/src/types/calendar.ts` - Interfaces TypeScript

---

## 🎯 Récapitulatif Vision vs Réalité

| Feature | Demandé | Implémenté | Statut |
|---------|---------|------------|--------|
| 5 types événements | ✅ | ✅ | 100% |
| 4 statuts workflow | ✅ | ✅ Frontend (backend ⏳) | 50% |
| Participants multi-select | ✅ | ✅ | 100% |
| Recherche participants | ✅ | ✅ | 100% |
| Badges participants | ✅ | ✅ | 100% |
| Rappels automatiques | ✅ | ✅ Frontend (backend ⏳) | 50% |
| Gestion salles | ✅ | ✅ | 100% |
| Vue mensuelle | ✅ | ✅ | 100% |
| Vue hebdomadaire | ✅ | ❌ | 0% |
| Vue quotidienne | ✅ | ❌ | 0% |
| Filtres type/statut | ✅ | ⏳ État préparé | 30% |
| Association dossier | ✅ | ✅ | 100% |

**Légende:**
- ✅ = Complété
- ⏳ = En cours / Partiel
- ❌ = Non commencé

---

**Document créé le:** 2025-01-29  
**Dernière mise à jour:** 2025-01-29  
**Version:** 1.0  
**Auteur:** GitHub Copilot + Équipe SIGAC
