using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentOrdreColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ajout conditonnel de la colonne Ordre (si elle n'existe pas déjà)
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'Documents' AND column_name = 'Ordre'
                    ) THEN
                        ALTER TABLE ""Documents"" ADD COLUMN ""Ordre"" integer NOT NULL DEFAULT 0;
                    END IF;
                    
                    -- Nettoyer les migrations orphelines
                    DELETE FROM ""__EFMigrationsHistory"" 
                    WHERE ""MigrationId"" = '20260224223227_AddDocumentOrdre';
                END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Ordre",
                table: "Documents");
        }
    }
}
