# Backend Updates Required - Calendar Statut/Rappel

## 📋 Vue d'Ensemble

Le frontend a été mis à jour pour supporter:
- **5 types d'événements** (Reunion, Audience, Formation, Deadline, Personnel)
- **4 statuts workflow** (Planifie, EnCours, Termine, Reporte)
- **Rappels automatiques** (0 à 1440 minutes avant)
- **Participants multi-select** avec recherche

Le backend doit être mis à jour pour persister ces nouvelles données.

---

## 🗄️ Étape 1: Appliquer Migration SQL

### Connexion à PostgreSQL Render

```bash
# Option 1: Depuis Render Dashboard
# 1. https://dashboard.render.com
# 2. Cliquer sur votre PostgreSQL "sigac-db"
# 3. Onglet "Shell" → Ouvrir console PSQL
# 4. Copier-coller le contenu de migration-calendar-statut-rappel.sql

# Option 2: Via script automatique
cd /workspaces/SIGAC/deployment
export DATABASE_URL="postgres://sigac_user:password@postgres-host.render.com:5432/sigac_db"
./apply-calendar-statut-migration.sh
```

### Fichier Migration

**Emplacement:** `/workspaces/SIGAC/deployment/migration-calendar-statut-rappel.sql`

**Contenu:**
```sql
ALTER TABLE "CalendarEvents" 
ADD COLUMN IF NOT EXISTS "Statut" VARCHAR(50) DEFAULT 'Planifie' NOT NULL,
ADD COLUMN IF NOT EXISTS "RappelAvant" INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS "Participants" TEXT;

CREATE INDEX IF NOT EXISTS "IX_CalendarEvents_Statut" ON "CalendarEvents" ("Statut");
CREATE INDEX IF NOT EXISTS "IX_CalendarEvents_DateDebut_RappelAvant" ON "CalendarEvents" ("DateDebut", "RappelAvant");
```

---

## 🔧 Étape 2: Mettre à Jour Entity

**Fichier:** `SIGAC.Core/Entities/CalendarEvent.cs`

```csharp
public class CalendarEvent
{
    public Guid Id { get; set; }
    public string Type { get; set; }
    public string Titre { get; set; }
    public string? Description { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
    public bool TouteLaJournee { get; set; }
    public Guid? DossierId { get; set; }
    public Guid? SalleId { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public Guid? CreatedByUserId { get; set; }
    
    // ⭐ NOUVEAUX CHAMPS
    public string Statut { get; set; } = "Planifie";      // Valeurs: Planifie, EnCours, Termine, Reporte
    public int? RappelAvant { get; set; } = 30;           // Minutes avant événement (0 à 1440)
    public string? Participants { get; set; }              // JSON array de User IDs: ["guid1", "guid2"]
    
    // Navigation properties
    public Dossier? Dossier { get; set; }
    public Salle? Salle { get; set; }
}
```

---

## 📦 Étape 3: Mettre à Jour DTOs

### CalendarEventDto.cs

**Fichier:** `SIGAC.Core/DTOs/CalendarEventDto.cs`

```csharp
public class CalendarEventDto
{
    public Guid Id { get; set; }
    public string Type { get; set; }
    public string Titre { get; set; }
    public string? Description { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
    public bool TouteLaJournee { get; set; }
    public Guid? DossierId { get; set; }
    public Guid? SalleId { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // ⭐ NOUVEAUX CHAMPS
    public string? Statut { get; set; }                   // Default: "Planifie"
    public int? RappelAvant { get; set; }                 // Default: 30 (minutes)
    public List<Guid>? Participants { get; set; }         // Liste de User IDs
}
```

### CreateCalendarEventDto.cs

**Fichier:** `SIGAC.Core/DTOs/CreateCalendarEventDto.cs`

```csharp
public class CreateCalendarEventDto
{
    [Required]
    public string Type { get; set; }
    
    [Required]
    [StringLength(200)]
    public string Titre { get; set; }
    
    public string? Description { get; set; }
    
    [Required]
    public DateTime DateDebut { get; set; }
    
    [Required]
    public DateTime DateFin { get; set; }
    
    public bool TouteLaJournee { get; set; }
    public Guid? DossierId { get; set; }
    public Guid? SalleId { get; set; }
    
    // ⭐ NOUVEAUX CHAMPS
    public string? Statut { get; set; } = "Planifie";
    public int? RappelAvant { get; set; } = 30;
    public List<Guid>? Participants { get; set; }
}
```

