using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAudiences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    NomComplet = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    Matricule = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    RefreshToken = table.Column<string>(type: "text", nullable: true),
                    RefreshTokenExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PasswordResetToken = table.Column<string>(type: "text", nullable: true),
                    PasswordResetTokenExpiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastPasswordChange = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastLogin = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Action = table.Column<string>(type: "text", nullable: false),
                    EntityType = table.Column<string>(type: "text", nullable: false),
                    EntityId = table.Column<string>(type: "text", nullable: true),
                    OldValues = table.Column<string>(type: "text", nullable: true),
                    NewValues = table.Column<string>(type: "text", nullable: true),
                    IpAddress = table.Column<string>(type: "text", nullable: false),
                    UserAgent = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Dossiers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NumeroDossier = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Titre = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Demandeur = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Defendeur = table.Column<string>(type: "text", nullable: true),
                    DateDepot = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateAudience = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateDecision = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Priorite = table.Column<int>(type: "integer", nullable: false),
                    Resume = table.Column<string>(type: "text", nullable: true),
                    Observations = table.Column<string>(type: "text", nullable: true),
                    RapporteurId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ModifiedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dossiers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Dossiers_Users_RapporteurId",
                        column: x => x.RapporteurId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Audiences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DossierId = table.Column<Guid>(type: "uuid", nullable: false),
                    DateAudience = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Lieu = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TypeAudience = table.Column<int>(type: "integer", nullable: false),
                    Statut = table.Column<int>(type: "integer", nullable: false),
                    Observations = table.Column<string>(type: "text", nullable: true),
                    CompteRendu = table.Column<string>(type: "text", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Audiences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Audiences_Dossiers_DossierId",
                        column: x => x.DossierId,
                        principalTable: "Dossiers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Audiences_Users_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DossierId = table.Column<Guid>(type: "uuid", nullable: false),
                    NomFichier = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    CheminFichier = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    TypeDocument = table.Column<string>(type: "text", nullable: false),
                    TailleFichier = table.Column<long>(type: "bigint", nullable: false),
                    MimeType = table.Column<string>(type: "text", nullable: false),
                    NumeroVersion = table.Column<int>(type: "integer", nullable: false),
                    EstConfidentiel = table.Column<bool>(type: "boolean", nullable: false),
                    HashSHA256 = table.Column<string>(type: "text", nullable: false),
                    UploadedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Documents_Dossiers_DossierId",
                        column: x => x.DossierId,
                        principalTable: "Dossiers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Historiques",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DossierId = table.Column<Guid>(type: "uuid", nullable: false),
                    DateAction = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Action = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Details = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Historiques", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Historiques_Dossiers_DossierId",
                        column: x => x.DossierId,
                        principalTable: "Dossiers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Historiques_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DocumentVisualisationLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DateVisualisation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TypeVisualisation = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentVisualisationLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentVisualisationLogs_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentVisualisationLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Audiences_CreatedBy",
                table: "Audiences",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Audiences_DateAudience",
                table: "Audiences",
                column: "DateAudience");

            migrationBuilder.CreateIndex(
                name: "IX_Audiences_DossierId",
                table: "Audiences",
                column: "DossierId");

            migrationBuilder.CreateIndex(
                name: "IX_Audiences_Statut",
                table: "Audiences",
                column: "Statut");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Timestamp",
                table: "AuditLogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId",
                table: "AuditLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_DossierId",
                table: "Documents",
                column: "DossierId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentVisualisationLogs_DateVisualisation",
                table: "DocumentVisualisationLogs",
                column: "DateVisualisation");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentVisualisationLogs_DocumentId",
                table: "DocumentVisualisationLogs",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentVisualisationLogs_UserId",
                table: "DocumentVisualisationLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Dossiers_NumeroDossier",
                table: "Dossiers",
                column: "NumeroDossier",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Dossiers_RapporteurId",
                table: "Dossiers",
                column: "RapporteurId");

            migrationBuilder.CreateIndex(
                name: "IX_Historiques_DossierId",
                table: "Historiques",
                column: "DossierId");

            migrationBuilder.CreateIndex(
                name: "IX_Historiques_UserId",
                table: "Historiques",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Audiences");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "DocumentVisualisationLogs");

            migrationBuilder.DropTable(
                name: "Historiques");

            migrationBuilder.DropTable(
                name: "Documents");

            migrationBuilder.DropTable(
                name: "Dossiers");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
