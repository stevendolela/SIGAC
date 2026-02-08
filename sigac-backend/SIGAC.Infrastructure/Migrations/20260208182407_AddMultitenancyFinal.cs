using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMultitenancyFinal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create Tenants table first
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""Tenants"" (
    ""Id"" uuid PRIMARY KEY,
    ""Name"" varchar(255) NOT NULL,
    ""Slug"" varchar(255) UNIQUE NOT NULL,
    ""LogoBase64"" text,
    ""Plan"" integer NOT NULL,
    ""MaxUsers"" integer NOT NULL DEFAULT 10,
    ""MaxStorageGB"" bigint NOT NULL DEFAULT 5,
    ""MaxWorkspaces"" integer NOT NULL DEFAULT 3,
    ""StripeCustomerId"" varchar(255),
    ""StripeSubscriptionId"" varchar(255),
    ""IsActive"" boolean NOT NULL DEFAULT true,
    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT now(),
    ""DeletedAt"" timestamp with time zone
);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Tenants_Slug"" ON ""Tenants""(""Slug"");

-- Insert default tenant for existing records
INSERT INTO ""Tenants"" (""Id"", ""Name"", ""Slug"", ""Plan"", ""MaxUsers"", ""MaxStorageGB"", ""MaxWorkspaces"", ""IsActive"", ""CreatedAt"")
VALUES ('00000000-0000-0000-0000-000000000000', 'Default System Tenant', 'default-system', 0, 10, 5, 3, true, now())
ON CONFLICT (""Id"") DO NOTHING;
");

            // 2. Create TenantUsers table
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""TenantUsers"" (
    ""Id"" uuid PRIMARY KEY,
    ""TenantId"" uuid NOT NULL,
    ""Email"" varchar(255) NOT NULL,
    ""FullName"" varchar(255) NOT NULL,
    ""PasswordHash"" text NOT NULL,
    ""PhoneNumber"" varchar(20),
    ""Role"" integer NOT NULL,
    ""IsActive"" boolean NOT NULL DEFAULT true,
    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT now(),
    ""LastLoginAt"" timestamp with time zone,
    ""RefreshToken"" text,
    ""RefreshTokenExpiry"" timestamp with time zone,
    CONSTRAINT ""FK_TenantUsers_Tenants_TenantId"" FOREIGN KEY (""TenantId"") REFERENCES ""Tenants""(""Id"") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ""IX_TenantUsers_TenantId"" ON ""TenantUsers""(""TenantId"");
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_TenantUsers_Email"" ON ""TenantUsers""(""Email"");
");

            // 3. Create TenantSubscriptions table
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""TenantSubscriptions"" (
    ""Id"" uuid PRIMARY KEY,
    ""TenantId"" uuid NOT NULL,
    ""Plan"" integer NOT NULL,
    ""StartDate"" timestamp with time zone NOT NULL,
    ""EndDate"" timestamp with time zone,
    ""MonthlyCostEuro"" numeric(10, 2),
    ""StripeSubscriptionId"" varchar(255),
    ""Status"" integer NOT NULL,
    ""AutoRenew"" boolean NOT NULL DEFAULT true,
    ""RenewDate"" timestamp with time zone,
    CONSTRAINT ""FK_TenantSubscriptions_Tenants_TenantId"" FOREIGN KEY (""TenantId"") REFERENCES ""Tenants""(""Id"") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ""IX_TenantSubscriptions_TenantId"" ON ""TenantSubscriptions""(""TenantId"");
");

            // 4. Create TenantUsageEvents table
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""TenantUsageEvents"" (
    ""Id"" uuid PRIMARY KEY,
    ""TenantId"" uuid NOT NULL,
    ""Feature"" varchar(255) NOT NULL,
    ""Metadata"" jsonb,
    ""Count"" integer NOT NULL,
    ""EventDate"" timestamp with time zone NOT NULL,
    CONSTRAINT ""FK_TenantUsageEvents_Tenants_TenantId"" FOREIGN KEY (""TenantId"") REFERENCES ""Tenants""(""Id"") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ""IX_TenantUsageEvents_TenantId"" ON ""TenantUsageEvents""(""TenantId"");
");

            // 5. Add TenantId columns to existing tables
            migrationBuilder.Sql(@"
-- Add TenantId to Workspaces if not exists
ALTER TABLE ""Workspaces"" ADD COLUMN IF NOT EXISTS ""TenantId"" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Add TenantId to WorkspaceUsers if not exists
ALTER TABLE ""WorkspaceUsers"" ADD COLUMN IF NOT EXISTS ""TenantId"" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Add TenantId to AuditLogs if not exists
ALTER TABLE ""AuditLogs"" ADD COLUMN IF NOT EXISTS ""TenantId"" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Increase column size for Action and EntityType
ALTER TABLE ""AuditLogs"" ALTER COLUMN ""Action"" TYPE varchar(500);
ALTER TABLE ""AuditLogs"" ALTER COLUMN ""EntityType"" TYPE varchar(500);
");

            // 6. Add foreign keys
            migrationBuilder.Sql(@"
-- Add FK for Workspaces -> Tenants if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_Workspaces_Tenants_TenantId'
    ) THEN
        ALTER TABLE ""Workspaces"" ADD CONSTRAINT ""FK_Workspaces_Tenants_TenantId"" 
            FOREIGN KEY (""TenantId"") REFERENCES ""Tenants""(""Id"") ON DELETE CASCADE;
    END IF;
END $$;

-- Add FK for WorkspaceUsers -> Tenants if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_WorkspaceUsers_Tenants_TenantId'
    ) THEN
        ALTER TABLE ""WorkspaceUsers"" ADD CONSTRAINT ""FK_WorkspaceUsers_Tenants_TenantId"" 
            FOREIGN KEY (""TenantId"") REFERENCES ""Tenants""(""Id"") ON DELETE CASCADE;
    END IF;
END $$;

-- Add FK for AuditLogs -> Tenants if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_AuditLogs_Tenants_TenantId'
    ) THEN
        ALTER TABLE ""AuditLogs"" ADD CONSTRAINT ""FK_AuditLogs_Tenants_TenantId"" 
            FOREIGN KEY (""TenantId"") REFERENCES ""Tenants""(""Id"") ON DELETE CASCADE;
    END IF;
END $$;
");
        }


        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop foreign keys
            migrationBuilder.Sql(@"
ALTER TABLE ""AuditLogs"" DROP CONSTRAINT IF EXISTS ""FK_AuditLogs_Tenants_TenantId"";
ALTER TABLE ""WorkspaceUsers"" DROP CONSTRAINT IF EXISTS ""FK_WorkspaceUsers_Tenants_TenantId"";
ALTER TABLE ""Workspaces"" DROP CONSTRAINT IF EXISTS ""FK_Workspaces_Tenants_TenantId"";
");

            // Drop columns from existing tables
            migrationBuilder.Sql(@"
ALTER TABLE ""AuditLogs"" DROP COLUMN IF EXISTS ""TenantId"";
ALTER TABLE ""WorkspaceUsers"" DROP COLUMN IF EXISTS ""TenantId"";
ALTER TABLE ""Workspaces"" DROP COLUMN IF EXISTS ""TenantId"";
");

            // Drop new tables
            migrationBuilder.Sql(@"
DROP TABLE IF EXISTS ""TenantUsageEvents"" CASCADE;
DROP TABLE IF EXISTS ""TenantSubscriptions"" CASCADE;
DROP TABLE IF EXISTS ""TenantUsers"" CASCADE;
DROP TABLE IF EXISTS ""Tenants"" CASCADE;
");
        }
    }
}
