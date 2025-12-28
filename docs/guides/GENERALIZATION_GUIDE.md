# 🌍 Guide de Généralisation SIGAC - Multi-secteurs

**Date**: 28 Décembre 2025  
**Version**: 1.0  
**Objectif**: Transformer SIGAC d'une application juridique spécifique en une plateforme GED universelle

---

## ✅ Modifications Complétées

### 1. Documentation Générale
- ✅ **PRESENTATION_SIGAC.md** : Présentation complète multi-secteurs
- ✅ **README.md** : Description universelle avec cas d'usage variés
- ✅ **.github/copilot-instructions.md** : Instructions contextuelles adaptables

### 2. Backend - Enums & Commentaires
- ✅ **StatusDossier.cs** : Commentaires XML génériques avec exemples multi-secteurs
- ✅ **UserRole.cs** : Descriptions adaptables (Juridique, Santé, Entreprise, etc.)
- ✅ **StatutAudience.cs** : Statuts d'événements génériques
- ✅ **TypeAudience.cs** : Types d'événements configurables par secteur

---

## 🔄 Modifications UI à Prévoir (Phase 2)

### Approche Recommandée

**Option A - Labels Configurables (Recommandé)**
Utiliser un système de configuration pour adapter les labels selon le secteur :

```typescript
// config/labels.ts
export const LABELS_CONFIG = {
  // Adapté dynamiquement selon le workspace ou configuration globale
  dossier: {
    singular: 'Dossier',      // ou 'Projet', 'Affaire', 'Cas'
    plural: 'Dossiers',        // ou 'Projets', 'Affaires', 'Cas'
    create: 'Nouveau Dossier', // ou 'Nouveau Projet'
    list: 'Mes Dossiers'       // ou 'Mes Projets'
  },
  responsable: {
    label: 'Rapporteur',       // ou 'Responsable', 'Manager', 'Chef de projet'
    role: 'Juge'               // ou 'Manager', 'Médecin', 'Responsable'
  },
  events: {
    singular: 'Audience',      // ou 'Réunion', 'Consultation', 'Événement'
    plural: 'Audiences',       // ou 'Réunions', 'Consultations', 'Événements'
  }
}
```

**Option B - Vocabulaire Neutre (Simple)**
Utiliser un vocabulaire universellement compréhensible sans configuration :

- "Dossier" → "Projet" ou "Dossier" (acceptable partout)
- "Rapporteur" → "Responsable"
- "Audience" → "Événement" ou "Rendez-vous"
- "Juge" → "Expert" ou "Responsable"

---

## 📝 Fichiers UI à Modifier (Phase 2)

### Priorité Haute - Labels Visibles

#### Components Sidebar
**Fichier**: `sigac-frontend/src/components/common/Sidebar.tsx`

```typescript
// Ligne 94-95: Navigation principale
label: 'Dossiers',           // → 'Projets' ou configurable
label: 'Nouveau Dossier',    // → 'Nouveau Projet'

// Ligne 118: Menu audiences
label: 'Audiences',          // → 'Événements' ou 'Rendez-vous'

// Ligne 160: Profils
label: 'Profils Juges',      // → 'Profils Experts' ou 'Équipe'
```

#### Dashboard
**Fichier**: `sigac-frontend/src/pages/DashboardPage.tsx`

```typescript
// Ligne 78: Titre
<div className="dashboard-title">📊 Tableau de Bord - Vue d'Ensemble</div>
// OK - Générique

// Lignes 64-69: Statuts
statusIcons: {
  'Nouveau': '🆕',
  'En Instruction': '📝',      // → 'En Cours'
  'En Déliberé': '💭',         // → 'En Validation'
  'Jugé': '✅',                // → 'Validé' ou 'Terminé'
  'Classé': '📦'               // → 'Archivé'
}
```

#### Pages Dossiers
**Fichiers à vérifier**:
- `sigac-frontend/src/pages/DossiersPage.tsx`
- `sigac-frontend/src/pages/CreateDossierPage.tsx`
- `sigac-frontend/src/pages/DossierDetailsPage.tsx`

**Modifications**:
- Titres de pages
- Labels de formulaires
- Messages d'aide
- Placeholders

#### Composants Dossiers
**Fichiers**:
- `sigac-frontend/src/components/dossiers/DossierList.tsx`
- `sigac-frontend/src/components/dossiers/TypeAffaireSelect.tsx`
- `sigac-frontend/src/components/dossiers/StatusBadge.tsx`

