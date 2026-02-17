-- ============================================
-- MIGRATION PROD: Correction des colonnes Role
-- À exécuter sur la base PostgreSQL Render
-- Date: 2026-02-18
-- ============================================

-- 1. Ajouter la colonne Status à Users si elle n'existe pas
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "Status" integer DEFAULT 0;

-- 2. Convertir Users.Role de text vers integer
-- D'abord, mettre à jour les valeurs text vers leurs équivalents numériques
UPDATE "Users" SET "Role" = '1' WHERE "Role" = 'Admin';
UPDATE "Users" SET "Role" = '2' WHERE "Role" = 'Manager';
UPDATE "Users" SET "Role" = '3' WHERE "Role" = 'Collaborateur';
UPDATE "Users" SET "Role" = '4' WHERE "Role" = 'Assistant';
UPDATE "Users" SET "Role" = '5' WHERE "Role" = 'AssistantJunior';
UPDATE "Users" SET "Role" = '6' WHERE "Role" = 'Consultant';

-- Convertir la colonne en integer
ALTER TABLE "Users" ALTER COLUMN "Role" TYPE integer USING "Role"::integer;

-- 3. Convertir WorkspaceUsers.Role de text vers integer
-- D'abord, mettre à jour les valeurs text vers leurs équivalents numériques
UPDATE "WorkspaceUsers" SET "Role" = '0' WHERE "Role" = 'Owner';
UPDATE "WorkspaceUsers" SET "Role" = '1' WHERE "Role" = 'Admin';
UPDATE "WorkspaceUsers" SET "Role" = '2' WHERE "Role" = 'Member';
UPDATE "WorkspaceUsers" SET "Role" = '3' WHERE "Role" = 'Guest';

-- Convertir la colonne en integer
ALTER TABLE "WorkspaceUsers" ALTER COLUMN "Role" TYPE integer USING "Role"::integer;

-- 4. Vérification
SELECT 'Users.Role type:' as info, data_type FROM information_schema.columns WHERE table_name = 'Users' AND column_name = 'Role';
SELECT 'WorkspaceUsers.Role type:' as info, data_type FROM information_schema.columns WHERE table_name = 'WorkspaceUsers' AND column_name = 'Role';
SELECT 'Users.Status exists:' as info, data_type FROM information_schema.columns WHERE table_name = 'Users' AND column_name = 'Status';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
