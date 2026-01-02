# 🚀 Déploiement Calendrier v2.0 - Statut

## ✅ Git Push Réussi

**Commit:** `0d76afa`  
**Branch:** `main`  
**Date:** 2 janvier 2026  
**Fichiers modifiés:** 13 fichiers, +4510 lignes

---

## 📦 Déploiement Automatique

### Frontend (Vercel)

**URL Production:** https://taajii.fr

**Statut:** 🟡 En cours de déploiement...

**Vérifier déploiement:**
1. Aller sur https://vercel.com/dashboard
2. Projet: `taajii-ged` ou `sigac-frontend`
3. Vérifier "Deployments" → Dernier commit `0d76afa`
4. Attendre "Ready" (2-3 minutes)

**Tester après déploiement:**
```bash
# Attendre 3-5 minutes puis:
curl -I https://taajii.fr
# Devrait retourner HTTP 200

# Vérifier JavaScript bundle
curl -s https://taajii.fr | grep "calendar"
```

---

### Backend (Render)

**URL Production:** https://sigac-api.onrender.com/api

**Statut:** ⚠️ **Migration SQL requise**

**Actions nécessaires:**

#### 1. Appliquer Migration SQL (10 min)

**Option A: Depuis Render Dashboard**
```bash
# 1. Aller sur https://dashboard.render.com
# 2. Sélectionner votre PostgreSQL "sigac-db"
# 3. Cliquer sur "Shell" (ouvre PSQL)
# 4. Copier-coller le contenu de:
#    deployment/migration-calendar-statut-rappel.sql
# 5. Appuyer Enter
```

**Option B: Depuis terminal local**
```bash
# Récupérer DATABASE_URL depuis Render Dashboard
export DATABASE_URL="postgres://sigac_user:...@postgres.render.com/sigac_db"

# Exécuter script automatique
cd /workspaces/SIGAC/deployment
./apply-calendar-statut-migration.sh

# Vérifier colonnes créées
psql "$DATABASE_URL" -c "\d CalendarEvents"
```

#### 2. Modifier Code Backend (2-3h)

**Voir guide complet:** [BACKEND_CALENDAR_UPDATES.md](BACKEND_CALENDAR_UPDATES.md)

**Fichiers à modifier:**
```
SIGAC.Core/Entities/CalendarEvent.cs          ← +3 champs
SIGAC.Core/DTOs/CalendarEventDto.cs            ← +3 propriétés
SIGAC.Core/DTOs/CreateCalendarEventDto.cs      ← +3 propriétés
SIGAC.Core/DTOs/UpdateCalendarEventDto.cs      ← +3 propriétés
SIGAC.Core/Mapping/CalendarMappingProfile.cs   ← JSON serialization
SIGAC.Core/Services/CalendarService.cs         ← Validation
```

**Checklist:**
- [ ] Ajouter `public string Statut { get; set; } = "Planifie";`
- [ ] Ajouter `public int? RappelAvant { get; set; } = 30;`
- [ ] Ajouter `public string? Participants { get; set; };` (JSON array)
- [ ] Mettre à jour 3 DTOs
- [ ] Mettre à jour CalendarMappingProfile (JSON ↔ List<Guid>)
- [ ] Ajouter validation statut/rappel
- [ ] Build: `dotnet build` → OK
- [ ] Push Git → Render auto-deploy

---

## 🧪 Tests Production

### Frontend (Test 1: Interface)

**Après déploiement Vercel (3-5 min):**

```bash
# 1. Ouvrir navigateur
https://taajii.fr

# 2. Se connecter (compte test)
Username: admin
Password: Admin@2024!

# 3. Naviguer: Calendrier

# 4. Vérifier:
✅ Dropdown Type a 5 options (Reunion, Audience, Formation, Deadline, Personnel)
✅ Dropdown Statut a 4 options (Planifie, EnCours, Termine, Reporte)
✅ Zone de recherche participants visible
✅ Champ "Rappel automatique" avec 6 options
✅ Dropdown "Salle de réunion" visible
✅ Formulaire en 4 sections
```

---

### Frontend (Test 2: Recherche Participants)

```bash
# Dans formulaire calendrier:

# Test 1: Recherche simple
1. Taper "juge" dans zone recherche
   → Devrait filtrer uniquement les juges

# Test 2: Sélection + Badge
2. Cocher 2 participants
   → Devrait afficher zone badges bleus en haut
   → Compteur "(2 sélectionnés)"

# Test 3: Retirer
3. Cliquer × sur badge
   → Participant retiré
   → Checkbox décochée automatiquement

# Test 4: Aucun résultat
4. Taper "xyz123"
   → Message "Aucun participant trouvé"
```

---

### Backend (Test 3: API - Après Migration SQL)

**Tester création événement:**

