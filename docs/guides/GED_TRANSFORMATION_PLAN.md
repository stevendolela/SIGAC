# 🚀 SIGAC → GED Collaborative - Plan de Transformation

**Date**: Décembre 2024  
**Vision**: Transformer SIGAC d'un système judiciaire vers une **plateforme GED collaborative moderne**

---

## 📋 ANALYSE DE L'EXISTANT

### Architecture Actuelle (✅ Solide)

**Backend (.NET 8)**
- ✅ Entity Framework Core + PostgreSQL
- ✅ Architecture 3-tier (API, Core, Infrastructure)
- ✅ JWT Authentication + RBAC
- ✅ AutoMapper, Serilog, Audit complet
- ✅ Repository pattern, service layer

**Entities Principales**
```
├── Dossier (Case/Folder)
│   ├── NumeroDossier, Titre, TypeAffaire
│   ├── Status, Priorite
│   ├── Documents, Historiques
│   └── Rapporteur (assignee)
├── Document
│   ├── Versioning (NumeroVersion)
│   ├── Security (EstConfidentiel, HashSHA256)
│   └── Metadata (TypeDocument, MimeType)
├── User
│   ├── Roles (Admin, President, Juge)
│   └── Audit trail
├── Audience (Calendar events)
├── Chat (1-to-1 + Groups)
└── AuditLog (Full traceability)
```

**Frontend (React + TypeScript)**
- ✅ Vite build system
- ✅ Custom hooks, API clients
- ✅ Responsive design
- ✅ Real-time updates (polling)

---

## 🎯 NOUVELLE VISION GED

### Modèle Conceptuel

```
WORKSPACE (Organization)
├── TEAMS (Collaboration units)
│   └── MEMBERS (Users with permissions)
├── PROJECTS (ex-Dossiers)
│   ├── FOLDERS (Hierarchical structure)
│   │   └── DOCUMENTS (Files with versions)
│   ├── WORKFLOWS (Automated processes)
│   ├── TASKS (Planning items)
│   └── TIMELINE (Gantt chart)
├── TEMPLATES (Reusable structures)
└── TAGS (Cross-cutting organization)
```

### Transformation du Vocabulaire

| Ancien (Judiciaire) | Nouveau (GED) | Notes |
|---------------------|---------------|-------|
| Dossier | **Project** | Container principal |
| TypeAffaire | **ProjectType** ou **Template** | Catégorie |
| Rapporteur | **Owner** ou **ProjectManager** | Assignee principal |
| Status | **ProjectStatus** | Workflow state |
| Audience | **Event** ou **Milestone** | Calendar item |
| Formation | **Team** | Collaborative unit |
| Demandeur/Defendeur | **Client** / **Stakeholder** | External party |

---

## 🏗️ PLAN DE REFACTORING

### Phase 1: Renommage Sémantique (1-2 semaines)

**Backend**
```
Dossier.cs → Project.cs
├── NumeroDossier → ProjectNumber
├── TypeAffaire → ProjectType
├── Rapporteur → Owner
├── Demandeur → Client
└── Status (StatusDossier) → ProjectStatus

TypeAffaire.cs → ProjectTemplate.cs
├── Nom → Name
└── Description → Description

Formation.cs → Team.cs
├── Membres → Members
└── DateDebut/DateFin → StartDate/EndDate
```

**Migration SQL**
```sql
-- Rename tables
ALTER TABLE "Dossiers" RENAME TO "Projects";
ALTER TABLE "TypesAffaires" RENAME TO "ProjectTemplates";
ALTER TABLE "Formations" RENAME TO "Teams";

-- Rename columns
ALTER TABLE "Projects" RENAME COLUMN "NumeroDossier" TO "ProjectNumber";
ALTER TABLE "Projects" RENAME COLUMN "RapporteurId" TO "OwnerId";
-- etc.
```

**DTOs & Services**
```
DossierDto → ProjectDto
DossierService → ProjectService
DossierRepository → ProjectRepository
DossierController → ProjectsController
```

**Frontend**
```
types/dossier.ts → types/project.ts
api/dossierApi.ts → api/projectApi.ts
components/dossiers/ → components/projects/
pages/DossierList → pages/ProjectList
```

### Phase 2: Nouveaux Modules GED (2-4 semaines)

