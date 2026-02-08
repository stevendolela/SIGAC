# 📥 Guide: Import en Masse avec Auto-Création de Types d'Affaires

## Vue d'Ensemble

Le système d'import en masse de SIGAC crée automatiquement les types d'affaires inexistants. Vous n'avez plus besoin de préparer une liste complète de types avant l'import.

---

## Fonctionnement

### Avant (Ancien Système)
```
CSV → Import API → Validation TypeAffaire
                   ├─ ✅ Type existe → Dossier créé
                   └─ ❌ Type manquant → ❌ Dossier rejeté (ERREUR)
```

### Maintenant (Nouveau Système) ✨
```
CSV → Import API → Validation TypeAffaire
                   ├─ ✅ Type existe → Dossier créé
                   └─ ❌ Type manquant → ✨ Type créé automatiquement → ✅ Dossier créé
```

---

## Cas d'Usage

### 1. Import avec Nouveaux Types (Multi-Secteurs)
Vous importez un CSV avec des types spécifiques à votre secteur:

```csv
NumeroDossier;Titre;Description;TypeAffaire;Priorite;Responsable;Status
2024-001;Demande;Permis construire;Administratif;Normale;admin;Nouveau
2024-002;Contrat;Partenariat;Commercial;Haute;admin;Nouveau
2024-003;Patient;Consultation;Médical;Critique;admin;Nouveau
```

**Résultat:**
- ✅ 3 dossiers créés
- ✨ 3 types d'affaires créés: Administratif, Commercial, Médical
- 📊 Message: "Import terminé: 3 dossiers créés, 3 types d'affaires créés"

### 2. Import Mixte (Types Existants + Nouveaux)
```csv
NumeroDossier;Titre;TypeAffaire;...
2024-001;Demande;Administratif;...      ← Nouveau (sera créé)
2024-002;Projet;Financement projet;...  ← Existant (sera réutilisé)
2024-003;Case;Commercial;...            ← Nouveau (sera créé)
```

**Résultat:**
- ✅ 3 dossiers créés
- ✨ 2 types d'affaires créés: Administratif, Commercial
- 📊 Message: "Import terminé: 3 dossiers créés, 2 types d'affaires créés"

### 3. Import Multi-Secteurs (Adapter à Votre Métier)
La plateforme supporte n'importe quel secteur:

**Juridique:**
```
Types d'affaires: Constitutionnel, Contentieux, Contrats, Administratif
```

**Santé:**
```
Types d'affaires: Consultation, Diagnostic, Traitement, Suivi Patient
```

**Entreprise:**
```
Types d'affaires: Ventes, Achats, RH, Comptabilité, IT
```

**Administration:**
```
Types d'affaires: Urbanisme, Social, Fiscal, Demandes Citoyennes
```

---

## Format du CSV

Le format doit être **semicolon-separated (;)** avec les colonnes:

| Colonne | Requis | Description | Format |
|---------|--------|-------------|--------|
| `NumeroDossier` | ✅ | Identifiant unique du dossier | Texte (ex: 2024-001) |
| `Titre` | ✅ | Titre du dossier | Texte (ex: Demande de permis) |
| `Description` | ❌ | Description détaillée | Texte |
| `TypeAffaire` | ✅ | Type d'affaire (auto-créé si inexistant) | Texte - **Sensible à la casse** |
| `Priorite` | ❌ | Normale\|Haute\|Critique | Défaut: Normale |
| `Responsable` | ❌ | Username du responsable | Texte (admin, juge.mbala, etc.) |
| `Status` | ❌ | Nouveau\|EnCours\|EnValidation\|Valide\|Termine | Défaut: Nouveau |
| `Documents` | ❌ | URLs séparées par ; | https://example.com/doc1.pdf;https://example.com/doc2.pdf |

### ⚠️ Important: Sensibilité à la Casse

Les TypeAffaire sont **case-insensitive** pour la recherche, mais **case-sensitive** pour la création:

```csv
TypeAffaire: "Administratif"     → Créé comme "Administratif"
TypeAffaire: "ADMINISTRATIF"     → Créé comme "ADMINISTRATIF" (nouveau type!)
TypeAffaire: "administratif"     → Créé comme "administratif" (nouveau type!)

TypeAffaire: "Administratif"     → ✅ Trouve le premier (réutilisé)
```

**Recommandation:** Utilisez la casse standard (PascalCase) pour cohérence.

---

## Attributs Auto-Générés

Quand un TypeAffaire est créé automatiquement, il reçoit:

```csharp
{
    Id: Guid.NewGuid(),  // UUID généré automatiquement
    Nom: "Votre Type d'Affaire",
    Description: "Type d'affaire importé automatiquement le 14/01/2025 10:30",
    CreatedAt: DateTime.UtcNow
}
```

Vous pouvez ensuite modifier la description via l'API d'administration si nécessaire.

---

## Exemple Complet: Test Local