### UpdateCalendarEventDto.cs

**Fichier:** `SIGAC.Core/DTOs/UpdateCalendarEventDto.cs`

```csharp
public class UpdateCalendarEventDto
{
    public string? Type { get; set; }
    public string? Titre { get; set; }
    public string? Description { get; set; }
    public DateTime? DateDebut { get; set; }
    public DateTime? DateFin { get; set; }
    public bool? TouteLaJournee { get; set; }
    public Guid? DossierId { get; set; }
    public Guid? SalleId { get; set; }
    
    // ⭐ NOUVEAUX CHAMPS
    public string? Statut { get; set; }
    public int? RappelAvant { get; set; }
    public List<Guid>? Participants { get; set; }
}
```

---

## 🗺️ Étape 4: Mettre à Jour Mapping Profile

**Fichier:** `SIGAC.Core/Mapping/CalendarMappingProfile.cs`

```csharp
using AutoMapper;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using System.Text.Json;

public class CalendarMappingProfile : Profile
{
    public CalendarMappingProfile()
    {
        // Entity → DTO
        CreateMap<CalendarEvent, CalendarEventDto>()
            .ForMember(dest => dest.Participants, opt => opt.MapFrom(src => 
                string.IsNullOrEmpty(src.Participants) 
                    ? new List<Guid>() 
                    : JsonSerializer.Deserialize<List<Guid>>(src.Participants)
            ));
        
        // CreateDTO → Entity
        CreateMap<CreateCalendarEventDto, CalendarEvent>()
            .ForMember(dest => dest.Participants, opt => opt.MapFrom(src => 
                src.Participants != null && src.Participants.Any() 
                    ? JsonSerializer.Serialize(src.Participants) 
                    : null
            ));
        
        // UpdateDTO → Entity
        CreateMap<UpdateCalendarEventDto, CalendarEvent>()
            .ForMember(dest => dest.Participants, opt => opt.MapFrom(src => 
                src.Participants != null && src.Participants.Any() 
                    ? JsonSerializer.Serialize(src.Participants) 
                    : null
            ))
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
    }
}
```

**Note:** Participants stocké en base comme JSON string, converti en List<Guid> pour DTOs.

---

## 🔐 Étape 5: Validation Métier

### CalendarService.cs

**Fichier:** `SIGAC.Core/Services/CalendarService.cs`

Ajouter validation pour les nouveaux champs:

```csharp
private void ValidateCreateEvent(CreateCalendarEventDto dto)
{
    // Validation existante...
    
    // ⭐ NOUVELLES VALIDATIONS
    
    // Statut doit être valide
    var validStatuts = new[] { "Planifie", "EnCours", "Termine", "Reporte" };
    if (!string.IsNullOrEmpty(dto.Statut) && !validStatuts.Contains(dto.Statut))
    {
        throw new ArgumentException($"Statut invalide. Valeurs autorisées: {string.Join(", ", validStatuts)}");
    }
    
    // RappelAvant doit être positif
    if (dto.RappelAvant.HasValue && dto.RappelAvant.Value < 0)
    {
        throw new ArgumentException("RappelAvant doit être >= 0 (en minutes)");
    }
    
    // Participants doivent exister (optionnel, selon besoin)
    if (dto.Participants != null && dto.Participants.Any())
    {
        // Vérifier que les User IDs existent en base
        var existingUserIds = _userRepository.GetByIds(dto.Participants).Select(u => u.Id).ToList();
        var invalidIds = dto.Participants.Except(existingUserIds).ToList();
        
        if (invalidIds.Any())
        {
            throw new ArgumentException($"Participants invalides: {string.Join(", ", invalidIds)}");
        }
    }
}
```

---

## 📝 Étape 6: Créer Migration EF Core (Optionnel)

Si vous utilisez Code-First avec EF Migrations:

```bash
cd /workspaces/SIGAC/sigac-backend

dotnet ef migrations add AddStatutRappelToCalendar \
    --project SIGAC.Infrastructure \
    --startup-project SIGAC.API
```

