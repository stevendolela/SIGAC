# Groupes de Chat - Documentation

## 🎉 Nouvelle Fonctionnalité: Groupes de Chat

Les groupes de chat permettent aux utilisateurs de communiquer avec plusieurs personnes simultanément, complétant les conversations 1-to-1 existantes.

## 📱 Interface Utilisateur

### Accès aux Groupes
- Bouton **rose** (👥) en bas à droite de l'écran
- Affiché à côté du bouton de chat 1-to-1 (bleu)
- Accessible par tous les utilisateurs authentifiés

### Fonctionnalités

#### Créer un Groupe
1. Cliquer sur le bouton "➕" dans le header des groupes
2. Entrer:
   - **Nom du groupe** (obligatoire)
   - **Description** (optionnel)
   - **Membres** (au moins 1, plus le créateur)
3. Le créateur devient automatiquement admin

#### Participer à un Groupe
- Les groupes s'affichent dans la liste avec:
  - Nom du groupe
  - Nombre de membres (badge)
  - Date du dernier message
- Cliquer pour ouvrir et voir tous les messages

#### Envoyer des Messages
- Identique aux conversations 1-to-1
- Les messages s'affichent avec:
  - Nom de l'expéditeur
  - Contenu
  - Heure d'envoi

#### Gérer les Membres
- **Admin uniquement** peut:
  - Ajouter de nouveaux membres
  - Supprimer des membres
- **N'importe quel membre** peut quitter le groupe

#### Supprimer un Groupe
- **Créateur uniquement** peut supprimer le groupe
- Bouton 🗑️ dans le header du groupe

## 🏗️ Architecture Backend

### Entités Principales

```
ChatGroup
├── Id (Guid)
├── Name (string)
├── Description (string?)
├── CreatedById (Guid)
├── CreatedAt (DateTime)
├── LastMessageAt (DateTime?)
├── Members (ChatGroupMember[])
└── Messages (GroupMessage[])

ChatGroupMember
├── Id (Guid)
├── ChatGroupId (Guid)
├── UserId (Guid)
├── JoinedAt (DateTime)
└── IsAdmin (bool)

GroupMessage
├── Id (Guid)
├── ChatGroupId (Guid)
├── SenderId (Guid)
├── Content (string)
└── SentAt (DateTime)
```

### Endpoints API

#### Groupes
```
POST   /api/chatgroups/create           - Créer un groupe
GET    /api/chatgroups/my-groups        - Lister mes groupes
GET    /api/chatgroups/{groupId}        - Détails du groupe
DELETE /api/chatgroups/{groupId}        - Supprimer le groupe
```

#### Messages
```
POST   /api/chatgroups/messages         - Envoyer un message
```

#### Membres
```
POST   /api/chatgroups/{groupId}/members             - Ajouter un membre
DELETE /api/chatgroups/{groupId}/members/{memberId}  - Supprimer un membre
```

### Services

**IChatGroupService** / **ChatGroupService**
- `CreateGroupAsync(dto, userId)` - Créer un groupe
- `GetUserGroupsAsync(userId)` - Récupérer les groupes de l'utilisateur
- `GetGroupDetailAsync(groupId, userId)` - Détails avec messages
- `AddMessageAsync(dto, userId)` - Ajouter un message
- `AddMemberAsync(groupId, memberId, userId)` - Ajouter un membre
- `RemoveMemberAsync(groupId, memberId, userId)` - Supprimer un membre
- `DeleteGroupAsync(groupId, userId)` - Supprimer le groupe

**IChatGroupRepository** / **ChatGroupRepository**
- Gestion des opérations CRUD
- Chargement eager (Include) des relations
- Tri par dernier message

## 🖥️ Architecture Frontend

### Types TypeScript

```typescript
ChatGroupDto {
  id: string
  name: string
  description?: string
  createdById: string
  createdByUsername?: string
  createdAt: string
  lastMessageAt?: string
  memberCount: number
  messageCount: number
}

ChatGroupDetailDto extends ChatGroupDto {
  members: ChatGroupMemberDto[]
  messages: GroupMessageDto[]
}
```

