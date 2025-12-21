# Implémentation du Statut Utilisateur (Style Microsoft Teams)

## Vue d'ensemble

Implémentation d'un système de statut utilisateur inspiré de Microsoft Teams pour améliorer la collaboration dans le chat SIGAC.

## Fonctionnalités Implémentées

### 1. Enum UserStatus (Backend)

**Fichier**: `sigac-backend/SIGAC.Core/Enums/UserStatus.cs`

Six statuts disponibles :
- **Disponible** (0) - Vert 🟢
- **Occupé** (1) - Rouge 🔴
- **Ne pas déranger** (2) - Rouge avec barre 🔴
- **Absent** (3) - Jaune 🟡
- **Hors ligne** (4) - Gris ⚫
- **Apparaître absent** (5) - Jaune 🟡

### 2. Entité User Mise à Jour

**Fichier**: `sigac-backend/SIGAC.Core/Entities/User.cs`

Ajout du champ :
```csharp
public UserStatus Status { get; set; } = UserStatus.Disponible;
```

### 3. DTOs Enrichis

**Fichier**: `sigac-backend/SIGAC.Core/DTOs/ChatDtos.cs`

Tous les DTOs incluent maintenant :
- `SenderNomComplet` : Nom complet de l'expéditeur
- `SenderStatus` : Statut de l'expéditeur
- `User1/User2NomComplet` : Noms complets des participants
- `User1/User2Status` : Statuts des participants

DTOs modifiés :
- `MessageDto`
- `ChatConversationDto`
- `ChatConversationDetailDto`
- `GroupMessageDto`
- `ChatGroupMemberDto`

### 4. Mapping AutoMapper

**Fichier**: `sigac-backend/SIGAC.Core/Mapping/ChatMappingProfile.cs`

Tous les mappings incluent maintenant :
- Mapping automatique de `NomComplet` depuis `User.NomComplet`
- Mapping automatique de `Status` depuis `User.Status`
- Cast explicite vers `UserStatus?` pour les types optionnels

### 5. Types TypeScript (Frontend)

**Fichier**: `sigac-frontend/src/types/chat.ts`

Ajout de l'enum :
```typescript
export enum UserStatus {
  Disponible = 0,
  Occupe = 1,
  NePasDeranger = 2,
  Absent = 3,
  HorsLigne = 4,
  ApparaitreAbsent = 5
}
```

Tous les DTOs TypeScript mis à jour avec les champs optionnels :
- `senderNomComplet?`
- `senderStatus?`
- `user1/user2NomComplet?`
- `user1/user2Status?`
- `nomComplet?`
- `status?`

### 6. Composant StatusIndicator

**Fichier**: `sigac-frontend/src/components/UnifiedChatPanel.tsx`

Nouveau composant inline :
```typescript
const StatusIndicator: React.FC<{ status?: UserStatus; showLabel?: boolean }> = ({ status, showLabel = false })
```

Caractéristiques :
- Point coloré de 8px (vert/rouge/jaune/gris)
- Bordure blanche + ombre portée
- Tooltip avec libellé du statut
- Option d'affichage du libellé textuel

### 7. Interface Utilisateur Mise à Jour

**Modifications dans UnifiedChatPanel.tsx** :

#### Liste des Conversations
- Affichage du statut de l'autre utilisateur avec point coloré
- Affichage du nom complet au lieu du username
- Pas de groupement "user1 & user2" - juste le nom de l'autre personne

#### En-tête de Conversation
- Statut de l'autre utilisateur affiché dans le header
- Nom complet affiché

#### Messages
- Chaque message affiche :
  - Point de statut coloré
  - Nom complet de l'expéditeur (au lieu du username)
  - Contenu et heure du message

### 8. Migration Base de Données

**Fichier**: `deployment/migration-user-status.sql`

