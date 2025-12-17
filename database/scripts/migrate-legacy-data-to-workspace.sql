-- Migration des données existantes vers un Workspace par défaut
-- Date: 2025-12-16
-- Description: Crée un workspace "CC RDC - Données Historiques" et y assigne tous les dossiers/formations existants

DO $$
DECLARE
    v_workspace_id UUID;
    v_admin_user_id UUID;
BEGIN
    -- 1. Récupérer l'ID de l'utilisateur admin (owner du workspace)
    SELECT "Id" INTO v_admin_user_id
    FROM "Users"
    WHERE "Role" = 1 -- 1 = Admin (voir UserRole enum: Admin=1, President=2, JugeConstitutionnel=3)
    LIMIT 1;

    IF v_admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Aucun utilisateur Admin trouvé. Migration annulée.';
    END IF;

    RAISE NOTICE 'Admin user ID: %', v_admin_user_id;

    -- 2. Créer le workspace par défaut (si n''existe pas déjà)
    INSERT INTO "Workspaces" (
        "Id",
        "Name",
        "Slug",
        "Description",
        "LogoUrl",
        "MaxStorageGB",
        "MaxUsers",
        "AllowGuestAccess",
        "IsActive",
        "OwnerId",
        "CreatedAt",
        "ModifiedAt"
    )
    VALUES (
        gen_random_uuid(),
        'CC RDC - Données Historiques',
        'cc-rdc-legacy',
        'Workspace contenant tous les dossiers et données historiques de la Cour Constitutionnelle RDC créés avant la mise en place du système multi-workspace.',
        NULL,
        500, -- 500 GB de stockage
        100, -- 100 utilisateurs max
        false, -- Pas d''accès invité
        true, -- Actif
        v_admin_user_id,
        NOW(),
        NULL
    )
    ON CONFLICT ("Slug") DO NOTHING
    RETURNING "Id" INTO v_workspace_id;

    -- Si le workspace existait déjà, récupérer son ID
    IF v_workspace_id IS NULL THEN
        SELECT "Id" INTO v_workspace_id
        FROM "Workspaces"
        WHERE "Slug" = 'cc-rdc-legacy';
        
        RAISE NOTICE 'Workspace legacy déjà existant: %', v_workspace_id;
    ELSE
        RAISE NOTICE 'Workspace legacy créé: %', v_workspace_id;
    END IF;

    -- 3. Assigner tous les dossiers sans workspace au workspace legacy
    UPDATE "Dossiers"
    SET "WorkspaceId" = v_workspace_id
    WHERE "WorkspaceId" IS NULL;

    RAISE NOTICE 'Dossiers assignés: % dossiers', (SELECT COUNT(*) FROM "Dossiers" WHERE "WorkspaceId" = v_workspace_id);

    -- 4. Assigner toutes les formations sans workspace au workspace legacy
    UPDATE "Formations"
    SET "WorkspaceId" = v_workspace_id
    WHERE "WorkspaceId" IS NULL;

    RAISE NOTICE 'Formations assignées: % formations', (SELECT COUNT(*) FROM "Formations" WHERE "WorkspaceId" = v_workspace_id);

    -- 5. Ajouter tous les utilisateurs actifs comme membres du workspace legacy (si pas déjà membres)
    INSERT INTO "WorkspaceUsers" (
        "WorkspaceId",
        "UserId",
        "Role",
        "JoinedAt",
        "InvitedBy",
        "IsActive"
    )
    SELECT
        v_workspace_id,
        u."Id",
        CASE 
            WHEN u."Role" = 1 THEN 1  -- Admin devient Admin workspace
            WHEN u."Role" = 2 THEN 1  -- President devient Admin workspace
            ELSE 2                     -- JugeConstitutionnel devient Member
        END,
        NOW(),
        NULL,
        true
    FROM "Users" u
    WHERE u."IsActive" = true
    ON CONFLICT ("WorkspaceId", "UserId") DO NOTHING;

    RAISE NOTICE 'Membres ajoutés: % utilisateurs', (SELECT COUNT(*) FROM "WorkspaceUsers" WHERE "WorkspaceId" = v_workspace_id);

    -- 6. Afficher un résumé
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION TERMINÉE AVEC SUCCÈS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Workspace créé: CC RDC - Données Historiques';
    RAISE NOTICE 'Slug: cc-rdc-legacy';
    RAISE NOTICE 'ID: %', v_workspace_id;
    RAISE NOTICE 'Owner: % (Admin)', v_admin_user_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Statistiques:';
    RAISE NOTICE '  - Dossiers: %', (SELECT COUNT(*) FROM "Dossiers" WHERE "WorkspaceId" = v_workspace_id);
    RAISE NOTICE '  - Formations: %', (SELECT COUNT(*) FROM "Formations" WHERE "WorkspaceId" = v_workspace_id);
    RAISE NOTICE '  - Membres: %', (SELECT COUNT(*) FROM "WorkspaceUsers" WHERE "WorkspaceId" = v_workspace_id);
    RAISE NOTICE '========================================';

END $$;

-- Vérification finale
SELECT 
    'SUMMARY' as type,
    w."Name" as workspace_name,
    w."Slug" as slug,
    (SELECT COUNT(*) FROM "Dossiers" WHERE "WorkspaceId" = w."Id") as dossiers_count,
    (SELECT COUNT(*) FROM "Formations" WHERE "WorkspaceId" = w."Id") as formations_count,
    (SELECT COUNT(*) FROM "WorkspaceUsers" WHERE "WorkspaceId" = w."Id") as members_count
FROM "Workspaces" w
WHERE w."Slug" = 'cc-rdc-legacy';