#### 1. **Workspace Management**
```csharp
// Backend: SIGAC.Core/Entities/Workspace.cs
public class Workspace
{
    public Guid Id { get; set; }
    public string Name { get; set; }  // Organization name
    public string Slug { get; set; }  // URL-friendly
    public string? LogoUrl { get; set; }
    public Guid OwnerId { get; set; }  // Creator
    public User Owner { get; set; }
    
    // Settings
    public int MaxStorageGB { get; set; } = 100;
    public int MaxUsers { get; set; } = 50;
    public bool AllowGuestAccess { get; set; }
    
    // Relations
    public ICollection<Team> Teams { get; set; }
    public ICollection<Project> Projects { get; set; }
    public ICollection<WorkspaceUser> Members { get; set; }
    
    public DateTime CreatedAt { get; set; }
}

// Junction table for workspace members
public class WorkspaceUser
{
    public Guid WorkspaceId { get; set; }
    public Guid UserId { get; set; }
    public WorkspaceRole Role { get; set; }  // Admin, Member, Guest
    public DateTime JoinedAt { get; set; }
}

public enum WorkspaceRole
{
    Admin,
    Member,
    Guest
}
```

#### 2. **Hierarchical Folders**
```csharp
// Backend: SIGAC.Core/Entities/Folder.cs
public class Folder
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public Guid ProjectId { get; set; }
    public Project Project { get; set; }
    
    // Hierarchie
    public Guid? ParentFolderId { get; set; }
    public Folder? ParentFolder { get; set; }
    public ICollection<Folder> SubFolders { get; set; }
    
    // Documents
    public ICollection<Document> Documents { get; set; }
    
    // Permissions
    public bool IsPublic { get; set; }
    public ICollection<FolderPermission> Permissions { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
}

public class FolderPermission
{
    public Guid FolderId { get; set; }
    public Guid UserId { get; set; }
    public PermissionLevel Level { get; set; }  // Read, Write, Admin
}

public enum PermissionLevel
{
    Read,
    Write,
    Admin
}
```

#### 3. **Advanced Document Management**
```csharp
// Extend existing Document entity
public class Document
{
    // ... existing properties ...
    
    // Versioning (enhanced)
    public Guid? PreviousVersionId { get; set; }
    public Document? PreviousVersion { get; set; }
    public ICollection<Document> Versions { get; set; }
    public bool IsLatestVersion { get; set; } = true;
    
    // Metadata
    public Dictionary<string, string> Metadata { get; set; }  // JSON
    public ICollection<DocumentTag> Tags { get; set; }
    
    // Collaboration
    public ICollection<DocumentComment> Comments { get; set; }
    public ICollection<DocumentShare> Shares { get; set; }
    
    // OCR & Search
    public string? ExtractedText { get; set; }  // OCR result
    public bool IsIndexed { get; set; }
    
    // Folder (NEW)
    public Guid? FolderId { get; set; }
    public Folder? Folder { get; set; }
}

public class DocumentComment
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; }
    public int? PageNumber { get; set; }  // For PDF annotation
    public DateTime CreatedAt { get; set; }
}

public class DocumentShare
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public Guid SharedWithUserId { get; set; }
    public PermissionLevel Permission { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
```

#### 4. **Tags System**
```csharp
public class Tag
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Color { get; set; }  // Hex color
    public Guid WorkspaceId { get; set; }
    
    // Relations
    public ICollection<ProjectTag> Projects { get; set; }
    public ICollection<DocumentTag> Documents { get; set; }
}

public class ProjectTag
{
    public Guid ProjectId { get; set; }
    public Guid TagId { get; set; }
}

public class DocumentTag
{
    public Guid DocumentId { get; set; }
    public Guid TagId { get; set; }
}
```

#### 5. **Workflow Automation**
```csharp
public class Workflow
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public Guid ProjectId { get; set; }
    
    // Triggers
    public WorkflowTrigger Trigger { get; set; }  // OnDocumentUpload, OnStatusChange
    
    // Actions (JSON stored)
    public List<WorkflowAction> Actions { get; set; }
    /*
    Example Actions:
    - NotifyUser(userId)
    - MoveDocument(folderId)
    - ApplyTag(tagId)
    - ChangeProjectStatus(status)
    - SendEmail(to, template)
    */
    
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public enum WorkflowTrigger
{
    OnDocumentUpload,
    OnProjectStatusChange,
    OnTaskComplete,
    OnDueDate,
    Manual
}
```

