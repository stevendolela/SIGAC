using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIceCandidatesToVideoCall : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IceCandidates",
                table: "VideoCalls",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IceCandidates",
                table: "VideoCalls");
        }
    }
}
