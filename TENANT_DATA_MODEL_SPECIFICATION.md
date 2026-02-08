# Tenant Service - Data Model Documentation

## Entity Relationships

```
Tenant (SaaS Client)
  ├─── 1:N --→ Workspace (Departments, Branches)
  ├─── 1:N --→ TenantUser (Users scoped to this tenant)
  ├─── 1:N --→ TenantSubscription (Billing history)
  ├─── 1:N --→ TenantUsageEvent (Feature usage tracking)
  └─── 1:N --→ AuditLog (Compliance trail) 

Workspace
  ├─── 1:N --→ Document (Files uploaded)
  ├─── 1:N --→ Dossier (Cases/Projects)
  ├─── 1:N --→ Audience (Court hearings, meetings, consultations)
  └─── 1:N --→ WorkspaceUser (Staff assignments)
```

---

## Tenant Entity

### Table: `Tenants`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `Id` | UUID | PRIMARY KEY | Unique tenant identifier |
| `Name` | VARCHAR(255) | NOT NULL, UNIQUE | Organization name (e.g., "Cour Constitutionnelle RDC") |
| `Slug` | VARCHAR(100) | NOT NULL, UNIQUE | URL-friendly identifier (e.g., "cour-rdc") |
| `LogoBase64` | TEXT | NULL | Base64-encoded logo image |
| `ContactEmail` | VARCHAR(255) | NOT NULL | Primary contact email |
| `ContactPhone` | VARCHAR(20) | NULL | Phone number |
| `Plan` | INT | NOT NULL, DEFAULT=0 | SaaS plan tier (see TenantPlanEnum) |
| `MaxUsers` | INT | NOT NULL, DEFAULT=10 | User quota per plan |
| `MaxStorageGB` | BIGINT | NOT NULL, DEFAULT=5 | Storage quota per plan |
| `MaxWorkspaces` | INT | NOT NULL, DEFAULT=2 | Workspace/department quota |
| `SubscriptionStartDate` | TIMESTAMP | NOT NULL | When subscription begins |
| `SubscriptionEndDate` | TIMESTAMP | NULL | When subscription ends (null=no end date) |
| `StripeCustomerId` | VARCHAR(255) | NULL | Stripe customer ID for billing |
| `StripeSubscriptionId` | VARCHAR(255) | NULL | Current Stripe subscription |
| `IsActive` | BOOLEAN | NOT NULL, DEFAULT=true | Soft delete flag |
| `CreatedAt` | TIMESTAMP | NOT NULL, DEFAULT=NOW() | Creation timestamp |
| `DeletedAt` | TIMESTAMP | NULL | Soft delete timestamp |
| `TenantId` | UUID | FK → Tenants(Id) | **Multi-tenant column** (self-reference for system Tenants) |

### Indexes
```sql
CREATE UNIQUE INDEX idx_tenants_slug ON Tenants(Slug) WHERE IsActive = true;
CREATE INDEX idx_tenants_created_at ON Tenants(CreatedAt DESC);
CREATE INDEX idx_tenants_plan ON Tenants(Plan);
```

---

## TenantSubscription Entity

### Table: `TenantSubscriptions`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `Id` | UUID | PRIMARY KEY | Subscription record ID |
| `TenantId` | UUID | FK → Tenants(Id) NOT NULL | Associated tenant |
| `Plan` | INT | NOT NULL | Plan tier at subscription time |
| `StartDate` | TIMESTAMP | NOT NULL | Subscription start date |
| `EndDate` | TIMESTAMP | NULL | Subscription end date (null=ongoing) |
| `MonthlyCostEuro` | DECIMAL(10,2) | NULL | EUR charge per month |
| `StripeSubscriptionId` | VARCHAR(255) | NULL | Stripe subscription ID |
| `Status` | INT | NOT NULL, DEFAULT=1 | 0=Inactive, 1=Active, 2=Cancelled, 3=Suspended |
| `AutoRenew` | BOOLEAN | NOT NULL, DEFAULT=true | Auto-renewal on expiration |
| `RenewDate` | TIMESTAMP | NULL | Expected renewal date (30 days before EndDate) |
| `CreatedAt` | TIMESTAMP | NOT NULL, DEFAULT=NOW() | Created timestamp |
| `UpdatedAt` | TIMESTAMP | NOT NULL | Last modification |

