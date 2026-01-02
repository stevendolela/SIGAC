# Test du Calendrier - Guide Rapide

## ✅ Nouvelles Fonctionnalités Implémentées

### 1. Zone de Recherche Participants ⭐

**Comment tester:**
1. Ouvrir http://localhost:5674 et se connecter
2. Naviguer vers **Calendrier**
3. Dans le formulaire, scroller jusqu'à **👥 Participants**
4. Voir la nouvelle **zone de recherche** avec placeholder "🔍 Rechercher un participant..."

**Comportements attendus:**
- ✅ Taper du texte filtre instantanément la liste
- ✅ Recherche sur: nom complet, rôle, username
- ✅ Insensible à la casse (majuscules/minuscules)
- ✅ Message "Aucun participant trouvé" si aucun résultat
- ✅ Les participants déjà sélectionnés restent cochés après recherche
- ✅ Focus sur l'input → bordure bleue

**Tests à effectuer:**
```
Test 1: Rechercher "juge" → Devrait afficher uniquement les juges
Test 2: Rechercher "ADMIN" → Devrait afficher administrateurs
Test 3: Rechercher "xyz123" → Devrait afficher "Aucun participant trouvé"
Test 4: Sélectionner un participant → Rechercher autre chose → Revenir → Toujours coché ✓
```

---

### 2. Badges Participants Sélectionnés 🎯

**Comment tester:**
1. Dans section Participants, cocher 2-3 utilisateurs
2. Observer la zone bleue au-dessus de la liste avec **"✓ Participants sélectionnés :"**

**Comportements attendus:**
- ✅ Badges bleus avec nom complet
- ✅ Bouton **×** pour retirer un participant
- ✅ Compteur dynamique: "(2 sélectionnés)"
- ✅ Zone disparaît si aucun participant sélectionné

**Tests à effectuer:**
```
Test 1: Sélectionner 5 participants → Voir 5 badges bleus
Test 2: Cliquer sur × d'un badge → Participant retiré + checkbox décochée
Test 3: Compteur affiche "(1 sélectionné)" au singulier
Test 4: Retirer tous → Zone badges disparaît
```

---

### 3. Types d'Événements Étendus (5 types) 📊

**Comment tester:**
1. Dans formulaire, section **Informations Générales**
2. Ouvrir dropdown **Type d'événement**

**Options attendues:**
- 📊 Réunion (défaut)
- ⚖️ Audience
- 🎓 Formation ← **NOUVEAU**
- ⏰ Deadline ← **NOUVEAU**
- 👤 Personnel

**Tests à effectuer:**
```
Test 1: Sélectionner "Formation" → Créer événement → Badge violet dans calendrier
Test 2: Sélectionner "Deadline" → Créer événement → Badge orange dans calendrier
Test 3: Type "Audience" → Champ dossier devient REQUIS (*)
Test 4: Autres types → Champ dossier optionnel
```

---

### 4. Statuts d'Événements (Workflow) 🔄

**Comment tester:**
1. Section **Informations Générales**, colonne 3
2. Voir nouveau dropdown **Statut**

**Options attendues:**
- Planifié (défaut) - Bleu
- En cours - Orange
- Terminé - Vert
- Reporté - Gris

**Tests à effectuer:**
```
Test 1: Laisser défaut "Planifié" → Créer événement
Test 2: Changer à "En cours" → Créer → Vérifier badge orange
Test 3: Changer à "Terminé" → Créer → Vérifier badge vert
Test 4: Changer à "Reporté" → Créer → Vérifier badge gris
```

---

### 5. Rappels Automatiques ⏰

**Comment tester:**
1. Section **Date et Heure**, après Description
2. Voir nouveau champ **Rappel automatique**

**Options attendues:**
- Aucun rappel (0 min)
- 15 minutes avant
- 30 minutes avant (défaut)
- 1 heure avant
- 2 heures avant
- 1 jour avant

**Tests à effectuer:**
```
Test 1: Laisser défaut "30 minutes avant" → Créer événement
Test 2: Changer à "1 heure avant" → Créer événement
Test 3: Vérifier dans payload API: rappelAvant: 60
Note: Backend ne traite pas encore les rappels (à implémenter)
```

---

### 6. Association Dossier + Salle (Grid 2 colonnes) 🏢

**Comment tester:**
1. Section **📁 Association**
2. Observer les 2 colonnes côte à côte

**Layout attendu:**
```
┌─────────────────────────┬─────────────────────────┐
│  Dossier associé        │  Salle de réunion       │
│  [Dropdown]             │  [Dropdown]             │
└─────────────────────────┴─────────────────────────┘
```

**Tests à effectuer:**
```
Test 1: Type "Audience" → Dossier marqué REQUIS (*)
Test 2: Sélectionner dossier + salle → Créer événement
Test 3: Voir dropdown salle format: "🏢 Salle A - 20 pers."
Test 4: Sélectionner "Aucune salle" → Créer sans salle (OK)
```

---

## 🎨 Tests Visuels (UI/UX)

### Layout Formulaire

**Attendu: 4 sections distinctes**

```
┌─────────────────────────────────────────────────┐
│ 🔍 Informations Générales                       │
│ [Type] [Titre................................] [Statut] │
├─────────────────────────────────────────────────┤
│ 📅 Date et Heure                                │
│ [Début] [Fin] [☐ Toute la journée]             │
│ [Description...........................]        │
│ [Rappel automatique]                            │
├─────────────────────────────────────────────────┤
│ 📁 Association                                  │
│ [Dossier]            [Salle]                    │
├─────────────────────────────────────────────────┤
│ 👥 Participants (2 sélectionnés)                │
│ [🔍 Rechercher...]                              │
│ ┌─────────────────────────────────────┐         │
│ │ ✓ Participants sélectionnés :       │         │
│ │ [Jean Dupont ×] [Marie Martin ×]   │         │
│ └─────────────────────────────────────┘         │
│ [☐ User 1] [☐ User 2] [☐ User 3]                │
└─────────────────────────────────────────────────┘
```

