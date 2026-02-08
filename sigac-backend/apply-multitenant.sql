-- Script SQL pour ajouter Multi-Tenancy à SIGAC
-- Exécution: psql postgresql://user:password@host/db < apply-multitenant.sql

-- =====================================
-- 1. Créer la table Tenants (SaaS Client)
-- =====================================
CREATE TABLE IF NOT EXISTS "Tenants" (
    "Id" uuid PRIMARY KEY,
    "Name" varchar(255) NOT NULL,
    "Slug" varchar(255) UNIQUE NOT NULL,
    "LogoBase64" text,
    "Plan" integer NOT NULL,
    "MaxUsers" integer NOT NULL DEFAULT 10,
    "MaxStorageGB" bigint NOT NULL DEFAULT 5,
    "MaxWorkspaces" integer NOT NULL DEFAULT 3,
    "StripeCustomerId" varchar(255),
    "StripeSubscriptionId" varchar(255),
    "IsActive" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "DeletedAt" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Tenants_Slug" ON "Tenants"("Slug");

-- =====================================
-- 2. Créer la table TenantUsers
-- =====================================
CREATE TABLE IF NOT EXISTS "TenantUsers" (
    "Id" uuid PRIMARY KEY,
    "TenantId" uuid NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "Email" varchar(255) NOT NULL,
    "FullName" varchar(255) NOT NULL,
    "PasswordHash" text NOT NULL,
    "PhoneNumber" varchar(20),
    "Role" integer NOT NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "LastLoginAt" timestamp with time zone,
    "RefreshToken" text,
    "RefreshTokenExpiry" timestamp with time zone,
    UNIQUE("TenantId", "Email")
);

CREATE INDEX IF NOT EXISTS "IX_TenantUsers_TenantId_Email" ON "TenantUsers"("TenantId", "Email");

-- =====================================
-- 3. Créer la table TenantSubscriptions
-- =====================================
CREATE TABLE IF NOT EXISTS "TenantSubscriptions" (
    "Id" uuid PRIMARY KEY,
    "TenantId" uuid NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "Plan" integer NOT NULL,
    "StartDate" timestamp with time zone NOT NULL,
    "EndDate" timestamp with time zone,
    "MonthlyCostEuro" numeric NOT NULL,
    "StripeSubscriptionId" varchar(255),
    "Status" integer NOT NULL,
    "AutoRenew" boolean NOT NULL DEFAULT true,
    "RenewDate" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "IX_TenantSubscriptions_TenantId" ON "TenantSubscriptions"("TenantId");

-- =====================================
-- 4. Créer la table TenantUsageEvents
-- =====================================
CREATE TABLE IF NOT EXISTS "TenantUsageEvents" (
    "Id" uuid PRIMARY KEY,
    "TenantId" uuid NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "Feature" varchar(255) NOT NULL,
    "Metadata" jsonb,
    "Count" integer NOT NULL DEFAULT 1,
    "EventDate" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IX_TenantUsageEvents_TenantId_EventDate" ON "TenantUsageEvents"("TenantId", "EventDate");

-- =====================================
-- 5. Ajouter TenantId aux tables existantes
-- =====================================

-- Workspaces
ALTER TABLE "Workspaces"
ADD COLUMN "TenantId" uuid,
ADD CONSTRAINT "FK_Workspaces_Tenants_TenantId" 
    FOREIGN KEY ("TenantId") REFERENCES "Tenants"("Id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "IX_Workspaces_TenantId" ON "Workspaces"("TenantId");

-- WorkspaceUsers
ALTER TABLE "WorkspaceUsers"
ADD COLUMN "TenantId" uuid,
ADD CONSTRAINT "FK_WorkspaceUsers_Tenants_TenantId" 
    FOREIGN KEY ("TenantId") REFERENCES "Tenants"("Id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "IX_WorkspaceUsers_TenantId" ON "WorkspaceUsers"("TenantId");

-- AuditLogs
ALTER TABLE "AuditLogs"
ADD COLUMN "TenantId" uuid,
ADD CONSTRAINT "FK_AuditLogs_Tenants_TenantId" 
    FOREIGN KEY ("TenantId") REFERENCES "Tenants"("Id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "IX_AuditLogs_TenantId" ON "AuditLogs"("TenantId");

-- =====================================
-- 6. Enregistrer les migrations dans l'historique
-- =====================================
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260208175343_AddTenantIdBasic', '8.0.0')
ON CONFLICT DO NOTHING;

-- =====================================
-- SUCCESS
-- =====================================
SELECT 'Multi-Tenancy tables created successfully!' AS status;