**Fichier généré:** `SIGAC.Infrastructure/Migrations/{timestamp}_AddStatutRappelToCalendar.cs`

```csharp
public partial class AddStatutRappelToCalendar : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Statut",
            table: "CalendarEvents",
            type: "character varying(50)",
            maxLength: 50,
            nullable: false,
            defaultValue: "Planifie");

        migrationBuilder.AddColumn<int>(
            name: "RappelAvant",
            table: "CalendarEvents",
            type: "integer",
            nullable: true,
            defaultValue: 30);

        migrationBuilder.AddColumn<string>(
            name: "Participants",
            table: "CalendarEvents",
            type: "text",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_CalendarEvents_Statut",
            table: "CalendarEvents",
            column: "Statut");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_CalendarEvents_Statut",
            table: "CalendarEvents");

        migrationBuilder.DropColumn(name: "Statut", table: "CalendarEvents");
        migrationBuilder.DropColumn(name: "RappelAvant", table: "CalendarEvents");
        migrationBuilder.DropColumn(name: "Participants", table: "CalendarEvents");
    }
}
```

---

## 🧪 Étape 7: Tests

### Test unitaire CalendarService

**Fichier:** `SIGAC.Tests/Unit/Services/CalendarServiceTests.cs`

```csharp
[Test]
public async Task CreateEvent_WithStatutAndRappel_Success()
{
    // Arrange
    var dto = new CreateCalendarEventDto
    {
        Type = "Formation",
        Titre = "Formation TypeScript",
        DateDebut = DateTime.UtcNow.AddDays(7),
        DateFin = DateTime.UtcNow.AddDays(7).AddHours(4),
        Statut = "Planifie",
        RappelAvant = 60, // 1 heure
        Participants = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() }
    };
    
    // Act
    var result = await _calendarService.CreateAsync(dto, _userId);
    
    // Assert
    Assert.IsNotNull(result);
    Assert.AreEqual("Planifie", result.Statut);
    Assert.AreEqual(60, result.RappelAvant);
    Assert.AreEqual(2, result.Participants.Count);
}

[Test]
public void CreateEvent_InvalidStatut_ThrowsException()
{
    // Arrange
    var dto = new CreateCalendarEventDto
    {
        Type = "Reunion",
        Titre = "Test",
        DateDebut = DateTime.UtcNow,
        DateFin = DateTime.UtcNow.AddHours(1),
        Statut = "InvalidStatus" // ❌ Invalide
    };
    
    // Act & Assert
    Assert.ThrowsAsync<ArgumentException>(
        () => _calendarService.CreateAsync(dto, _userId)
    );
}
```

### Test intégration API

**Postman / curl:**

```bash
# POST /api/calendar
curl -X POST http://localhost:5210/api/calendar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Formation",
    "titre": "Formation Sécurité",
    "description": "Formation obligatoire",
    "dateDebut": "2025-02-15T09:00:00Z",
    "dateFin": "2025-02-15T17:00:00Z",
    "touteLaJournee": false,
    "salleId": "guid-salle-1",
    "statut": "Planifie",
    "rappelAvant": 60,
    "participants": [
      "guid-user-1",
      "guid-user-2",
      "guid-user-3"
    ]
  }'

# Réponse attendue: 201 Created
{
  "id": "new-guid",
  "type": "Formation",
  "titre": "Formation Sécurité",
  "statut": "Planifie",
  "rappelAvant": 60,
  "participants": ["guid-user-1", "guid-user-2", "guid-user-3"],
  "createdAt": "2025-01-29T10:00:00Z"
}
```

---

## 🚀 Étape 8: Déploiement

### 1. Appliquer migration PostgreSQL

```bash
# Via Render Dashboard
# 1. Copier migration-calendar-statut-rappel.sql
# 2. Shell → Coller → Enter

# Via script
export DATABASE_URL="postgres://..."
cd /workspaces/SIGAC/deployment
./apply-calendar-statut-migration.sh
```

### 2. Commit & Push backend

