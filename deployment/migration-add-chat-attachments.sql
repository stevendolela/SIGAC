-- Migration: Add ChatAttachments table for file attachments in chat
-- Date: 2025-12-21

CREATE TABLE "ChatAttachments" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "MessageId" uuid NULL,
    "GroupMessageId" uuid NULL,
    "FileName" varchar(255) NOT NULL,
    "FilePath" varchar(1000) NOT NULL,
    "MimeType" varchar(100) NOT NULL,
    "FileSize" bigint NOT NULL,
    "FileType" varchar(50) NOT NULL,
    "HashSHA256" varchar(64) NULL,
    "IsVoiceNote" boolean NOT NULL DEFAULT false,
    "DurationSeconds" int NULL,
    "UploadedBy" uuid NOT NULL,
    "UploadedAt" timestamp NOT NULL,
    CONSTRAINT "FK_ChatAttachments_Messages_MessageId" FOREIGN KEY ("MessageId") REFERENCES "Messages" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ChatAttachments_GroupMessages_GroupMessageId" FOREIGN KEY ("GroupMessageId") REFERENCES "GroupMessages" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ChatAttachments_Users_UploadedBy" FOREIGN KEY ("UploadedBy") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_ChatAttachments_MessageId" ON "ChatAttachments" ("MessageId");
CREATE INDEX "IX_ChatAttachments_GroupMessageId" ON "ChatAttachments" ("GroupMessageId");
CREATE INDEX "IX_ChatAttachments_UploadedBy" ON "ChatAttachments" ("UploadedBy");

-- Ajouter une contrainte pour s'assurer qu'un attachment appartient soit à un Message soit à un GroupMessage
ALTER TABLE "ChatAttachments" ADD CONSTRAINT "CK_ChatAttachments_OneMessageType" 
    CHECK (("MessageId" IS NOT NULL AND "GroupMessageId" IS NULL) OR ("MessageId" IS NULL AND "GroupMessageId" IS NOT NULL));
