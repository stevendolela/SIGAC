-- Ajouter une colonne pour stocker le contenu du fichier en base64
ALTER TABLE "ChatAttachments" ADD COLUMN "FileData" TEXT NULL;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "IX_ChatAttachments_FileData" ON "ChatAttachments" ("FileData") WHERE "FileData" IS NOT NULL;
