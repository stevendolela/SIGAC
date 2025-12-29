-- ================================================================
-- MIGRATION: Mise à jour des rôles utilisateurs existants
-- Date: 29 décembre 2025
-- Objectif: Convertir les anciens rôles juridiques vers les nouveaux rôles génériques
-- ================================================================

-- IMPORTANT: Faire un backup avant d'exécuter cette migration !
-- pg_dump -U sigac_user -h localhost -d sigac_db > backup_avant_migration_roles.sql

BEGIN;

-- Afficher l'état actuel avant migration
SELECT 'État AVANT migration:' as info;
SELECT "Role", COUNT(*) as count 
FROM "Users" 
GROUP BY "Role" 
ORDER BY "Role";

-- Mise à jour des rôles utilisateurs
-- Note: Les valeurs d'enum sont stockées comme integers dans PostgreSQL

UPDATE "Users" 
SET "Role" = 1 
WHERE "Role" = 1;  -- Administrateur → Admin (déjà 1)

UPDATE "Users" 
SET "Role" = 2 
WHERE "Role" = 2;  -- President → Manager (déjà 2)

UPDATE "Users" 
SET "Role" = 3 
WHERE "Role" = 3;  -- JugeConstitutionnel → Collaborateur (déjà 3)

UPDATE "Users" 
SET "Role" = 4 
WHERE "Role" = 4;  -- Greffier → Assistant (déjà 4)

UPDATE "Users" 
SET "Role" = 5 
WHERE "Role" = 5;  -- GreffierAdjoint → AssistantJunior (déjà 5)

UPDATE "Users" 
SET "Role" = 6 
WHERE "Role" = 6;  -- Consultant → Consultant (déjà 6)

-- Afficher l'état après migration
SELECT 'État APRÈS migration:' as info;
SELECT "Role", COUNT(*) as count 
FROM "Users" 
GROUP BY "Role" 
ORDER BY "Role";

-- Vérification: aucun rôle ne devrait être NULL ou invalide
SELECT 'Utilisateurs avec rôles invalides:' as info;
SELECT "Id", "Username", "Email", "Role"
FROM "Users"
WHERE "Role" IS NULL OR "Role" < 1 OR "Role" > 6;

-- Si tout est OK, décommenter la ligne suivante:
-- COMMIT;

-- Si problème, décommenter la ligne suivante:
ROLLBACK;

-- ================================================================
-- NOTE IMPORTANTE
-- ================================================================
-- Les valeurs numériques des enums n'ont PAS changé !
-- Seuls les NOMS symboliques ont changé dans le code :
--   1: Administrateur → Admin
--   2: President → Manager
--   3: JugeConstitutionnel → Collaborateur
--   4: Greffier → Assistant
--   5: GreffierAdjoint → AssistantJunior
--   6: Consultant → Consultant
--
-- Cette migration est donc TRANSPARENTE pour la base de données.
-- Le problème vient probablement du cache frontend ou de données
-- en localStorage qui gardent les anciens noms.
-- ================================================================
