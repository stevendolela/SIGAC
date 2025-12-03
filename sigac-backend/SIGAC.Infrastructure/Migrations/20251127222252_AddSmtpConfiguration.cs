using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSmtpConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SmtpConfigurations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Host = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Port = table.Column<int>(type: "integer", nullable: false),
                    Username = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    EncryptedPassword = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    From = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FromName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    EnableSsl = table.Column<bool>(type: "boolean", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ModifiedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    LastTestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastTestSuccess = table.Column<bool>(type: "boolean", nullable: true),
                    LastTestError = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SmtpConfigurations", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SmtpConfigurations");
        }
    }
}