### Composants

**GroupChatPanel**
- Affiche la liste des groupes
- Permet de sélectionner et ouvrir un groupe
- Affiche les messages avec auto-scroll
- Gère l'envoi de messages
- Permet de supprimer un groupe

**CreateGroupChatModal**
- Interface pour créer un nouveau groupe
- Sélection multiple des membres
- Validation du nom

### Hooks

**useChatGroups()**
- Récupère les groupes de l'utilisateur
- Polling tous les 3 secondes
- Retourne: `{ groups, loading, error, refetch }`

**useChatGroup(groupId)**
- Récupère les détails d'un groupe
- Polling des messages tous les 2 secondes
- Retourne: `{ group, loading, error, refetch }`

## 🔐 Sécurité et Permissions

### Contrôle d'Accès
- ✅ Authentification JWT obligatoire
- ✅ Utilisateur doit être membre pour voir les messages
- ✅ Seul le créateur peut supprimer le groupe
- ✅ Seuls les admins peuvent ajouter/supprimer des membres

### Validation
- Nom du groupe requis
- Au moins 1 membre (en plus du créateur)
- Messages non vides
- Évite d'ajouter le créateur deux fois

## 🔄 Temps Réel

### Polling
- **Messages**: 2 secondes (temps réel)
- **Groupes**: 3 secondes (actualisé)
- **Sans flickering**: Loading seulement au premier chargement

### Auto-Scroll
- Scroll automatique vers le dernier message
- Respect de la position de l'utilisateur s'il scrolle manuellement
- Transition smooth lors de nouveaux messages

## 📊 Données Stockées

La base de données PostgreSQL contient 3 nouvelles tables:

```sql
ChatGroups
- id (UUID)
- name (VARCHAR)
- description (TEXT)
- created_by_id (UUID)
- created_at (TIMESTAMP)
- last_message_at (TIMESTAMP)

ChatGroupMembers
- id (UUID)
- chat_group_id (UUID)
- user_id (UUID)
- joined_at (TIMESTAMP)
- is_admin (BOOLEAN)

GroupMessages
- id (UUID)
- chat_group_id (UUID)
- sender_id (UUID)
- content (TEXT)
- sent_at (TIMESTAMP)
```

## 🚀 Déploiement

### Backend
- Nouvelle migration EF Core: `AddChatGroups`
- Nouveaux contrôleurs et services
- Dépendances enregistrées en DI

### Frontend
- Nouveaux composants React
- Nouveaux hooks personnalisés
- Styles CSS pour le bouton des groupes
- Types TypeScript synchronisés

## 🧪 Test

Pour tester les groupes de chat:

1. **Via l'interface**:
   - Ouvrir le site à https://taajii.fr
   - Se connecter
   - Cliquer sur le bouton rose (👥)
   - Créer un groupe
   - Ajouter des utilisateurs
   - Envoyer des messages

2. **Via Swagger** (http://localhost:5000/swagger):
   - Login d'abord (POST /api/auth/login)
   - Copier le Bearer token
   - Cliquer "Authorize" et entrer le token
   - Tester les endpoints `/chatgroups`

## 📝 Prochaines Améliorations

- [ ] Recherche d'utilisateurs pour créer des groupes
- [ ] Affichage des utilisateurs en ligne
- [ ] Notifications pour les nouveaux messages de groupe
- [ ] Upload de fichiers/images dans les groupes
- [ ] Édition du nom/description du groupe
- [ ] Archivage de groupes
- [ ] Permissions granulaires (viewer, poster, admin)
- [ ] Historique des modifications du groupe

## 📞 Support

Pour toute question ou bug, veuillez vérifier:
1. Les logs backend: `sigac-backend/logs/sigac-*.txt`
2. La console du navigateur: F12 → Console
3. Les migrations EF Core ont bien été appliquées

