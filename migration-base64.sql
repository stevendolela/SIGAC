-- Migration: AddBase64LogoAndAvatar
-- Date: 2025-12-17
-- Description: Ajoute les colonnes LogoBase64 et AvatarBase64

-- Ajouter la colonne LogoBase64 à la table Workspaces
ALTER TABLE "Workspaces" ADD COLUMN IF NOT EXISTS "LogoBase64" text;

-- Ajouter la colonne AvatarBase64 à la table Users
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "AvatarBase64" text;

-- Enregistrer la migration dans l'historique
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251217133725_AddBase64LogoAndAvatar', '8.0.8')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Vérification
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('Workspaces', 'Users') 
  AND column_name IN ('LogoBase64', 'AvatarBase64')
ORDER BY table_name, column_name;
