using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIceCandidatesToVideoCall : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add IceCandidates column if it doesn't exist
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'VideoCalls' AND column_name = 'IceCandidates') THEN
        ALTER TABLE ""VideoCalls"" ADD COLUMN ""IceCandidates"" text;
    END IF;
END $$;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop IceCandidates column if it exists
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'VideoCalls' AND column_name = 'IceCandidates') THEN
        ALTER TABLE ""VideoCalls"" DROP COLUMN ""IceCandidates"";
    END IF;
END $$;
");
        }
    }
}