#### 6. **Task Management**
```csharp
public class Task
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string? Description { get; set; }
    
    // Assignment
    public Guid ProjectId { get; set; }
    public Guid? AssignedToId { get; set; }
    public Guid CreatedBy { get; set; }
    
    // Status & Priority
    public TaskStatus Status { get; set; }  // Todo, InProgress, Done
    public TaskPriority Priority { get; set; }
    
    // Dates
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    
    // Relations
    public ICollection<TaskComment> Comments { get; set; }
    public ICollection<TaskAttachment> Attachments { get; set; }
    
    public DateTime CreatedAt { get; set; }
}

public enum TaskStatus
{
    Todo,
    InProgress,
    Review,
    Done,
    Cancelled
}

public enum TaskPriority
{
    Low,
    Normal,
    High,
    Urgent
}
```

### Phase 3: Frontend Refonte (2-3 semaines)

#### Nouvelle Architecture UI

```
sigac-frontend/src/
├── features/          (Feature-based organization)
│   ├── workspace/
│   │   ├── WorkspaceSelector.tsx
│   │   ├── WorkspaceSettings.tsx
│   │   └── useWorkspace.ts
│   ├── projects/
│   │   ├── ProjectList.tsx
│   │   ├── ProjectBoard.tsx (Kanban view)
│   │   ├── ProjectTimeline.tsx (Gantt)
│   │   └── useProjects.ts
│   ├── documents/
│   │   ├── DocumentExplorer.tsx (Tree view)
│   │   ├── DocumentViewer.tsx (Preview)
│   │   ├── DocumentVersions.tsx
│   │   └── useDocuments.ts
│   ├── tasks/
│   │   ├── TaskList.tsx
│   │   ├── TaskBoard.tsx (Kanban)
│   │   └── useTasks.ts
│   ├── calendar/
│   │   ├── CalendarView.tsx
│   │   ├── GanttChart.tsx
│   │   └── useCalendar.ts
│   ├── teams/
│   │   ├── TeamList.tsx
│   │   ├── TeamMembers.tsx
│   │   └── useTeams.ts
│   └── search/
│       ├── GlobalSearch.tsx
│       ├── AdvancedSearch.tsx
│       └── useSearch.ts
├── components/        (Shared components)
│   ├── common/
│   ├── layout/
│   └── forms/
└── lib/              (Utilities)
    ├── api/
    ├── hooks/
    └── utils/
```

#### Design System Upgrade

**Modern GED UI Components**
```tsx
// Tree view for folders
<FolderTree>
  <Folder name="Contracts" icon="📁">
    <Folder name="2024" icon="📁">
      <Document name="Contract_ABC.pdf" />
    </Folder>
  </Folder>
</FolderTree>

// Kanban board for tasks
<TaskBoard>
  <Column title="To Do" tasks={todoTasks} />
  <Column title="In Progress" tasks={inProgressTasks} />
  <Column title="Done" tasks={doneTasks} />
</TaskBoard>

// Gantt chart for timeline
<GanttChart projects={projects} />

// Document preview with annotations
<DocumentViewer 
  documentId={id} 
  allowComments={true}
  allowVersionComparison={true}
/>
```

---

## 🔄 STRATÉGIE DE MIGRATION

### Option A: Migration Incrémentale (RECOMMANDÉE)

**Avantages**: Zéro downtime, rollback facile, validation continue

**Étapes**:
1. **Semaine 1-2**: Backend aliasing
   - Créer aliases `Project = Dossier` via `using`
   - Ajouter nouveaux endpoints en parallèle (`/api/projects` + `/api/dossiers`)
   - Tous les deux pointent vers le même service

2. **Semaine 3-4**: Frontend dual-mode
   - Nouveau code utilise `/api/projects`
   - Ancien code continue `/api/dossiers`
   - Toggle feature flag pour A/B testing

3. **Semaine 5-6**: Migration DB
   - Renommer tables/colonnes en production (pendant maintenance)
   - Garder vues SQL pour compatibilité:
     ```sql
     CREATE VIEW "Dossiers" AS SELECT * FROM "Projects";
     ```

4. **Semaine 7-8**: Cleanup
   - Supprimer anciens endpoints
   - Supprimer vues SQL de compatibilité

### Option B: Migration Big Bang (RISQUÉE)

**Avantages**: Plus rapide, code plus propre immédiatement

**Étapes**:
1. Créer branche `ged-refactor`
2. Refactor complet en 2-3 semaines
3. Testing exhaustif en staging
4. Déploiement en production (weekend)
5. Monitoring intensif post-déploiement

---

## 📊 PRIORISATION DES FEATURES