### Couleurs Événements

**Test dans grille calendrier:**
- Réunion → Badge bleu (#3b82f6)
- Audience → Badge vert (#10b981)
- Formation → Badge violet (#8b5cf6)
- Deadline → Badge orange (#f59e0b)
- Personnel → Badge rouge (#ef4444)

### Interactions Hover

**Tests avec souris:**
- Hover sur participant label → Fond bleu léger
- Hover sur badge événement → Cursor pointer
- Focus input recherche → Bordure bleue
- Hover bouton × badge → Opacity change

---

## 🔧 Tests Techniques

### Console Browser (F12)

**Attendu: Aucune erreur**

```javascript
// Vérifier après chargement page
console.log("Errors:", performance.getEntriesByType("navigation"));

// Vérifier state après recherche participant
// (dans React DevTools)
searchParticipant: "juge"
formData.participants: ["guid1", "guid2"]
```

### Network Tab

**Requête création événement:**

```http
POST /api/calendar
Content-Type: application/json

{
  "type": "Formation",
  "titre": "Formation Nouveau Système",
  "description": "...",
  "dateDebut": "2025-02-15T09:00:00",
  "dateFin": "2025-02-15T17:00:00",
  "touteLaJournee": false,
  "dossierId": null,
  "salleId": "guid-salle-1",
  "participants": ["guid-user-1", "guid-user-2"],
  "statut": "Planifie",      ← NOUVEAU
  "rappelAvant": 60          ← NOUVEAU
}
```

**⚠️ Note:** Backend ne stocke pas encore `statut` et `rappelAvant` (colonnes manquantes)

---

## 🐛 Tests de Régression

### Fonctionnalités Existantes à Vérifier

**Navigation calendrier:**
- [ ] Bouton "← Précédent" fonctionne
- [ ] Bouton "Suivant →" fonctionne
- [ ] Bouton "Aujourd'hui" reset au mois actuel
- [ ] Jour actuel surligné en bleu

**Création événement basique:**
- [ ] Type "Réunion" + Titre + Dates → Créer → Apparaît dans calendrier
- [ ] Checkbox "Toute la journée" masque heures
- [ ] Validation: Titre vide → Erreur
- [ ] Validation: Date fin < date début → Erreur

**Participants existants:**
- [ ] Liste tous les utilisateurs système
- [ ] Checkboxes fonctionnelles
- [ ] Participants sauvegardés dans événement

---

## 📊 Checklist Complète

### Nouvelles Fonctionnalités
- [ ] Zone de recherche participants visible
- [ ] Recherche filtre en temps réel
- [ ] Badges participants sélectionnés s'affichent
- [ ] Bouton × retire participants
- [ ] 5 types événements dans dropdown
- [ ] 4 statuts dans dropdown
- [ ] Rappel automatique (6 options)
- [ ] Grid 2 colonnes (dossier + salle)
- [ ] Salle format "🏢 Nom - X pers."

### Régressions à Éviter
- [ ] Navigation mois fonctionne
- [ ] Création événement simple fonctionne
- [ ] Aucune erreur console
- [ ] Build réussit (npm run build)
- [ ] Page ne devient pas bleue (blank)

### Points d'Attention
- [ ] Performances: Recherche fluide avec 100+ users
- [ ] Accessibilité: Labels, placeholder, required
- [ ] Responsive: Grid participants s'adapte
- [ ] Validation: Audience requiert dossier

---

## 🚀 Prochaines Étapes

### Backend (Priorité Haute)

**Migration SQL à appliquer sur Render:**

```bash
# Connecter à PostgreSQL production
psql $DATABASE_URL

# Exécuter migration
ALTER TABLE "CalendarEvents" 
ADD COLUMN "Statut" VARCHAR(50) DEFAULT 'Planifie' NOT NULL,
ADD COLUMN "RappelAvant" INTEGER DEFAULT 30,
ADD COLUMN "Participants" TEXT;

CREATE INDEX "IX_CalendarEvents_Statut" ON "CalendarEvents" ("Statut");
```

**Modifier DTOs backend:**

```csharp
// SIGAC.Core/DTOs/CalendarEventDto.cs
public class CalendarEventDto
{
    // ... existing fields ...
    public string? Statut { get; set; }        // ← AJOUTER
    public int? RappelAvant { get; set; }      // ← AJOUTER
    public List<Guid>? Participants { get; set; } // ← AJOUTER
}
```

### Frontend (Priorité Moyenne)

**Filtres sidebar à implémenter:**
- Filtre par type (checkboxes)
- Filtre par statut (checkboxes)
- Filtre par participants (search)

**Vues alternatives:**
- Vue hebdomadaire (timeline 7 jours)
- Vue quotidienne (timeline 24h)

---

## 📞 Support

**En cas de bug:**
1. Ouvrir console navigateur (F12)
2. Copier erreurs JavaScript
3. Vérifier Network tab pour erreurs API
4. Vérifier fichiers modifiés:
   - `/workspaces/SIGAC/sigac-frontend/src/pages/CalendarPage.tsx`
   - `/workspaces/SIGAC/sigac-frontend/src/types/calendar.ts`

**Documentation:**
- Guide complet: `/workspaces/SIGAC/CALENDAR_COMPLETE_VISION.md`
- Architecture: `/workspaces/SIGAC/.github/copilot-instructions.md`

---

**Dernière mise à jour:** 2025-01-29  
**Version testée:** Frontend build successful, backend migration pending
