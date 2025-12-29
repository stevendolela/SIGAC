-- Script de nettoyage des comptes de test
-- À exécuter sur la base de production Render

-- 1. Lister d'abord les comptes à supprimer
SELECT "Id", "Username", "Email", "NomComplet", "Role" 
FROM "Users" 
WHERE LOWER("Username") LIKE '%test%' 
   OR LOWER("Email") LIKE '%test%'
ORDER BY "Username";

-- 2. Supprimer les données liées avant de supprimer les users
-- (les FK avec ON DELETE CASCADE/RESTRICT/SET NULL gèrent automatiquement)

-- 3. Supprimer les comptes de test
DELETE FROM "Users" 
WHERE LOWER("Username") LIKE '%test%' 
   OR LOWER("Email") LIKE '%test%';

-- 4. Vérifier que les comptes sont bien supprimés
SELECT COUNT(*) as "Comptes restants avec test" 
FROM "Users" 
WHERE LOWER("Username") LIKE '%test%' 
   OR LOWER("Email") LIKE '%test%';

-- 5. Lister tous les users restants
SELECT "Id", "Username", "Email", "Role", "IsActive"
FROM "Users"
ORDER BY "CreatedAt" DESC;
