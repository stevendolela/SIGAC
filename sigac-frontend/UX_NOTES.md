# Notes UX Rapides (SIGAC Frontend)

## Nouveaux Composants
- **LoadingSkeleton / SkeletonTableRows**: Utilisés pour indiquer le chargement des listes (juges, futurs dossiers). API minimaliste pour réutilisation.

## Patterns Ajoutés
- **Recherche locale juges**: Filtrage client-side + tri alphabétique pour réactivité immédiate.
- **Edition utilisateur modale**: Mise à jour optimiste + fermeture après succès. Fallback vers notification en cas d'erreur.
- **Accessibilité**: Focus automatique sur conteneur principal de la page juges après chargement + caption sur tableau.

## Conventions à Suivre
- Préférer `undefined` pour champs optionnels côté TS (éviter `null` sauf nécessité protocole API).
- Ajouter attributs ARIA (`aria-label`, `aria-busy`, `aria-live`) sur zones dynamiques.
- Centraliser futures animations dans `styles.css` (section Skeleton / Keyframes).

## Idées Futures
- Extraire un composant `EditableUserModal` réutilisable dans UsersPage & page dédiée Admin.
- Composant `StatusBadge` générique pour dossiers/audiences avec mapping couleurs.
- Mécanisme de **préchargement** (prefetch) des données juges quand user ouvre onglet Utilisateurs.
- Stockage local (sessionStorage) des derniers filtres utilisés (recherche utilisateurs / juges).

## Raccourci Technique
Pour utiliser le skeleton:
```tsx
import { LoadingSkeleton, SkeletonTableRows } from '../components/common/LoadingSkeleton'
// Inline
<LoadingSkeleton count={3} height={20} width={200} />
// Table
{loading ? <SkeletonTableRows rows={5} cols={4} /> : <tbody>...</tbody>}
```

## Accessibilité à surveiller
- Vérifier contraste couleur badges vs fond.
- Ajouter navigation clavier sur modale d'édition (trap focus) si besoins futurs.
- Fournir textes cachés pour emojis (ex: via `<span role="img" aria-label="Président">⚖️</span>`).