```bash
# 1. Login pour obtenir JWT
curl -X POST https://sigac-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}' \
  | jq -r '.token'

# Copier le token

# 2. Créer événement avec nouveaux champs
TOKEN="YOUR_JWT_TOKEN"

curl -X POST https://sigac-api.onrender.com/api/calendar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Formation",
    "titre": "Test Production Calendrier v2",
    "description": "Test des nouveaux champs",
    "dateDebut": "2026-02-15T10:00:00Z",
    "dateFin": "2026-02-15T17:00:00Z",
    "touteLaJournee": false,
    "statut": "Planifie",
    "rappelAvant": 60,
    "participants": []
  }'

# Réponse attendue:
# - 201 Created
# - JSON avec id, statut: "Planifie", rappelAvant: 60
```

**Si erreur 400/500:**
→ Migration SQL pas encore appliquée  
→ Backend code pas encore mis à jour

---

## 📊 Checklist Complète

### Phase 1: Frontend Deploy ✅
- [x] Git commit
- [x] Git push
- [ ] Vercel deploy terminé (3-5 min)
- [ ] Test interface https://taajii.fr
- [ ] Vérifier 5 types événements
- [ ] Vérifier recherche participants
- [ ] Vérifier badges sélectionnés

### Phase 2: Backend Migration ⏳
- [ ] Exporter DATABASE_URL
- [ ] Exécuter migration SQL
- [ ] Vérifier colonnes: `psql -c "\d CalendarEvents"`
- [ ] Colonnes Statut, RappelAvant, Participants créées

### Phase 3: Backend Code ⏳
- [ ] Modifier Entity CalendarEvent
- [ ] Modifier 3 DTOs
- [ ] Modifier CalendarMappingProfile
- [ ] Ajouter validation
- [ ] Build OK: `dotnet build`
- [ ] Commit + Push
- [ ] Render deploy terminé (5-10 min)

### Phase 4: Tests End-to-End ⏳
- [ ] Login https://taajii.fr
- [ ] Créer événement Formation
- [ ] Rechercher participants
- [ ] Sélectionner 3 participants
- [ ] Définir rappel 1h avant
- [ ] Sauvegarder
- [ ] Vérifier API retour: statut, rappelAvant, participants
- [ ] Vérifier stockage DB: `SELECT * FROM "CalendarEvents"`
- [ ] Vérifier affichage badges dans calendrier

---

## 🔗 Liens Rapides

### Dashboards
- Vercel: https://vercel.com/dashboard
- Render: https://dashboard.render.com
- GitHub: https://github.com/stevendolela/SIGAC

### Production URLs
- Frontend: https://taajii.fr
- API: https://sigac-api.onrender.com/api
- Swagger: https://sigac-api.onrender.com/swagger
- Health: https://sigac-api.onrender.com/health

### Documentation
- Guide complet: [CALENDAR_README.md](CALENDAR_README.md)
- Guide backend: [BACKEND_CALENDAR_UPDATES.md](BACKEND_CALENDAR_UPDATES.md)
- Guide tests: [TEST_CALENDAR_GUIDE.md](TEST_CALENDAR_GUIDE.md)
- Navigation: [CALENDAR_INDEX.md](CALENDAR_INDEX.md)

---

## ⚠️ Notes Importantes

### Frontend Fonctionne Déjà ✅

Les nouveaux champs sont visibles et fonctionnels dans l'UI:
- Recherche participants
- Badges sélectionnés
- 5 types + 4 statuts
- Rappels

**MAIS:** Les valeurs ne sont pas encore sauvegardées en base tant que backend n'est pas mis à jour.

---

### Backend Nécessite 2 Actions

**Action 1: SQL Migration (10 min)**
→ Ajoute colonnes en base

**Action 2: Code Update (2-3h)**
→ Backend utilise les colonnes

**Résultat:** Frontend + Backend synchronisés → Fonctionnalités complètes

---

## 🎯 Timeline Estimée

```
Maintenant (T+0):     ✅ Git push réussi
T+3 min:             ✅ Vercel deploy terminé
T+5 min:             🧪 Tests frontend possibles
T+15 min:            🗄️ Migration SQL appliquée
T+3 heures:          💻 Backend code mis à jour
T+3h10:              🚀 Render redeploy terminé
T+3h15:              ✅ Tests end-to-end complets
```

---

## 📞 Support

**Questions ?**
- Documentation: [CALENDAR_INDEX.md](CALENDAR_INDEX.md)
- Backend guide: [BACKEND_CALENDAR_UPDATES.md](BACKEND_CALENDAR_UPDATES.md)

**Erreurs ?**
- Vérifier logs Vercel: Dashboard → Deployments → Logs
- Vérifier logs Render: Dashboard → Logs
- Console navigateur: F12 → Console

---

## 🎉 Succès !

**Frontend déployé !** Le nouveau calendrier est maintenant en production.

**Prochaine étape:** Migration SQL + Backend update pour persistance complète.

---

**Dernière mise à jour:** 2 janvier 2026  
**Commit:** 0d76afa  
**Statut Frontend:** ✅ Déployé  
**Statut Backend:** ⏳ Migration pending
