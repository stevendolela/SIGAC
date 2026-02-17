using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DropOrphanedTenantUserIdColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop any orphaned TenantUserId columns that shouldn't exist
            migrationBuilder.Sql(@"
-- Drop constraints first
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'AuditLogs' AND constraint_name LIKE '%TenantUserId%'
    ) THEN
        ALTER TABLE ""AuditLogs"" DROP CONSTRAINT (
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'AuditLogs' AND constraint_name LIKE '%TenantUserId%' LIMIT 1
        ) CASCADE;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'WorkspaceUsers' AND constraint_name LIKE '%TenantUserId%'
    ) THEN
        ALTER TABLE ""WorkspaceUsers"" DROP CONSTRAINT (
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'WorkspaceUsers' AND constraint_name LIKE '%TenantUserId%' LIMIT 1
        ) CASCADE;
    END IF;
END $$;

-- Drop columns
ALTER TABLE ""AuditLogs"" DROP COLUMN IF EXISTS ""TenantUserId"" CASCADE;
ALTER TABLE ""AuditLogs"" DROP COLUMN IF EXISTS ""TenantId1"" CASCADE;
ALTER TABLE ""WorkspaceUsers"" DROP COLUMN IF EXISTS ""TenantUserId"" CASCADE;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No rollback - this is a cleanup migration
        }
    }
}