### Sample Data
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "plan": 2,  // Professional plan
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-12-31T23:59:59Z",
  "monthlyCostEuro": 399.00,
  "stripeSubscriptionId": "sub_1MpLx4DZR3e1lN0v8X2C3d4E5f",
  "status": 1,  // Active
  "autoRenew": true,
  "renewDate": "2025-12-01T00:00:00Z"
}
```

---

## TenantUsageEvent Entity

### Table: `TenantUsageEvents`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `Id` | UUID | PRIMARY KEY | Event ID |
| `TenantId` | UUID | FK → Tenants(Id) NOT NULL | Associated tenant |
| `Feature` | VARCHAR(100) | NOT NULL | Feature name (e.g., "document_upload", "api_call") |
| `Count` | INT | NOT NULL, DEFAULT=1 | Quantity consumed |
| `Metadata` | JSONB | NULL | Additional context (file size, duration, etc) |
| `EventDate` | TIMESTAMP | NOT NULL, DEFAULT=NOW() | When event occurred |

### Usage Examples

**Document Upload Event**
```json
{
  "feature": "document_upload",
  "count": 1,
  "metadata": {
    "fileSize": 2048576,  // 2 MB
    "mimeType": "application/pdf",
    "duration": 1200  // milliseconds
  }
}
```

**API Call Event**
```json
{
  "feature": "api_call",
  "count": 1,
  "metadata": {
    "endpoint": "/api/dossiers",
    "method": "GET",
    "statusCode": 200,
    "duration": 125
  }
}
```

**Storage Usage Snapshot**
```json
{
  "feature": "storage_usage_snapshot",
  "count": 0,  // Not counted
  "metadata": {
    "totalBytes": 10737418240,  // 10 GB
    "documentsCount": 450,
    "workspacesCount": 5
  }
}
```

---

## TenantUser Entity

### Table: `TenantUsers`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `Id` | UUID | PRIMARY KEY | Link ID |
| `TenantId` | UUID | FK → Tenants(Id) NOT NULL | Tenant association |
| `UserId` | UUID | FK → Users(Id) NOT NULL | User reference |
| `Role` | VARCHAR(50) | NOT NULL, DEFAULT='Member' | Tenant-level role |
| `IsActive` | BOOLEAN | NOT NULL, DEFAULT=true | Membership status |
| `JoinedAt` | TIMESTAMP | NOT NULL, DEFAULT=NOW() | When user joined tenant |
| `InvitedBy` | UUID | FK → Users(Id) NULL | Who invited this user |
| `InviteDate` | TIMESTAMP | NULL | When invited |
| `AcceptedAt` | TIMESTAMP | NULL | When invite accepted |

### Tenant Roles
- **Owner**: Full access, billing, tenant settings, user management
- **Admin**: Tenant admin rights, no billing access
- **Manager**: Department/workspace management
- **Member**: Standard member access
- **Guest**: Read-only access

---

## TenantPlanEnum

### Plan Tiers

| Tier | Value | MaxUsers | MaxStorageGB | MaxWorkspaces | PriceEUR/month | Features |
|------|-------|----------|--------------|---------------|---|---|
| **Free** | 0 | 5 | 1 | 1 | €0 | Core features, community support |
| **Starter** | 1 | 20 | 10 | 3 | €99 | + Priority support, advanced reports |
| **Professional** | 2 | 100 | 100 | 10 | €399 | + Team collaboration, audit logs, API access |
| **Enterprise** | 3 | 1000+ | 1000+ | 100+ | Custom | + SLA, dedicated support, custom integrations |
| **Custom** | 4 | Unlimited | Unlimited | Unlimited | Custom | Bespoke contracts |

---

## DTO Specifications

### TenantDto (Full Detail)

```typeScript
interface TenantDto {
  id: string;              // UUID
  name: string;            // Required
  slug: string;            // Required, lowercase
  logoBase64?: string;    // Optional, image data
  plan: TenantPlanEnum;    // Enum: Free|Starter|Professional|Enterprise|Custom
  maxUsers: number;        // Quota from plan
  maxStorageGB: bigint;   // Quota from plan
  maxWorkspaces: number;  // Quota from plan
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  isActive: boolean;       // Soft delete flag
  createdAt: Date;
  deletedAt?: Date;        // Null if not deleted
  userCount: number;       // Calculated
  workspaceCount: number;  // Calculated
  storageUsedGB: bigint;   // Calculated
}
```

### TenantListDto (Pagination View)

```typeScript
interface TenantListDto {
  id: string;
  name: string;
  slug: string;
  logoBase64?: string;
  plan: TenantPlanEnum;
  isActive: boolean;
  createdAt: Date;
  userCount: number;       // From TenantUsers count
  workspaceCount: number;  // From Workspaces count
}
```

### CreateTenantDto (POST Input)

```typeScript
interface CreateTenantDto {
  name: string;            // Required
  slug: string;            // Required, lowercase, unique
  logoBase64?: string;
  plan: TenantPlanEnum;    // Defaults to Free if omitted
  maxUsers?: number;       // Defaults from plan
  maxStorageGB?: bigint;   // Defaults from plan
  maxWorkspaces?: number;  // Defaults from plan
  stripeCustomerId?: string;
  contactEmail: string;    // Required
  contactPhone?: string;
}
```

### UpdateTenantDto (PUT Input - Partial)

```typeScript
interface UpdateTenantDto {
  name?: string;                  // Optional update
  logoBase64?: string;
  plan?: TenantPlanEnum;         // Optional, triggers plan change
  maxUsers?: number;
  maxStorageGB?: bigint;
  maxWorkspaces?: number;
  isActive?: boolean;             // Can deactivate without delete
}
```

### TenantSubscriptionDto

```typeScript
interface TenantSubscriptionDto {
  id: string;
  tenantId: string;
  plan: TenantPlanEnum;
  startDate: Date;
  endDate?: Date;
  monthlyCostEuro?: decimal;
  stripeSubscriptionId?: string;
  status: number;          // 0=Inactive, 1=Active, 2=Cancelled
  autoRenew: boolean;
  renewDate?: Date;
}
```

### CreateTenantSubscriptionDto (POST /subscriptions)

```typeScript
interface CreateTenantSubscriptionDto {
  plan: TenantPlanEnum;         // Required
  startDate: Date;               // Required
  endDate?: Date;               // Optional
  monthlyCostEuro?: decimal;    // Optional
  stripeSubscriptionId?: string;
  autoRenew?: boolean;          // Default: true
}
```

### TenantStatsDto (GET /stats)

```typeScript
interface TenantStatsDto {
  tenantId: string;
  userCount: number;           // Active users
  workspaceCount: number;      // Active workspaces
  storageUsedGB: bigint;       // Sum of all documents
  storageAvailableGB: bigint;  // From plan
  storagePercentUsed: number;  // (used / available) * 100
  documentCount: number;       // All documents
  dossierCount: number;        // All dossiers/cases
  lastActivityDate: Date;      // Most recent audit action
}
```

---

## Query Examples

### Get Storage Usage by Tenant

```sql
SELECT 
  t.Id,
  t.Name,
  t.MaxStorageGB,
  SUM(d.TailleFichier) / (1024 * 1024 * 1024) AS StorageUsedGB,
  (SUM(d.TailleFichier) / (1024 * 1024 * 1024)) * 100.0 / t.MaxStorageGB AS StoragePercent
