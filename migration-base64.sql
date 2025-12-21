-- Migration: Ajout de la colonne LogoBase64 à la table Workspaces
-- Date: 2025-12-21
-- Description: Ajoute la colonne LogoBase64 pour stocker les logos en base64 directement en BDD

-- Vérifier si la colonne existe déjà avant de l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Workspaces' 
        AND column_name = 'LogoBase64'
    ) THEN
        -- Ajouter la colonne LogoBase64
        ALTER TABLE "Workspaces" 
        ADD COLUMN "LogoBase64" TEXT NULL;
        
        RAISE NOTICE 'Colonne LogoBase64 ajoutée avec succès à la table Workspaces';
    ELSE
        RAISE NOTICE 'La colonne LogoBase64 existe déjà dans la table Workspaces';
    END IF;
END $$;

-- Vérifier le résultat
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Workspaces' 
AND column_name IN ('LogoUrl', 'LogoBase64')
ORDER BY column_name;
