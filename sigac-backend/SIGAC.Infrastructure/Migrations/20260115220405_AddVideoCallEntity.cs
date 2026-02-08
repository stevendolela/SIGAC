using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGAC.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVideoCallEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create tables using raw SQL with IF NOT EXISTS for production compatibility
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""ChatAttachments"" (
    ""Id"" uuid NOT NULL PRIMARY KEY,
    ""MessageId"" uuid,
    ""GroupMessageId"" uuid,
    ""FileName"" varchar(255) NOT NULL,
    ""FilePath"" varchar(1000) NOT NULL,
    ""FileData"" text,
    ""MimeType"" varchar(100) NOT NULL,
    ""FileSize"" bigint NOT NULL,
    ""FileType"" varchar(50) NOT NULL,
    ""HashSHA256"" varchar(64) NOT NULL,
    ""IsVoiceNote"" boolean NOT NULL,
    ""DurationSeconds"" integer,
    ""UploadedBy"" uuid NOT NULL,
    ""UploadedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""FK_ChatAttachments_GroupMessages_GroupMessageId"" FOREIGN KEY (""GroupMessageId"") REFERENCES ""GroupMessages""(""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_ChatAttachments_Messages_MessageId"" FOREIGN KEY (""MessageId"") REFERENCES ""Messages""(""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_ChatAttachments_Users_UploadedBy"" FOREIGN KEY (""UploadedBy"") REFERENCES ""Users""(""Id"") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS ""IX_ChatAttachments_GroupMessageId"" ON ""ChatAttachments""(""GroupMessageId"");
CREATE INDEX IF NOT EXISTS ""IX_ChatAttachments_MessageId"" ON ""ChatAttachments""(""MessageId"");
CREATE INDEX IF NOT EXISTS ""IX_ChatAttachments_UploadedBy"" ON ""ChatAttachments""(""UploadedBy"");
");

            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""SystemSettings"" (
    ""Id"" uuid NOT NULL PRIMARY KEY,
    ""LogoBase64"" text,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone,
    ""UpdatedBy"" uuid
);
");

            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""VideoCalls"" (
    ""Id"" uuid NOT NULL PRIMARY KEY,
    ""InitiatorId"" uuid NOT NULL,
    ""ReceiverId"" uuid NOT NULL,
    ""ConversationId"" uuid,
    ""GroupId"" uuid,
    ""Status"" integer NOT NULL,
    ""StartedAt"" timestamp with time zone NOT NULL,
    ""EndedAt"" timestamp with time zone,
    ""DurationSeconds"" integer,
    ""SignalingData"" text,
    CONSTRAINT ""FK_VideoCalls_ChatConversations_ConversationId"" FOREIGN KEY (""ConversationId"") REFERENCES ""ChatConversations""(""Id""),
    CONSTRAINT ""FK_VideoCalls_ChatGroups_GroupId"" FOREIGN KEY (""GroupId"") REFERENCES ""ChatGroups""(""Id""),
    CONSTRAINT ""FK_VideoCalls_Users_InitiatorId"" FOREIGN KEY (""InitiatorId"") REFERENCES ""Users""(""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_VideoCalls_Users_ReceiverId"" FOREIGN KEY (""ReceiverId"") REFERENCES ""Users""(""Id"") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ""IX_VideoCalls_ConversationId"" ON ""VideoCalls""(""ConversationId"");
CREATE INDEX IF NOT EXISTS ""IX_VideoCalls_GroupId"" ON ""VideoCalls""(""GroupId"");
CREATE INDEX IF NOT EXISTS ""IX_VideoCalls_InitiatorId"" ON ""VideoCalls""(""InitiatorId"");
CREATE INDEX IF NOT EXISTS ""IX_VideoCalls_ReceiverId"" ON ""VideoCalls""(""ReceiverId"");
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatAttachments");

            migrationBuilder.DropTable(
                name: "SystemSettings");

            migrationBuilder.DropTable(
                name: "VideoCalls");

            // COMMENTÉ: Column "Status" still needed in production
            //migrationBuilder.DropColumn(
            //    name: "Status",
            //    table: "Users");
        }
    }
}
