using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CleanupTestUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Delete JugeProfiles for test users
            migrationBuilder.Sql(@"
                DELETE FROM ""JugeProfiles"" 
                WHERE ""UserId"" IN (
                    SELECT ""Id"" FROM ""Users"" 
                    WHERE ""Username"" ILIKE '%new%' OR ""Username"" ILIKE '%test%'
                )
            ");

            // Delete test users
            migrationBuilder.Sql(@"
                DELETE FROM ""Users"" 
                WHERE ""Username"" ILIKE '%new%' OR ""Username"" ILIKE '%test%'
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No rollback needed for cleanup migration
        }
    }
}
