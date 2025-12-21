-- Migration pour mettre à jour UserStatus vers les 3 nouveaux états
-- Date: 2025-12-21
-- Mapping: Disponible→EnLigne (0), Occupé→Occupe (1), Autres→Absent (2)

-- Mettre à jour tous les statuts existants
-- Disponible (0) reste à 0 (EnLigne)
-- Occupé (1) reste à 1 (Occupé)
-- NePasDéranger (2) → 1 (Occupé)
-- Absent (3) → 2 (Absent)
-- HorsLigne (4) → 2 (Absent)
-- ApparaitreAbsent (5) → 2 (Absent)

UPDATE "Users" 
SET "Status" = 
  CASE 
    WHEN "Status" = 0 THEN 0  -- Disponible → EnLigne
    WHEN "Status" = 1 THEN 1  -- Occupé → Occupé
    WHEN "Status" = 2 THEN 1  -- NePasDéranger → Occupé
    WHEN "Status" = 3 THEN 2  -- Absent → Absent
    WHEN "Status" = 4 THEN 2  -- HorsLigne → Absent
    WHEN "Status" = 5 THEN 2  -- ApparaitreAbsent → Absent
    ELSE 0                     -- Par défaut → EnLigne
  END;

COMMENT ON COLUMN "Users"."Status" IS 'User status: 0=EnLigne (vert), 1=Occupe (rouge), 2=Absent (orange)';