**Modifications**:
- "Type d'affaire" → "Catégorie" ou "Type de projet"
- Labels des colonnes de liste
- Tooltips et textes d'aide

#### Pages Audiences
**Fichiers**:
- `sigac-frontend/src/pages/AudiencesPage.tsx`
- `sigac-frontend/src/components/audiences/AudienceList.tsx`

**Modifications**:
- "Audience" → "Événement" ou "Rendez-vous"
- Types d'audiences → Types d'événements
- Labels adaptables

#### Profils Utilisateurs
**Fichiers**:
- `sigac-frontend/src/pages/MonProfilPage.tsx`
- `sigac-frontend/src/pages/JugeProfilesPage.tsx`

**Modifications**:
```typescript
// MonProfilPage.tsx ligne 152
"Mon Profil de Juge Constitutionnel" 
→ "Mon Profil Professionnel"

// MonProfilPage.tsx ligne 273
placeholder="Ex: Juge Conseiller"
→ placeholder="Ex: Responsable Senior"
```

### Priorité Moyenne - Types & Interfaces

#### Types TypeScript
**Fichier**: `sigac-frontend/src/types/dossier.ts`

Ajouter des alias génériques :
```typescript
export type ProjectDto = DossierListDto
export type ProjectDetailDto = DossierDetailDto
// Garder les anciens pour compatibilité
```

#### API Clients
Considérer des alias pour clarté :
```typescript
export const projectApi = dossierApi // Alias
```

---

## 🎨 Système de Configuration Multi-secteurs (Phase 3)

### Structure Proposée

```typescript
// types/sector.ts
export enum SectorType {
  Legal = 'legal',
  Healthcare = 'healthcare',
  Corporate = 'corporate',
  Government = 'government',
  Generic = 'generic'
}

export interface SectorConfig {
  sector: SectorType
  labels: {
    dossier: { singular: string; plural: string }
    responsable: string
    event: { singular: string; plural: string }
    status: Record<string, string>
  }
  colors: {
    primary: string
    secondary: string
  }
}

// config/sectors.ts
export const SECTOR_CONFIGS: Record<SectorType, SectorConfig> = {
  [SectorType.Legal]: {
    sector: SectorType.Legal,
    labels: {
      dossier: { singular: 'Affaire', plural: 'Affaires' },
      responsable: 'Juge Rapporteur',
      event: { singular: 'Audience', plural: 'Audiences' },
      status: {
        'Nouveau': 'Déposé',
        'EnInstruction': 'En Instruction',
        'EnDelibere': 'En Délibéré',
        'Juge': 'Jugé',
        'Classe': 'Classé'
      }
    },
    colors: { primary: '#1e40af', secondary: '#7c3aed' }
  },
  [SectorType.Healthcare]: {
    sector: SectorType.Healthcare,
    labels: {
      dossier: { singular: 'Dossier Patient', plural: 'Dossiers Patients' },
      responsable: 'Médecin Traitant',
      event: { singular: 'Consultation', plural: 'Consultations' },
      status: {
        'Nouveau': 'Nouveau Patient',
        'EnInstruction': 'En Consultation',
        'EnDelibere': 'En Analyse',
        'Juge': 'Diagnostic Établi',
        'Classe': 'Archivé'
      }
    },
    colors: { primary: '#059669', secondary: '#06b6d4' }
  },
  [SectorType.Corporate]: {
    sector: SectorType.Corporate,
    labels: {
      dossier: { singular: 'Projet', plural: 'Projets' },
      responsable: 'Chef de Projet',
      event: { singular: 'Réunion', plural: 'Réunions' },
      status: {
        'Nouveau': 'Nouveau',
        'EnInstruction': 'En Cours',
        'EnDelibere': 'En Validation',
        'Juge': 'Validé',
        'Classe': 'Terminé'
      }
    },
    colors: { primary: '#ea580c', secondary: '#f59e0b' }
  },
  [SectorType.Generic]: {
    sector: SectorType.Generic,
    labels: {
      dossier: { singular: 'Dossier', plural: 'Dossiers' },
      responsable: 'Responsable',
      event: { singular: 'Événement', plural: 'Événements' },
      status: {
        'Nouveau': 'Nouveau',
        'EnInstruction': 'En Cours',
        'EnDelibere': 'En Révision',
        'Juge': 'Traité',
        'Classe': 'Archivé'
      }
    },
    colors: { primary: '#3b82f6', secondary: '#8b5cf6' }
  }
}
```

