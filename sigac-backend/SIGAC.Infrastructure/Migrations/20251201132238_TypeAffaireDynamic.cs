using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TypeAffaireDynamic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "Dossiers");

            migrationBuilder.AddColumn<Guid>(
                name: "TypeAffaireId",
                table: "Dossiers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TypeAffaireId1",
                table: "Dossiers",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TypeAffaires",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nom = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TypeAffaires", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Dossiers_TypeAffaireId",
                table: "Dossiers",
                column: "TypeAffaireId");

            migrationBuilder.CreateIndex(
                name: "IX_Dossiers_TypeAffaireId1",
                table: "Dossiers",
                column: "TypeAffaireId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Dossiers_TypeAffaires_TypeAffaireId",
                table: "Dossiers",
                column: "TypeAffaireId",
                principalTable: "TypeAffaires",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Dossiers_TypeAffaires_TypeAffaireId1",
                table: "Dossiers",
                column: "TypeAffaireId1",
                principalTable: "TypeAffaires",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Dossiers_TypeAffaires_TypeAffaireId",
                table: "Dossiers");

            migrationBuilder.DropForeignKey(
                name: "FK_Dossiers_TypeAffaires_TypeAffaireId1",
                table: "Dossiers");

            migrationBuilder.DropTable(
                name: "TypeAffaires");

            migrationBuilder.DropIndex(
                name: "IX_Dossiers_TypeAffaireId",
                table: "Dossiers");

            migrationBuilder.DropIndex(
                name: "IX_Dossiers_TypeAffaireId1",
                table: "Dossiers");

            migrationBuilder.DropColumn(
                name: "TypeAffaireId",
                table: "Dossiers");

            migrationBuilder.DropColumn(
                name: "TypeAffaireId1",
                table: "Dossiers");

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Dossiers",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
