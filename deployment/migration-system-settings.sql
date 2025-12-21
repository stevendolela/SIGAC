-- Migration: Add SystemSettings table
-- Date: 2025-12-21
-- Description: Stockage du logo système dans la base de données

CREATE TABLE IF NOT EXISTS "SystemSettings" (
    "Id" uuid NOT NULL,
    "LogoBase64" text NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NULL,
    "UpdatedBy" uuid NULL,
    CONSTRAINT "PK_SystemSettings" PRIMARY KEY ("Id")
);

-- Note: Cette table contiendra une seule ligne pour la configuration globale du système
