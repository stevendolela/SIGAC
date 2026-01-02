-- Migration: Ajout des colonnes Statut, RappelAvant et Participants à CalendarEvents
-- Date: 2025-01-29
-- Objectif: Supporter la vision complète du calendrier (statuts workflow + rappels automatiques + participants)

-- Étape 1: Ajouter les colonnes
ALTER TABLE "CalendarEvents" 
ADD COLUMN IF NOT EXISTS "Statut" VARCHAR(50) DEFAULT 'Planifie' NOT NULL,
ADD COLUMN IF NOT EXISTS "RappelAvant" INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS "Participants" TEXT; -- JSON array de GUIDs: ["guid1", "guid2", ...]

-- Étape 2: Mettre à jour les événements existants avec le statut par défaut
UPDATE "CalendarEvents" 
SET "Statut" = 'Planifie', 
    "RappelAvant" = 30
WHERE "Statut" IS NULL OR "RappelAvant" IS NULL;

-- Étape 3: Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS "IX_CalendarEvents_Statut" ON "CalendarEvents" ("Statut");
CREATE INDEX IF NOT EXISTS "IX_CalendarEvents_DateDebut_RappelAvant" ON "CalendarEvents" ("DateDebut", "RappelAvant");

-- Étape 4: Vérifier la structure de la table
-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'CalendarEvents';

-- Étape 5: Vérifier les données
-- SELECT "Id", "Type", "Titre", "Statut", "RappelAvant", "Participants" 
-- FROM "CalendarEvents" 
-- LIMIT 5;

-- Notes d'implémentation:
-- 
-- Valeurs autorisées pour "Statut":
-- - 'Planifie' (défaut)
-- - 'EnCours'
-- - 'Termine'
-- - 'Reporte'
--
-- "RappelAvant" en minutes:
-- - 0 = Aucun rappel
-- - 15 = 15 minutes avant
-- - 30 = 30 minutes avant (défaut)
-- - 60 = 1 heure avant
-- - 120 = 2 heures avant
-- - 1440 = 1 jour avant (24h)
--
-- "Participants" format JSON:
-- - NULL = Aucun participant
-- - '[]' = Array vide
-- - '["guid1", "guid2"]' = Liste de User IDs

-- ROLLBACK (si besoin):
-- ALTER TABLE "CalendarEvents" 
-- DROP COLUMN IF EXISTS "Statut",
-- DROP COLUMN IF EXISTS "RappelAvant",
-- DROP COLUMN IF EXISTS "Participants";
-- DROP INDEX IF EXISTS "IX_CalendarEvents_Statut";
-- DROP INDEX IF EXISTS "IX_CalendarEvents_DateDebut_RappelAvant";