```bash
cd /workspaces/SIGAC/sigac-backend

git add .
git commit -m "feat(calendar): Add Statut, RappelAvant, Participants support

- Update CalendarEvent entity with new fields
- Update DTOs: CalendarEventDto, CreateDto, UpdateDto
- Update CalendarMappingProfile for JSON serialization
- Add validation for Statut and RappelAvant
- Add indexes for query optimization"

git push origin main
```

### 3. Redéployer sur Render

**Option A: Auto-deploy (si configuré)**
- Push sur main déclenche auto-deploy

**Option B: Manuel**
```bash
# Via Render Dashboard
# 1. https://dashboard.render.com
# 2. Sélectionner "sigac-api"
# 3. Cliquer "Manual Deploy" → "Deploy latest commit"
```

### 4. Vérifier déploiement

```bash
# Health check
curl https://sigac-api.onrender.com/health

# Test création événement avec nouveaux champs
curl -X POST https://sigac-api.onrender.com/api/calendar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"Formation","titre":"Test","dateDebut":"2025-02-01T10:00:00","dateFin":"2025-02-01T11:00:00","statut":"Planifie","rappelAvant":30}'
```

---

## 📊 Checklist Finale

### Base de Données
- [ ] Migration SQL appliquée sur Render PostgreSQL
- [ ] Colonnes créées: Statut, RappelAvant, Participants
- [ ] Index créés: IX_CalendarEvents_Statut, IX_CalendarEvents_DateDebut_RappelAvant
- [ ] Événements existants mis à jour avec valeurs par défaut

### Backend Code
- [ ] Entity CalendarEvent modifiée
- [ ] DTOs mis à jour (CalendarEventDto, CreateDto, UpdateDto)
- [ ] CalendarMappingProfile mis à jour (JSON serialization)
- [ ] Validation ajoutée dans CalendarService
- [ ] Tests unitaires créés
- [ ] Code compilé sans erreurs

### Déploiement
- [ ] Code commité dans Git
- [ ] Push sur main
- [ ] Backend redéployé sur Render
- [ ] Health check OK
- [ ] Test API création événement avec nouveaux champs

### Frontend Integration
- [ ] Test création événement depuis UI
- [ ] Vérifier payload POST contient statut/rappelAvant/participants
- [ ] Vérifier GET events retourne nouveaux champs
- [ ] Aucune erreur 400/500

---

## 🐛 Troubleshooting

### Erreur: Column "Statut" does not exist

**Cause:** Migration SQL non appliquée

**Solution:**
```bash
export DATABASE_URL="..."
psql "$DATABASE_URL" -f /workspaces/SIGAC/deployment/migration-calendar-statut-rappel.sql
```

---

### Erreur: Cannot deserialize JSON Participants

**Cause:** Format JSON invalide en base

**Solution:**
```sql
-- Nettoyer les valeurs invalides
UPDATE "CalendarEvents" 
SET "Participants" = NULL 
WHERE "Participants" IS NOT NULL 
  AND "Participants" NOT LIKE '[%]';
```

---

### Erreur: AutoMapper missing configuration

**Cause:** CalendarMappingProfile pas mis à jour

**Solution:**
1. Vérifier `CalendarMappingProfile.cs` contient les nouveaux mappings
2. Rebuild projet: `dotnet build`
3. Redémarrer API: `dotnet run --project SIGAC.API`

---

## 📞 Support

**Documentation:**
- Architecture: `/workspaces/SIGAC/.github/copilot-instructions.md`
- Vision complète: `/workspaces/SIGAC/CALENDAR_COMPLETE_VISION.md`
- Guide test: `/workspaces/SIGAC/TEST_CALENDAR_GUIDE.md`

**Fichiers modifiés:**
- Entity: `SIGAC.Core/Entities/CalendarEvent.cs`
- DTOs: `SIGAC.Core/DTOs/Calendar*.cs`
- Mapping: `SIGAC.Core/Mapping/CalendarMappingProfile.cs`
- Service: `SIGAC.Core/Services/CalendarService.cs`
- Migration: `/workspaces/SIGAC/deployment/migration-calendar-statut-rappel.sql`

---

**Dernière mise à jour:** 2025-01-29  
**Priorité:** Haute - Bloque features frontend  
**Estimation:** 2-3 heures développement + tests
