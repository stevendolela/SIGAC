using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixTypeAffaireFk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Dossiers_TypeAffaires_TypeAffaireId1",
                table: "Dossiers");

            migrationBuilder.DropIndex(
                name: "IX_Dossiers_TypeAffaireId1",
                table: "Dossiers");

            migrationBuilder.DropColumn(
                name: "TypeAffaireId1",
                table: "Dossiers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TypeAffaireId1",
                table: "Dossiers",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Dossiers_TypeAffaireId1",
                table: "Dossiers",
                column: "TypeAffaireId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Dossiers_TypeAffaires_TypeAffaireId1",
                table: "Dossiers",
                column: "TypeAffaireId1",
                principalTable: "TypeAffaires",
                principalColumn: "Id");
        }
    }
}
