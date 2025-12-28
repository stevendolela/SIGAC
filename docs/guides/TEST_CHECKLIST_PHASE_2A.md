# ✅ Tests de Vérification - Phase 2A Vocabulaire Neutre

**Date**: 28 Décembre 2025  
**Status**: En cours  
**URLs Actives**:
- Frontend: http://localhost:5674
- Backend: http://localhost:5210
- Swagger: http://localhost:5210/swagger

---

## 🧪 Checklist de Tests Fonctionnels

### 1. ✅ Démarrage des Services

- [x] PostgreSQL démarré (docker-compose)
- [x] Backend .NET API en cours (port 5210)
- [x] Frontend Vite dev server en cours (port 5674)
- [x] Aucune erreur de compilation

**Résultat**: ✅ Tous les services opérationnels

---

### 2. 🔐 Authentification

**Compte de test**: `admin` / `Admin@2024!`

#### À Tester:
- [ ] Page de login accessible
- [ ] Login avec compte admin fonctionne
- [ ] Token JWT reçu et stocké
- [ ] Redirection vers dashboard après login

**Résultat Attendu**: Login sans erreur, accès au dashboard

---

### 3. 🧭 Navigation Sidebar - Labels Neutres

#### Vérifications Visuelles:

**Section "Dossiers & Tâches"**:
- [ ] ✅ "Projets" (au lieu de "Dossiers")
- [ ] ✅ "Nouveau Projet" (au lieu de "Nouveau Dossier")
- [ ] "Recherche" (inchangé)

**Section "Organisation"**:
- [ ] ✅ "Événements" (au lieu de "Audiences")
- [ ] "Calendrier" (inchangé)
- [ ] "Documents" (inchangé)

**Section "Administration"**:
- [ ] ✅ "Équipe" (au lieu de "Profils Juges")
- [ ] ✅ "Catégories" (au lieu de "Types d'affaires")
- [ ] "Utilisateurs" (admin seulement)
- [ ] "Salles" (admin seulement)

**Résultat Attendu**: Tous les nouveaux labels génériques visibles

---

### 4. 📊 Dashboard - Statuts Génériques

#### Vérifications:

**Cartes de statistiques**:
- [ ] Compteurs affichent les bons chiffres
- [ ] Icônes de statuts cohérentes
- [ ] Couleurs appropriées par statut

**Labels de statuts à vérifier**:
- [ ] "Nouveau" (🆕)
- [ ] "En Cours" (📝) - ancien "En Instruction"
- [ ] "En Validation" (💭) - ancien "En Délibéré"
- [ ] "Validé" (✅) - ancien "Jugé"
- [ ] "Archivé" (📦) - ancien "Classé"

**Résultat Attendu**: Dashboard opérationnel avec nouveaux labels

---

### 5. 📁 Liste des Projets (ex-Dossiers)

#### Navigation:
1. Cliquer sur "Projets" dans la sidebar
2. Vérifier que la page se charge

#### À Vérifier:
- [ ] Liste des projets s'affiche
- [ ] Colonnes du tableau correctes
- [ ] Filtres fonctionnent
- [ ] Pagination opérationnelle
- [ ] Bouton "Nouveau Projet" visible

**Résultat Attendu**: Liste complète fonctionnelle, aucune erreur console

---

### 6. ➕ Création Nouveau Projet

#### Workflow:
1. Cliquer sur "Nouveau Projet" (sidebar ou page liste)
2. Remplir le formulaire
3. Soumettre

#### Champs du formulaire:
- [ ] Titre du projet
- [ ] Type/Catégorie
- [ ] Responsable (assigné)
- [ ] Priorité
- [ ] Description

**Résultat Attendu**: Création réussie, notification positive, retour à la liste

---

### 7. 👥 Page Équipe (ex-Profils Juges)

#### Navigation:
1. Cliquer sur "Équipe" dans la sidebar

#### À Vérifier:
- [ ] ✅ Titre: "Profil Professionnel" (pas "Juge Constitutionnel")
- [ ] Liste des membres de l'équipe
- [ ] Toggle vue Tableau/Cartes fonctionne
- [ ] ✅ Alerte "membre(s) sans profil" (pas "juge(s)")
- [ ] ✅ Bouton "Créer un Profil Professionnel"

**Résultat Attendu**: Page accessible avec labels génériques

---

### 8. 📅 Page Événements (ex-Audiences)

#### Navigation:
1. Cliquer sur "Événements" dans la sidebar

