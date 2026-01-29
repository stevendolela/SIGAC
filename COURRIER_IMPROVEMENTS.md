# 📬 Améliorations Page Courrier - Plan d'Action

## ✅ État Actuel

### ✓ Stats présentes:
- Total Courriers
- Nouveaux (Reçu)
- En cours (EnTraitement)
- Traités

### ✓ Fonctionnalités:
- Recherche
- Filtres (Type, Statut, Urgence, Workspace)
- Pagination
- Modal création
- Modal détails avec 3 onglets
- OCR support
- Historique

### ⚠️ Points à harmoniser:

1. **Header Section**
   - Ajouter plus de stats (Archivés, Total à traiter)
   - Uniformiser les couleurs avec le design système
   - Ajouter des icônes cohérentes

2. **Stats Visuelles**
   - Cards avec icons cohérents
   - Trending indicators (↑/↓)
   - Skeleton loaders pendant chargement
   - Couleur de bord left consistent

3. **Filtres & Actions**
   - Placer dans une section collapsible si trop
   - Icons + Labels
   - Reset filters button
   - Quick filters (À traiter, Urgents)

4. **List/Table**
   - Responsive design mobile
   - Row hover effects améliorés
   - Tri par colonne
   - Bulk actions (sélection multiple)

5. **Modal**
   - Spacing harmonisé
   - Boutons actions contextuels
   - Confirmation avant suppression

6. **CSS**
   - Variables de couleurs centralisées
   - Breakpoints mobile/tablet/desktop
   - Transition smooth

## 📋 Tâches

### Phase 1: Stats & Layout (Prioritaire)
- [ ] Ajouter stats: Archivés, Rejetés, À traiter
- [ ] Ajouter icons Font Awesome ou Lucide
- [ ] Layout responsive
- [ ] Couleurs harmonisées SIGAC

### Phase 2: UX Améliorations
- [ ] Filtres avancés collapsibles
- [ ] Quick filters
- [ ] Bulk select + actions
- [ ] Sort par colonne

### Phase 3: Polish
- [ ] Loading skeletons
- [ ] Animations
- [ ] Keyboard shortcuts
- [ ] A11y (accessibility)

## 🎨 Design Tokens SIGAC

**Couleurs Stats:**
- Total: #3b82f6 (Bleu)
- Reçu: #3b82f6 (Bleu primaire)
- EnTraitement: #f59e0b (Orange warning)
- Traité: #10b981 (Vert success)
- Archivé: #6b7280 (Gris)
- Rejeté: #ef4444 (Rouge error)

**Typography:**
- H1: 32px, 800, -1px letter-spacing
- H2: 24px, 700
- Label: 13px, 600, uppercase, 0.5px letter-spacing

**Spacing:**
- Gap stats: 24px
- Padding cards: 24px
- Border radius: 20px (cards), 16px (buttons), 12px (inputs)

## 📌 Note

La page fonctionne bien, il s'agit juste de:
1. Améliorer la cohérence visuelle
2. Ajouter des stats supplémentaires
3. Rendre plus responsive
4. Ajouter quelques UX polishes