FROM Tenants t
LEFT JOIN Workspaces w ON t.Id = w.TenantId
LEFT JOIN Dossiers dos ON w.Id = dos.WorkspaceId
LEFT JOIN Documents d ON dos.Id = d.DossierId
WHERE t.IsActive = true AND t.DeletedAt IS NULL
GROUP BY t.Id, t.Name, t.MaxStorageGB
ORDER BY StoragePercent DESC;
```

### Find Tenants Exceeding Storage Quota

```sql
SELECT t.Id, t.Name, SUM(d.TailleFichier) / (1024 * 1024 * 1024) AS UsedGB, t.MaxStorageGB
FROM Tenants t
LEFT JOIN Workspaces w ON t.Id = w.TenantId
LEFT JOIN Dossiers dos ON w.Id = dos.WorkspaceId
LEFT JOIN Documents d ON dos.Id = d.DossierId
GROUP BY t.Id, t.Name, t.MaxStorageGB
HAVING SUM(d.TailleFichier) / (1024 * 1024 * 1024) > t.MaxStorageGB;
```

### Subscription Renewals Due (Next 7 Days)

```sql
SELECT t.Name, ts.Plan, ts.RenewDate, ts.MonthlyCostEuro
FROM TenantSubscriptions ts
JOIN Tenants t ON ts.TenantId = t.Id
WHERE ts.Status = 1 
  AND ts.RenewDate BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY ts.RenewDate ASC;
