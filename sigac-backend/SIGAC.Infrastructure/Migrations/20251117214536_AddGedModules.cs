using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGedModules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CalendarEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Titre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Debut = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Fin = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DossierId = table.Column<Guid>(type: "uuid", nullable: true),
                    SalleId = table.Column<Guid>(type: "uuid", nullable: true),
                    TouteLaJournee = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CalendarEvents_Dossiers_DossierId",
                        column: x => x.DossierId,
                        principalTable: "Dossiers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CalendarEvents_Salles_SalleId",
                        column: x => x.SalleId,
                        principalTable: "Salles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CalendarEvents_Users_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Formations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Titre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Organisateur = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DateDebut = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Lieu = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    EstEnLigne = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Formations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JugeProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Grade = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Specialisations = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Biographie = table.Column<string>(type: "text", nullable: true),
                    DateNomination = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Telephone = table.Column<string>(type: "text", nullable: true),
                    Adresse = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JugeProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JugeProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Titre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Lien = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    EstLue = table.Column<bool>(type: "boolean", nullable: false),
                    CreeLe = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LueLe = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FormationParticipations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FormationId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    EstCompletee = table.Column<bool>(type: "boolean", nullable: false),
                    DateCompletion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CertificatUrl = table.Column<string>(type: "text", nullable: true),
                    InscritLe = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormationParticipations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormationParticipations_Formations_FormationId",
                        column: x => x.FormationId,
                        principalTable: "Formations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FormationParticipations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_CreatedBy",
                table: "CalendarEvents",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_Debut",
                table: "CalendarEvents",
                column: "Debut");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_DossierId",
                table: "CalendarEvents",
                column: "DossierId");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_Fin",
                table: "CalendarEvents",
                column: "Fin");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_SalleId",
                table: "CalendarEvents",
                column: "SalleId");

            migrationBuilder.CreateIndex(
                name: "IX_FormationParticipations_FormationId_UserId",
                table: "FormationParticipations",
                columns: new[] { "FormationId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FormationParticipations_UserId",
                table: "FormationParticipations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_JugeProfiles_UserId",
                table: "JugeProfiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CalendarEvents");

            migrationBuilder.DropTable(
                name: "FormationParticipations");

            migrationBuilder.DropTable(
                name: "JugeProfiles");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "Formations");
        }
    }
}