#### À Vérifier:
- [ ] ✅ Titre: "Gestion des Événements" (pas "Audiences")
- [ ] ✅ Bouton "Planifier un événement" (pas "une audience")
- [ ] Calendrier mensuel s'affiche
- [ ] Liste complète accessible
- [ ] ✅ Notification succès: "Événement enregistré"

**Résultat Attendu**: Page opérationnelle avec terminologie neutre

---

### 9. 👤 Mon Profil (Utilisateur JugeConstitutionnel)

**Note**: Tester avec compte `juge.mbala` / `Juge@2024!`

#### À Vérifier:
- [ ] ✅ Titre: "Mon Profil Professionnel" (pas "Juge Constitutionnel")
- [ ] Formulaire d'édition accessible
- [ ] ✅ Placeholder: "Ex: Responsable Senior" (pas "Juge Conseiller")
- [ ] Sauvegarde fonctionne

**Résultat Attendu**: Profil utilisateur avec labels neutres

---

### 10. 💬 Chat & Workspaces (Non modifiés)

#### À Vérifier (régression):
- [ ] Chat 1-to-1 fonctionne
- [ ] Chat de groupe accessible
- [ ] Messages envoyés/reçus en temps réel
- [ ] Notifications de messages non lus
- [ ] Sélecteur de workspace fonctionne

**Résultat Attendu**: Fonctionnalités chat intactes

---

### 11. 🔍 Console Browser (Erreurs JS)

#### À Vérifier dans DevTools:
- [ ] Aucune erreur rouge dans console
- [ ] Pas d'erreur 404 sur ressources
- [ ] API calls réussissent (200/201)
- [ ] Pas d'avertissement TypeScript critique

**Résultat Attendu**: Console propre, aucune erreur bloquante

---

### 12. 📱 Responsive & Performance

#### Tests optionnels:
- [ ] Interface responsive sur mobile (Chrome DevTools)
- [ ] Temps de chargement acceptable (<2s)
- [ ] Navigation fluide entre pages
- [ ] Pas de lag ou freeze

**Résultat Attendu**: UX fluide et responsive

---

## 🐛 Bugs Potentiels à Surveiller

### Frontend
- [ ] Labels mixtes (ancien + nouveau)
- [ ] Statuts non reconnus (affichage vide)
- [ ] Erreurs de mapping dans Dashboard
- [ ] Messages non traduits en anglais

### Backend
- [ ] Erreurs 500 sur endpoints modifiés
- [ ] Problèmes de désérialisation JSON
- [ ] Logs d'erreur SQL
- [ ] CORS issues

---

## ✅ Résultat des Tests

### Synthèse Globale

| Composant | Status | Notes |
|-----------|--------|-------|
| Démarrage services | ✅ | OK |
| Authentification | ⏳ | À tester |
| Navigation Sidebar | ⏳ | À tester |
| Dashboard | ⏳ | À tester |
| Liste Projets | ⏳ | À tester |
| Création Projet | ⏳ | À tester |
| Page Équipe | ⏳ | À tester |
| Page Événements | ⏳ | À tester |
| Mon Profil | ⏳ | À tester |
| Chat/Workspaces | ⏳ | À tester |
| Console propre | ⏳ | À tester |

---

## 📝 Notes de Test

### Observations:

**Backend**:
- ✅ Compilation réussie avec warnings (compatibilité obsolète)
- ✅ PostgreSQL connecté
- ✅ Migrations appliquées
- ✅ Base de données initialisée
- ✅ API écoute sur port 5210

**Frontend**:
- ✅ Vite dev server démarré
- ✅ Compilation TypeScript OK
- ✅ Serveur écoute sur port 5674
- ⚠️ Warning CJS Vite (non-bloquant)

---

## 🚀 Prochaines Actions

1. **Tests Manuels**: Suivre la checklist ci-dessus
2. **Screenshots**: Capturer les labels modifiés
3. **Validation**: Confirmer aucune régression
4. **Documentation**: Mettre à jour avec résultats réels

---

## 📞 En Cas de Problème

### Frontend ne démarre pas
```bash
cd sigac-frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend erreur de connexion DB
```bash
docker-compose restart postgres
cd sigac-backend
dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API
```

### Erreurs TypeScript
```bash
cd sigac-frontend
npm run build  # Vérifier erreurs compilation
```

---

**Statut Final**: ⏳ Tests en cours - À compléter manuellement via navigateur
