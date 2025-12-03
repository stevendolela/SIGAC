using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixAudienceCreatedByFK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CalendarEvents_Dossiers_DossierId",
                table: "CalendarEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_CalendarEvents_Salles_SalleId",
                table: "CalendarEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_CalendarEvents_Users_CreatedBy",
                table: "CalendarEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Users_UserId",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Salles_Users_CreatedBy",
                table: "Salles");

            migrationBuilder.DropIndex(
                name: "IX_Salles_CreatedBy",
                table: "Salles");

            migrationBuilder.DropIndex(
                name: "IX_Salles_Nom",
                table: "Salles");

            migrationBuilder.DropIndex(
                name: "IX_JugeProfiles_UserId",
                table: "JugeProfiles");

            migrationBuilder.DropIndex(
                name: "IX_FormationParticipations_FormationId_UserId",
                table: "FormationParticipations");

            migrationBuilder.DropIndex(
                name: "IX_CalendarEvents_CreatedBy",
                table: "CalendarEvents");

            migrationBuilder.DropIndex(
                name: "IX_CalendarEvents_Debut",
                table: "CalendarEvents");

            migrationBuilder.DropIndex(
                name: "IX_CalendarEvents_Fin",
                table: "CalendarEvents");

            migrationBuilder.DropIndex(
                name: "IX_Audiences_Statut",
                table: "Audiences");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Salles",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<string>(
                name: "Titre",
                table: "Notifications",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "Message",
                table: "Notifications",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000);

            migrationBuilder.AlterColumn<string>(
                name: "Lien",
                table: "Notifications",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Specialisations",
                table: "JugeProfiles",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Grade",
                table: "JugeProfiles",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Titre",
                table: "Formations",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "Organisateur",
                table: "Formations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Lieu",
                table: "Formations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Formations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "CalendarEvents",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Titre",
                table: "CalendarEvents",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "CalendarEvents",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Salles_CreatedByUserId",
                table: "Salles",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_JugeProfiles_UserId",
                table: "JugeProfiles",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FormationParticipations_FormationId",
                table: "FormationParticipations",
                column: "FormationId");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_CreatedByUserId",
                table: "CalendarEvents",
                column: "CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_CalendarEvents_Dossiers_DossierId",
                table: "CalendarEvents",
                column: "DossierId",
                principalTable: "Dossiers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CalendarEvents_Salles_SalleId",
                table: "CalendarEvents",
                column: "SalleId",
                principalTable: "Salles",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CalendarEvents_Users_CreatedByUserId",
                table: "CalendarEvents",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Users_UserId",
                table: "Notifications",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Salles_Users_CreatedByUserId",
                table: "Salles",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CalendarEvents_Dossiers_DossierId",
                table: "CalendarEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_CalendarEvents_Salles_SalleId",
                table: "CalendarEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_CalendarEvents_Users_CreatedByUserId",
                table: "CalendarEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Users_UserId",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Salles_Users_CreatedByUserId",
                table: "Salles");

            migrationBuilder.DropIndex(
                name: "IX_Salles_CreatedByUserId",
                table: "Salles");

            migrationBuilder.DropIndex(
                name: "IX_JugeProfiles_UserId",
                table: "JugeProfiles");

            migrationBuilder.DropIndex(
                name: "IX_FormationParticipations_FormationId",
                table: "FormationParticipations");

            migrationBuilder.DropIndex(
                name: "IX_CalendarEvents_CreatedByUserId",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Salles");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "CalendarEvents");

            migrationBuilder.AlterColumn<string>(
                name: "Titre",
                table: "Notifications",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Message",
                table: "Notifications",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Lien",
                table: "Notifications",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Specialisations",
                table: "JugeProfiles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Grade",
                table: "JugeProfiles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Titre",
                table: "Formations",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Organisateur",
                table: "Formations",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Lieu",
                table: "Formations",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Formations",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "CalendarEvents",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Titre",
                table: "CalendarEvents",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "IX_Salles_CreatedBy",
                table: "Salles",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Salles_Nom",
                table: "Salles",
                column: "Nom",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JugeProfiles_UserId",
                table: "JugeProfiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FormationParticipations_FormationId_UserId",
                table: "FormationParticipations",
                columns: new[] { "FormationId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_CreatedBy",
                table: "CalendarEvents",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_Debut",
                table: "CalendarEvents",
                column: "Debut");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_Fin",
                table: "CalendarEvents",
                column: "Fin");

            migrationBuilder.CreateIndex(
                name: "IX_Audiences_Statut",
                table: "Audiences",
                column: "Statut");

            migrationBuilder.AddForeignKey(
                name: "FK_CalendarEvents_Dossiers_DossierId",
                table: "CalendarEvents",
                column: "DossierId",
                principalTable: "Dossiers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_CalendarEvents_Salles_SalleId",
                table: "CalendarEvents",
                column: "SalleId",
                principalTable: "Salles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_CalendarEvents_Users_CreatedBy",
                table: "CalendarEvents",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Users_UserId",
                table: "Notifications",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Salles_Users_CreatedBy",
                table: "Salles",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
