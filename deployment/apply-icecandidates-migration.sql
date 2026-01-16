-- Migration: AddIceCandidatesToVideoCall
-- Date: 2026-01-16
-- Description: Ajouter la colonne IceCandidates pour stocker les ICE candidates WebRTC

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'VideoCalls' 
        AND column_name = 'IceCandidates'
    ) THEN
        -- Ajouter la colonne IceCandidates
        ALTER TABLE "VideoCalls" 
        ADD COLUMN "IceCandidates" TEXT NULL;
        
        RAISE NOTICE '✅ Colonne IceCandidates ajoutée à VideoCalls';
    ELSE
        RAISE NOTICE '⚠️ Colonne IceCandidates existe déjà';
    END IF;
END $$;

-- Vérifier le résultat
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'VideoCalls' 
AND column_name IN ('SignalingData', 'IceCandidates')
ORDER BY ordinal_position;
