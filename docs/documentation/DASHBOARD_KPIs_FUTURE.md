# KPIs du Dashboard - À Développer Plus Tard

## Vue d'ensemble
Ce document liste les KPIs et métriques du dashboard SIGAC qui sont actuellement cachés ou à développer. Ces fonctionnalités nécessitent des entités ou des statuts supplémentaires dans le système.

---

## Phase 1 - KPIs Implémentés ✅

### KPIs Actuellement Visibles
- **Total Dossiers**: Nombre total de dossiers dans la période sélectionnée
- **Nouveaux**: Dossiers avec statut "Nouveau"
- **Validés**: Dossiers avec statut "Validé"
- **En Cours**: Dossiers avec statut "EnCours" + "EnValidation"
- **Utilisateurs Actifs**: Nombre d'utilisateurs actifs (Admin only)

### Indicateurs de Performance
- **Taux de Completion**: Pourcentage de dossiers validés
- **Temps de Traitement Moyen**: Jours moyens entre création et validation
- **Tâches en Attente**: Total des nouveaux + en cours + en validation

### Distributions
- **Par Type d'Affaire**: Répartition des dossiers par type
- **Par Priorité**: Répartition des dossiers par priorité

### Timeline
- **Dossiers Créés par Mois**: Timeline 6 derniers mois
- **Dossiers Complétés par Mois**: Timeline 6 derniers mois

---

## Phase 2 - KPIs à Développer 🚧

### 1. **Dossiers En Retard** ⚠️
**Statut**: À développer  
**Description**: Affiche le nombre de dossiers qui dépassent leur délai de traitement prévu.  
**Prérequis**:
- [ ] Ajouter un champ `DateEcheance` à l'entity `Dossier`
- [ ] Ajouter un enum `StatutRetard` ou champ `IsEnRetard`
- [ ] Créer une logique de calcul des retards (basée sur DateEcheance vs Now)
- [ ] Implémenter la requête `GetDossiersEnRetardAsync()` dans le repository

**Migration requise**:
```sql
ALTER TABLE "Dossiers" ADD COLUMN "DateEcheance" TIMESTAMP NULL;
ALTER TABLE "Dossiers" ADD COLUMN "EstEnRetard" BOOLEAN DEFAULT FALSE;
```

**Service Method**:
```csharp
Task<int> GetDossiersEnRetardAsync(Guid? rapporteurId = null);
```

---

### 2. **Stockage et Quotas** 📦
**Statut**: Partiellement implémenté (Admin only)  
**Description**: Affiche l'utilisation du stockage par workspace.  
**Améliorations**:
- [ ] Ajouter alertes si dépassement de quota (90%, 100%)
- [ ] Graphique de tendance d'utilisation du stockage
- [ ] Archivage automatique des documents anciens

---

### 3. **Taux de Satisfaction/Qualité** ⭐
**Statut**: À développer  
**Description**: Feedback utilisateurs sur les dossiers traités.  
**Prérequis**:
- [ ] Créer entity `DossierFeedback`
- [ ] Ajouter champs: Rating (1-5), Commentaire, DateFeedback
- [ ] Interface UI pour collecter les avis

**Entity**:
```csharp
public class DossierFeedback
{
    public Guid Id { get; set; }
    public Guid DossierId { get; set; }
    public Guid UserId { get; set; }
    public int Rating { get; set; } // 1-5
    public string? Commentaire { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public Dossier? Dossier { get; set; }
    public User? User { get; set; }
}
```

---

### 4. **Efficacité d'Équipe** 👥
**Statut**: À développer  
**Description**: Métriques comparatives entre utilisateurs/équipes.  
**Métriques**:
- [ ] Productivité: Dossiers traités par utilisateur
- [ ] Vitesse: Temps moyen de traitement par utilisateur
- [ ] Qualité: Taux d'erreurs/renvois
- [ ] Tendances: Comparaison période N vs période N-1

---

### 5. **Alertes et Escalades** 🔔
**Statut**: À développer  
**Description**: Alertes automatiques sur les dossiers en difficulté.  
**Types d'alertes**:
- [ ] Dossier bloqué depuis X jours
- [ ] Changement de statut non autorisé
- [ ] Quota de stockage dépassé
- [ ] Utilisateur inactif depuis X jours

**Entity**:
```csharp
public class DashboardAlert
{
    public Guid Id { get; set; }
    public string Type { get; set; } // "DossierBloque", "QuotaDepassé", etc.
    public string Message { get; set; }
    public Guid? DossierId { get; set; }
    public AlertLevel Level { get; set; } // Info, Warning, Critical
    public DateTime CreatedAt { get; set; }
    public bool IsResolved { get; set; }
}
```

---

### 6. **Comparaison Périodes** 📊
**Statut**: À développer  
**Description**: Comparer les métriques entre deux périodes.  
**Exemple**: Dossiers validés ce mois-ci vs le mois dernier.

---

### 7. **Exports et Rapports** 📄
**Statut**: À développer  
**Description**: Générer des rapports PDF/Excel du dashboard.  
**Formats**:
- [ ] Rapport mensuel
- [ ] Rapport par utilisateur
- [ ] Rapport par type d'affaire
- [ ] Export CSV

---

## Infrastructure Requise

### Nouveau Statut: `StatusDossier.EnRetard`
```csharp
public enum StatusDossier
{
    Nouveau = 1,
    EnCours = 2,
    EnValidation = 3,
    Valide = 4,
    Termine = 5,
    EnRetard = 6  // À ajouter
}
```

### Nouveau Enum: `AlertLevel`
```csharp
public enum AlertLevel
{
    Info = 1,
    Warning = 2,
    Critical = 3
}
```

---

## Plan de Développement Recommandé

### Sprint N+1
- [ ] Implémenter `DateEcheance` sur les dossiers
- [ ] Ajouter logique de calcul des retards
- [ ] Afficher le KPI "Dossiers En Retard"

### Sprint N+2
- [ ] Système d'alertes
- [ ] Feedbacks utilisateurs

### Sprint N+3
- [ ] Métriques d'équipe avancées
- [ ] Exports et rapports

---

## Notes de Développement

- **Attention**: Les retards doivent être calculés en base de données, pas en mémoire
- **Performance**: Utiliser des index sur `DateEcheance`, `CreatedAt`, `ModifiedAt`
- **UI**: Les nouveaux KPIs doivent suivre le même style que les KPIs existants
- **Tests**: Couvrir les cas limites (dates null, diviseurs par zéro, etc.)

---

## Contacts et Référence

**Document créé**: 13 Janvier 2026  
**Version**: 1.0  
**Mainteneur**: Équipe de Développement SIGAC
