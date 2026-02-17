using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBadTenantUserIdForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop any orphaned TenantUserId column from Workspaces if it exists
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Workspaces' AND column_name = 'TenantUserId'
    ) THEN
        ALTER TABLE ""Workspaces"" DROP COLUMN IF EXISTS ""TenantUserId"" CASCADE;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Workspaces' AND column_name = 'WorkspaceTenantUserId'
    ) THEN
        ALTER TABLE ""Workspaces"" DROP COLUMN IF EXISTS ""WorkspaceTenantUserId"" CASCADE;
    END IF;
    
    -- Also drop from WorkspaceUsers if misconfigured
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'WorkspaceUsers' AND constraint_name LIKE '%TenantUser%'
    ) THEN
        PG_ERROR(SELECT 1 FROM information_schema.table_constraints 
         WHERE table_name = 'WorkspaceUsers' AND constraint_name LIKE '%TenantUser%'
        );
    END IF;
END $$;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No rollback needed - this is a cleanup migration
        }
    }
}