```sql
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "Status" integer NOT NULL DEFAULT 0;
COMMENT ON COLUMN "Users"."Status" IS 'User status: 0=Disponible, 1=Occupé, 2=NePasDéranger, 3=Absent, 4=HorsLigne, 5=ApparaitreAbsent';
```

**Status** : ✅ Appliquée en local

## Code de Couleur des Statuts

| Statut | Couleur | Code Hex | Icône |
|--------|---------|----------|-------|
| Disponible | Vert | `#28a745` | 🟢 |
| Occupé | Rouge | `#dc3545` | 🔴 |
| Ne pas déranger | Rouge | `#dc3545` | 🔴 |
| Absent | Jaune | `#ffc107` | 🟡 |
| Apparaître absent | Jaune | `#ffc107` | 🟡 |
| Hors ligne | Gris | `#6c757d` | ⚫ |

## Fonctions Helpers

### getStatusColor()
Retourne la couleur hex basée sur le statut

### getStatusLabel()
Retourne le libellé français du statut

### getOtherUserName()
Retourne le nom complet de l'autre utilisateur dans la conversation
- Utilise `nomComplet` si disponible
- Fallback sur `username`
- Pas de concaténation "user1 & user2"

### getOtherUserStatus()
Retourne le statut de l'autre utilisateur dans la conversation

## Tests Effectués

✅ Compilation backend réussie (dotnet build)
✅ Migration appliquée sur PostgreSQL local
✅ Backend démarré sur localhost:5210
✅ Frontend démarré sur localhost:5674
✅ Types TypeScript synchronisés avec DTOs C#

## Prochaines Étapes

### À Implémenter (Optionnel)

1. **Page de Profil Utilisateur**
   - Sélecteur de statut (dropdown avec couleurs)
   - Mise à jour du statut en temps réel

2. **API Endpoint**
   - `PUT /api/users/status` pour changer son statut
   - `GET /api/users/{id}/status` pour récupérer le statut

3. **Gestion Automatique**
   - Passer en "Hors ligne" après X minutes d'inactivité
   - Détecter l'activité utilisateur (clics, scroll)
   - Restaurer le statut précédent au retour

4. **Notifications**
   - Badge numérique sur conversations avec messages de contact "Disponible"
   - Filtrage des conversations par statut

5. **Migration Production**
   - Appliquer migration sur Render PostgreSQL
   - Vérifier compatibilité données existantes
   - Commit + Push vers GitHub

## Architecture

### Flux de Données

```
User.Status (DB)
    ↓
ChatConversation/Message (Entity with Include)
    ↓
AutoMapper Profile
    ↓
ChatConversationDto/MessageDto (avec Status + NomComplet)
    ↓
API Response
    ↓
Frontend TypeScript Types
    ↓
StatusIndicator Component
    ↓
UI Rendering (points colorés)
```

### Principe de Fonctionnement

1. **Backend** : AutoMapper inclut automatiquement les relations User dans les requêtes chat
2. **Mapping** : Les champs Status et NomComplet sont mappés depuis les entités User liées
3. **Frontend** : Les DTOs contiennent les données pré-calculées (pas de requêtes supplémentaires)
4. **UI** : Le composant StatusIndicator affiche la couleur basée sur l'enum TypeScript

## Avantages de Cette Approche

- ✅ **Pas de N+1 queries** : Données chargées avec Include()
- ✅ **Type-safe** : Types partagés entre C# et TypeScript
- ✅ **Performant** : Statut calculé côté backend une seule fois
- ✅ **Réactif** : Polling du chat récupère automatiquement les statuts à jour
- ✅ **Maintenable** : Logique centralisée dans AutoMapper

## Compatibilité

- ✅ .NET 8.0
- ✅ PostgreSQL 15
- ✅ React 18.3.1
- ✅ TypeScript 5.9.3
- ✅ Entity Framework Core 8.0.10
- ✅ AutoMapper 13.0.1

## Auteur

Implémentation réalisée le 2025-01-XX pour SIGAC (Système de Gestion des Affaires Constitutionnelles)