### Hook d'utilisation

```typescript
// hooks/useSectorConfig.ts
import { useWorkspaceStore } from '../store/workspaceStore'
import { SECTOR_CONFIGS, SectorType } from '../config/sectors'

export function useSectorConfig() {
  const { currentWorkspace } = useWorkspaceStore()
  
  // Récupérer la config depuis le workspace ou défaut
  const sectorType = currentWorkspace?.sectorType || SectorType.Generic
  const config = SECTOR_CONFIGS[sectorType]
  
  return config
}

// Utilisation dans un composant
const { labels } = useSectorConfig()
<h2>{labels.dossier.plural}</h2> // Affiche "Dossiers" ou "Projets" selon config
```

---

## 🚀 Plan d'Action Recommandé

### Phase 2A - Vocabulaire Neutre (Rapide - 1-2 jours)
1. Modifier Sidebar.tsx avec labels neutres
2. Mettre à jour Dashboard avec statuts génériques
3. Adapter les pages principales (Dossiers, Événements)
4. Tester en développement

### Phase 2B - Configuration de Base (Moyen - 3-5 jours)
1. Créer `config/labels.ts` avec configuration simple
2. Implémenter `useSectorConfig()` hook
3. Migrer progressivement les composants
4. Ajouter toggle admin pour changer de secteur

### Phase 3 - Configuration Avancée (Long - 1-2 semaines)
1. Ajouter `sectorType` dans Workspace entity
2. UI d'administration pour choisir le secteur
3. Personnalisation complète (couleurs, icônes, workflows)
4. Migration des données existantes
5. Documentation utilisateur par secteur

---

## 📋 Checklist de Migration UI

### Textes à Généraliser
- [ ] "Dossier" → Variable ou "Projet"
- [ ] "Affaire" → Variable ou "Dossier"
- [ ] "Audience" → "Événement" ou "Rendez-vous"
- [ ] "Juge" → "Expert" ou "Responsable"
- [ ] "Rapporteur" → "Responsable" ou "Assigné"
- [ ] "Plaidoirie" → "Présentation"
- [ ] "Délibéré" → "Validation"
- [ ] "Classé" → "Archivé" ou "Terminé"

### Icônes à Vérifier
- [ ] ⚖️ (Balance justice) → 📋 (Clipboard) ou 📁 (Folder)
- [ ] 👨‍⚖️ (Juge) → 👤 (Personne) ou 👨‍💼 (Professionnel)
- [ ] 🏛️ (Palais) → 🏢 (Entreprise) selon contexte

### Labels de Statut
- [ ] "En Instruction" → "En Cours"
- [ ] "En Délibéré" → "En Validation" ou "En Révision"
- [ ] "Jugé" → "Validé" ou "Traité"
- [ ] "Classé" → "Archivé" ou "Terminé"

---

## 💡 Recommandations Finales

### Court Terme (Maintenant)
**Approche minimaliste** : Remplacer uniquement les termes trop spécifiques juridiques par des équivalents neutres sans système de configuration complexe.

Avantages :
- ✅ Rapide à implémenter
- ✅ Pas de risque de régression
- ✅ Amélioration immédiate de la perception

### Moyen Terme (Prochaine itération)
**Système de configuration** : Implémenter un système de labels configurables basique avec quelques secteurs prédéfinis.

Avantages :
- ✅ Flexibilité accrue
- ✅ Personnalisation par workspace
- ✅ Scalabilité future

### Long Terme (Roadmap)
**Configuration complète** : Workflows personnalisables, types de dossiers configurables, branding par secteur.

Avantages :
- ✅ Solution SaaS multi-tenant complète
- ✅ Adaptable à tout secteur
- ✅ Valeur commerciale élevée

---

## 📚 Ressources

- **Backend Enums** : `sigac-backend/SIGAC.Core/Enums/`
- **Frontend Types** : `sigac-frontend/src/types/`
- **Configuration** : À créer dans `sigac-frontend/src/config/`
- **Documentation** : `/docs/guides/`

---

**Prochaine étape recommandée** : Commencer par Phase 2A (vocabulaire neutre) pour un gain immédiat avec risque minimal.
