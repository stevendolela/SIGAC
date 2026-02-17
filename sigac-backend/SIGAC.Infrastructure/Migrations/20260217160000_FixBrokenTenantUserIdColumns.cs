using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixBrokenTenantUserIdColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Simply drop any bad columns that might exist and are causing 500 errors
            // This is safe - we DROP IF EXISTS
            
            migrationBuilder.Sql(@"
-- Drop bad foreign keys if they exist
DO $$
BEGIN
    -- Try to drop FK on AuditLogs.TenantUserId
    BEGIN
        EXECUTE 'ALTER TABLE ""AuditLogs"" DROP CONSTRAINT ""FK_AuditLogs_TenantUsers_TenantUserId"" CASCADE';
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Try to drop FK on WorkspaceUsers.TenantUserId
    BEGIN
        EXECUTE 'ALTER TABLE ""WorkspaceUsers"" DROP CONSTRAINT ""FK_WorkspaceUsers_TenantUsers_TenantUserId"" CASCADE';
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- Drop orphaned indices
DROP INDEX IF EXISTS ""IX_AuditLogs_TenantUserId"" CASCADE;
DROP INDEX IF EXISTS ""IX_AuditLogs_TenantId1"" CASCADE;
DROP INDEX IF EXISTS ""IX_WorkspaceUsers_TenantUserId"" CASCADE;

-- Drop orphaned columns (these should not exist in the current schema)
ALTER TABLE IF EXISTS ""AuditLogs"" DROP COLUMN IF EXISTS ""TenantUserId"" CASCADE;
ALTER TABLE IF EXISTS ""AuditLogs"" DROP COLUMN IF EXISTS ""TenantId1"" CASCADE;
ALTER TABLE IF EXISTS ""WorkspaceUsers"" DROP COLUMN IF EXISTS ""TenantUserId"" CASCADE;
ALTER TABLE IF EXISTS ""WorkspaceUsers"" DROP COLUMN IF EXISTS ""UserId1"" CASCADE;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No rollback for cleanup migrations
        }
    }
}
