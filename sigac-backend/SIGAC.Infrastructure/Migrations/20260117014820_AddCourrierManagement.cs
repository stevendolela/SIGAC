using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCourrierManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Courriers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Reference = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Objet = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Expediteur = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Destinataire = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    DateCourrier = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateReception = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Statut = table.Column<int>(type: "integer", nullable: false),
                    Urgence = table.Column<int>(type: "integer", nullable: false),
                    ReferenceExterne = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    TexteOCR = table.Column<string>(type: "text", nullable: true),
                    ConfianceOCR = table.Column<int>(type: "integer", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    DocumentData = table.Column<string>(type: "text", nullable: true),
                    NomFichier = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    MimeType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    TailleFichier = table.Column<long>(type: "bigint", nullable: true),
                    DossierId = table.Column<Guid>(type: "uuid", nullable: true),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: true),
                    AssigneAId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ModifiedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Courriers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Courriers_Dossiers_DossierId",
                        column: x => x.DossierId,
                        principalTable: "Dossiers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Courriers_Users_AssigneAId",
                        column: x => x.AssigneAId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Courriers_Users_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Courriers_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CourrierHistoriques",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourrierId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Details = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    AncienStatut = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    NouveauStatut = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DateAction = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourrierHistoriques", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourrierHistoriques_Courriers_CourrierId",
                        column: x => x.CourrierId,
                        principalTable: "Courriers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CourrierHistoriques_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CourrierHistoriques_CourrierId",
                table: "CourrierHistoriques",
                column: "CourrierId");

            migrationBuilder.CreateIndex(
                name: "IX_CourrierHistoriques_UserId",
                table: "CourrierHistoriques",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Courriers_AssigneAId",
                table: "Courriers",
                column: "AssigneAId");

            migrationBuilder.CreateIndex(
                name: "IX_Courriers_CreatedBy",
                table: "Courriers",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Courriers_DossierId",
                table: "Courriers",
                column: "DossierId");

            migrationBuilder.CreateIndex(
                name: "IX_Courriers_Reference",
                table: "Courriers",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Courriers_WorkspaceId",
                table: "Courriers",
                column: "WorkspaceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CourrierHistoriques");

            migrationBuilder.DropTable(
                name: "Courriers");
        }
    }
}
