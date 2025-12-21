-- Migration: Add User Status field
-- Date: 2025-12-21
-- Description: Ajout du statut de disponibilité utilisateur (inspiré Teams)

-- Ajouter la colonne Status avec valeur par défaut 0 (Disponible)
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS "Status" integer NOT NULL DEFAULT 0;

-- Commentaire pour documentation
COMMENT ON COLUMN "Users"."Status" IS 'Statut utilisateur: 0=Disponible, 1=Occupé, 2=NePasDéranger, 3=Absent, 4=HorsLigne, 5=ApparaitreAbsent';
