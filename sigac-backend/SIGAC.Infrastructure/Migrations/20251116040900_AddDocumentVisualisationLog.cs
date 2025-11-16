using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentVisualisationLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentVisualisationLogs");
        }
    }
}
