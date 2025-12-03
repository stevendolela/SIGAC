using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixSalleForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Salles_Users_CreatedByUserId",
                table: "Salles");

            migrationBuilder.DropIndex(
                name: "IX_Salles_CreatedByUserId",
                table: "Salles");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Salles");

            migrationBuilder.CreateIndex(
                name: "IX_Salles_CreatedBy",
                table: "Salles",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Salles_Nom",
                table: "Salles",
                column: "Nom",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Salles_Users_CreatedBy",
                table: "Salles",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Salles_Users_CreatedBy",
                table: "Salles");

            migrationBuilder.DropIndex(
                name: "IX_Salles_CreatedBy",
                table: "Salles");

            migrationBuilder.DropIndex(
                name: "IX_Salles_Nom",
                table: "Salles");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Salles",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Salles_CreatedByUserId",
                table: "Salles",
                column: "CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Salles_Users_CreatedByUserId",
                table: "Salles",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
