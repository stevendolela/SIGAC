-- Migration: AddFileDataToDocument
-- Ajouter la colonne FileData à la table Documents pour stocker les fichiers en Base64

-- Ajouter la colonne FileData
ALTER TABLE "Documents" ADD COLUMN IF NOT EXISTS "FileData" TEXT NULL;

-- Enregistrer la migration dans la table __EFMigrationsHistory
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260116215039_AddFileDataToDocument', '8.0.2'
WHERE NOT EXISTS (
    SELECT 1 FROM "__EFMigrationsHistory" 
    WHERE "MigrationId" = '20260116215039_AddFileDataToDocument'
);

-- Vérifier que la colonne existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Documents' AND column_name = 'FileData';