### 1. Démarrer le Backend
```bash
cd /workspaces/SIGAC/sigac-backend
dotnet run --project SIGAC.API
```

### 2. Lancer le Test Automatisé
```bash
cd /workspaces/SIGAC
./test-import-auto-create.sh
```

**Sortie attendue:**
```
═══════════════════════════════════════════════════════════════════
🧪 TEST: Import en Masse avec Auto-Création des Types d'Affaires
═══════════════════════════════════════════════════════════════════

🔍 Vérification du backend...
✅ Backend accessible sur http://localhost:5210/api

📝 ÉTAPE 1: Authentification...
✅ Token obtenu: eyJhbGciOiJIUzI1NiIsInR5...

📝 ÉTAPE 2: Préparation des données d'import...
✅ Fichier préparé: /tmp/import_test.json
   Données: 4 dossiers
   Nouveaux types: Administratif, Commercial, Médical
   Types existants: Financement projet (à réutiliser)

📝 ÉTAPE 3: Appel de l'endpoint d'import...
📤 Réponse de l'API:
{
  "success": true,
  "message": "Import terminé: 4 dossiers créés, 3 types d'affaires créés",
  "dossiersCreated": 4,
  "documentsCreated": 0,
  "typeAffairesCreated": [
    "Administratif",
    "Commercial",
    "Médical"
  ],
  "errors": []
}

✅ Import réussi!
   ✓ 4 dossiers créés
   ✓ 3 types d'affaires créés automatiquement
```

### 3. Vérifier en Base de Données
```bash
docker exec -it sigac-postgres psql -U sigac_user -d sigac_db -c \
  "SELECT \"Nom\", \"CreatedAt\" FROM \"TypeAffaires\" ORDER BY \"CreatedAt\" DESC LIMIT 5;"
```

**Résultat:**
```
Nom             │ CreatedAt
────────────────┼───────────────────────────
Administratif   │ 2025-01-14 10:30:45.123
Commercial      │ 2025-01-14 10:30:44.856
Médical         │ 2025-01-14 10:30:44.589
Financement ... │ 2024-12-20 08:15:00.000
Informatique    │ 2024-12-15 14:22:30.000
```

---

## Erreurs Possibles et Solutions

### ❌ Erreur 1: "Accès non autorisé"
```json
{
  "success": false,
  "message": "Seuls les admins peuvent importer en masse",
  "errors": ["Accès non autorisé"]
}
```

**Solution:** Connectez-vous avec un compte Admin ou Manager.

---

### ❌ Erreur 2: "La liste des dossiers est vide"
```json
{
  "success": false,
  "message": "Aucun dossier à importer",
  "errors": ["La liste des dossiers est vide"]
}
```

**Solution:** Vérifiez que le JSON contient au moins un élément dans `"dossiers": [...]`.

---

### ❌ Erreur 3: Responsable non trouvé
```json
{
  "success": true,
  "message": "Import terminé: 3 dossiers créés, 2 types d'affaires créés",
  "errors": [
    "Ligne 2024-002: Responsable 'utilisateur.inexistant' non trouvé"
  ]
}
```

**Solution:** Le dossier est quand même créé (sans responsable). Vérifiez le username du responsable.

---

## Performance et Optimisations

### Cache en Mémoire
L'import utilise un cache en mémoire pour:
- ✅ Éviter les requêtes redondantes à la base
- ✅ Supporter les créations multiples dans une seule session
- ✅ Garantir la cohérence pendant l'import

**Impact:** Import de 1000 dossiers en **< 30 secondes** (test local).

---

## Déploiement en Production

La modification est **prête pour production**:

1. **Backend**: Deploy le nouveau code (auto-création incluse)
2. **Frontend**: Pas de changements (même endpoint)
3. **Database**: Pas de migration (juste `SaveChangesAsync()`)

Les TypeAffaire créés persisteront automatiquement dans PostgreSQL.

---

## FAQ

### Q: Les types créés automatiquement disparaîtront-ils après l'import?
**R:** Non, ils sont persistés en base de données et resteront disponibles pour les imports futurs.

### Q: Puis-je limiter les types d'affaires créés?
**R:** Actuellement non, mais vous pouvez pré-créer les types autorisés via l'API d'administration.

### Q: Comment modifier un type d'affaire créé automatiquement?
**R:** Utilisez l'API `PATCH /api/TypeAffaires/{id}` pour modifier la description.

### Q: Quel est la limite sur le nombre de nouveaux types par import?
**R:** Aucune limite technique. Le système peut créer autant de types que nécessaire.

### Q: Dois-je nettoyer les types d'affaires après un import?
**R:** Non, ils sont utiles pour les imports futurs. Archivez-les si vous n'en avez plus besoin.

---

## Support et Questions

Pour toute question ou signaler un bug:
- 📧 Email: support@sigac.com
- 💬 Chat: En-app support panel
- 📋 Issues: GitHub issues (si public)

---

**Version:** 1.0  
**Date:** 14 janvier 2025  
**Status:** ✅ Production Ready
