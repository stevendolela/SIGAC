-- ================================================================
-- Migration : Correction des Rôles Existants Après Refactorisation
-- Date : 29 Décembre 2025
-- Objectif : Mettre à jour les utilisateurs créés avant la migration des rôles
-- ================================================================

-- CONTEXTE :
-- Après refactorisation des rôles (juridiques → génériques), certains utilisateurs
-- conservent les anciennes valeurs enum dans la base de données.
-- 
-- Ancien mapping (avant migration) :
--   Administrateur = 1
--   President = 2
--   JugeConstitutionnel = 3
--   Greffier = 4
--   GreffierAdjoint = 5
--   Consultant = 6
--
-- Nouveau mapping (après migration) :
--   Admin = 1
--   Manager = 2
--   Collaborateur = 3
--   Assistant = 4
--   AssistantJunior = 5
--   Consultant = 6
--
-- PROBLÈME DÉTECTÉ :
-- Les utilisateurs juge.kabongo, juge.mbala, juge.tshisekedi ont Role=6 (Consultant)
-- au lieu de Role=3 (Collaborateur), car ils ont été créés avec l'ancienne valeur.

-- ================================================================
-- ÉTAPE 1 : Vérification des données actuelles
-- ================================================================

-- Afficher tous les utilisateurs avec leurs rôles actuels
SELECT 
    "Id",
    "Username",
    "Email",
    "NomComplet",
    "Role",
    "IsActive",
    "CreatedAt"
FROM "Users"
ORDER BY "Role", "Username";

-- Compter les utilisateurs par rôle
SELECT 
    "Role",
    COUNT(*) as "Count",
    STRING_AGG("Username", ', ') as "Usernames"
FROM "Users"
GROUP BY "Role"
ORDER BY "Role";

-- ================================================================
-- ÉTAPE 2 : Correction des Rôles Consultant → Collaborateur
-- ================================================================

-- Identifier les juges qui doivent être Collaborateur (rôle 3) au lieu de Consultant (rôle 6)
-- Critères : Username commence par "juge." ET Role = 6
SELECT 
    "Id",
    "Username",
    "Role" as "RoleActuel",
    3 as "NouveauRole"
FROM "Users"
WHERE "Username" LIKE 'juge.%'
  AND "Role" = 6;

-- Appliquer la correction (DÉCOMMENTER POUR EXÉCUTER)
-- UPDATE "Users" 
-- SET 
--     "Role" = 3,  -- Collaborateur
--     "UpdatedAt" = NOW()
-- WHERE "Username" LIKE 'juge.%'
--   AND "Role" = 6;

-- ================================================================
-- ÉTAPE 3 : Corrections Spécifiques (si besoin)
-- ================================================================

-- Si d'autres utilisateurs spécifiques nécessitent une correction :

-- Exemple : Corriger un utilisateur nommé spécifiquement
-- UPDATE "Users" 
-- SET 
--     "Role" = 3,  -- Collaborateur
--     "UpdatedAt" = NOW()
-- WHERE "Username" = 'juge.kabongo';

-- Exemple : Corriger plusieurs utilisateurs par leurs IDs
-- UPDATE "Users" 
-- SET 
--     "Role" = 3,  -- Collaborateur
--     "UpdatedAt" = NOW()
-- WHERE "Username" IN ('juge.kabongo', 'juge.mbala', 'juge.tshisekedi');

-- ================================================================
-- ÉTAPE 4 : Vérification Post-Migration
-- ================================================================

-- Vérifier que les corrections ont été appliquées
SELECT 
    "Username",
    "Role",
    "NomComplet",
    "UpdatedAt"
FROM "Users"
WHERE "Username" LIKE 'juge.%'
ORDER BY "Username";

-- Vérifier la distribution finale des rôles
SELECT 
    CASE "Role"
        WHEN 1 THEN 'Admin'
        WHEN 2 THEN 'Manager'
        WHEN 3 THEN 'Collaborateur'
        WHEN 4 THEN 'Assistant'
        WHEN 5 THEN 'AssistantJunior'
        WHEN 6 THEN 'Consultant'
        ELSE 'Unknown'
    END as "RoleName",
    "Role" as "RoleValue",
    COUNT(*) as "Count"
FROM "Users"
GROUP BY "Role"
ORDER BY "Role";

-- Vérifier que l'endpoint /api/users/juges retournera maintenant tous les juges
SELECT 
    "Id",
    "Username",
    "NomComplet",
    "Email"
FROM "Users"
WHERE "Role" = 3  -- Collaborateur
  AND "IsActive" = true
ORDER BY "NomComplet";

-- ================================================================
-- ROLLBACK (EN CAS DE PROBLÈME)
-- ================================================================

-- Si la migration a causé des problèmes, revenir à l'état précédent :
-- 
-- UPDATE "Users" 
-- SET 
--     "Role" = 6,  -- Remettre Consultant
--     "UpdatedAt" = NOW()
-- WHERE "Username" IN ('juge.kabongo', 'juge.mbala', 'juge.tshisekedi');

-- ================================================================
-- NOTES IMPORTANTES
-- ================================================================

-- 1. **Backup obligatoire avant exécution** :
--    pg_dump -h <host> -U <user> -d sigac_db -t Users > backup_users_$(date +%Y%m%d_%H%M%S).sql

-- 2. **Tester d'abord sur environnement de développement** :
--    Appliquer ce script sur DB locale avant production

-- 3. **Validation des changements** :
--    - Vérifier que /api/users/juges retourne tous les juges
--    - Tester création de dossier avec attribution de rapporteur
--    - Vérifier que les permissions RBAC fonctionnent

-- 4. **Application en Production (Render)** :
--    Option A - Via psql direct :
--      psql -h <render-host> -U <user> -d sigac_db -f migration-fix-existing-roles.sql
--    
--    Option B - Via Render Dashboard :
--      Database → Connect → Copier/coller les commandes UPDATE

-- 5. **Monitoring post-migration** :
--    - Surveiller logs backend pour erreurs liées aux rôles
--    - Vérifier que tous les utilisateurs peuvent se connecter
--    - Tester les principales fonctionnalités (CRUD dossiers, affectations)

-- ================================================================
-- FIN DU SCRIPT
-- ================================================================