### Must-Have (MVP GED) - Phase 1

1. ✅ **Workspace Management**
   - Créer/gérer workspaces
   - Inviter membres
   - Permissions de base

2. ✅ **Renommage Sémantique**
   - Dossier → Project
   - UI labels mis à jour

3. ✅ **Folders Hiérarchiques**
   - Créer dossiers/sous-dossiers
   - Drag & drop documents

4. ✅ **Document Versioning**
   - Upload nouvelle version
   - Historique des versions
   - Comparaison versions

5. ✅ **Tags System**
   - Créer tags colorés
   - Appliquer à projects/documents
   - Filter par tags

### Nice-to-Have - Phase 2

6. ⏳ **Advanced Search**
   - Full-text search (PostgreSQL FTS)
   - Filter combinés
   - Saved searches

7. ⏳ **Task Management**
   - CRUD tasks
   - Kanban board
   - Assignations

8. ⏳ **Workflow Automation**
   - Triggers configurables
   - Actions automatisées

9. ⏳ **Document Collaboration**
   - Comments sur documents
   - @mentions
   - Real-time presence

### Future - Phase 3+

10. 🔮 **OCR & AI**
    - Extraction texte (Tesseract)
    - Classification auto documents
    - Suggestions tags

11. 🔮 **Advanced Calendar**
    - Gantt charts (avec library)
    - Resource allocation
    - Dependencies

12. 🔮 **Integrations**
    - Slack/Teams notifications
    - Google Drive sync
    - Email-to-GED

---

## 🛠️ STACK TECHNIQUE

### Backend (Unchanged ✅)
- .NET 8 + EF Core + PostgreSQL
- JWT + RBAC
- AutoMapper, Serilog

### Frontend (Enhancements)
- React 18 + TypeScript
- **TanStack Query** (remplace hooks customs pour cache)
- **Zustand** (state global)
- **DnD Kit** (drag & drop)
- **React Flow** (Gantt charts option)
- **PDF.js** (preview PDFs)

### New Services
- **Elasticsearch** (optional: advanced search)
- **Tesseract** (optional: OCR)
- **MinIO / S3** (optional: object storage)

---

## 📈 MÉTRIQUES DE SUCCÈS

### KPIs GED

| Métrique | Avant (Judiciaire) | Target (GED) |
|----------|-------------------|--------------|
| User adoption | Juges only (5-10) | All teams (50+) |
| Document uploads/day | 5-10 | 50-100 |
| Search queries/day | 10-20 | 100-200 |
| Collaboration (comments/shares) | 0 | 50+ |
| Storage usage | <5GB | 50-100GB |

---

## 🚨 RISQUES & MITIGATION

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Data loss pendant migration | 🔴 Haut | 🟡 Moyen | Backups + test migrations |
| Downtime prolongé | 🟡 Moyen | 🟢 Bas | Migration incrémentale |
| Users confus (nouveau vocab) | 🟡 Moyen | 🔴 Haut | Tooltips + documentation |
| Performance dégradée | 🟡 Moyen | 🟡 Moyen | Indexation DB + caching |

---

## 📅 TIMELINE ESTIMÉE

**Phase 1 (MVP GED)**: 6-8 semaines
- Semaines 1-2: Workspace + renommage backend
- Semaines 3-4: Folders + versioning
- Semaines 5-6: Tags + frontend refonte
- Semaines 7-8: Testing + déploiement

**Phase 2 (Features avancées)**: 4-6 semaines
- Semaines 9-10: Search + tasks
- Semaines 11-12: Workflows
- Semaines 13-14: Collaboration features

**Phase 3 (AI & Integrations)**: 8-12 semaines
- Long-term roadmap

**TOTAL**: 4-6 mois pour GED complète

---

## ✅ NEXT ACTIONS

Choisir la stratégie:

### Option 1: Refactor Progressif ⭐ RECOMMANDÉ
```bash
# Semaine 1: Start small
1. Créer branch ged-refactor
2. Renommer Dossier → Project (aliases)
3. Créer Workspace entity
4. Migration DB incrémentale
5. Deploy en staging pour validation
```

### Option 2: POC Rapide
```bash
# 1 semaine: Proof of concept
1. Fork codebase
2. Workspace + Folders (CRUD seulement)
3. Demo UI moderne
4. Présenter stakeholders
5. Décider go/no-go
```

---

**Quelle approche préférez-vous?** Je peux commencer immédiatement! 🚀