```

### Audit Trail for Single Tenant

```sql
SELECT UserId, Action, EntityType, OldValues, NewValues, Timestamp
FROM AuditLogs
WHERE TenantId = 'xxx-xxx-xxx'
ORDER BY Timestamp DESC
LIMIT 50;
```

---

## Validation Rules

### Tenant.Name
- ✅ Required, non-empty
- ✅ Min 3 characters, Max 255 characters
- ✅ Can contain spaces, hyphens, apostrophes
- ❌ Cannot start/end with whitespace

### Tenant.Slug
- ✅ Required, non-empty
- ✅ Lowercase alphanumeric + hyphens only
- ✅ Unique across all active tenants
- ✅ Min 3 characters, Max 100 characters
- ❌ Pattern: `^[a-z0-9][a-z0-9-]*[a-z0-9]$`
- Examples: `cour-rdc`, `ministry-health`, `company-2024`

### Tenant.ContactEmail
- ✅ Required, valid email format
- ✅ Unique per tenant
- ✅ Used for billing & notifications

### Tenant.Plan
- ✅ Must be valid enum value
- ✅ Determines MaxUsers, MaxStorageGB, MaxWorkspaces
- ✅ Can be changed any time (plan migration)

### Tenant.StorageGB
- ✅ Non-negative integer
- ✅ Defaults based on plan tier
- ✅ Can be custom per enterprise contract
- ✅ Validation: `actual usage <= maxStorageGB`

---

## API Response Codes

| Status | Scenario |
|--------|----------|
| 200 | GET successful, list/detail returned |
| 201 | POST successful, new resource created with Location header |
| 204 | DELETE successful, soft delete applied |
| 400 | Validation error (missing required field, invalid format) |
| 401 | Missing or invalid JWT token |
| 403 | Insufficient permissions (non-Admin for write operations) |
| 404 | Tenant not found by ID or slug |
| 409 | Conflict (e.g., duplicate slug) |
| 500 | Server error (check logs) |

---

## Performance Considerations

### Indexes Needed
```sql
-- Fast lookups
CREATE UNIQUE INDEX idx_tenants_slug ON Tenants(Slug) WHERE IsActive = true;
CREATE INDEX idx_tenants_plan ON Tenants(Plan);

-- Soft delete queries
CREATE INDEX idx_tenants_active ON Tenants(IsActive, DeletedAt);

-- Time-based queries
CREATE INDEX idx_tenants_created ON Tenants(CreatedAt DESC);

-- Foreign key traversal
CREATE INDEX idx_subscription_tenant ON TenantSubscriptions(TenantId);
CREATE INDEX idx_usage_tenant ON TenantUsageEvents(TenantId, EventDate DESC);
```

### Query Optimization
- Always use `WHERE IsActive = true AND DeletedAt IS NULL` for active tenant queries
- Use pagination (limit 50 per page) for list endpoints
- Cache frequently accessed plans in memory (5 variants max)
- Consider materialized view for tenant statistics (refresh hourly)

---

## Audit & Compliance

### All Mutations Logged
- CREATE Tenant → AuditLog entry with plan details
- UPDATE Plan → Before/after JSON values serialized
- DELETE (soft) → IsActive=false, DeletedAt timestamp recorded
- CREATE Subscription → Plan change tracked

### GDPR Considerations
- ✅ Soft deletes preserve data for 30+ days (configurable)
- ✅ Hard delete available on request (anonymize user data first)
- ✅ Audit trail shows who changed what, when
- ✅ Tenant admins can export data anytime

---

**Data Model Version**: 2.0 (Multi-Tenant SaaS)  
**Last Updated**: 2025-02-08  
**PostgreSQL Version**: 15+
