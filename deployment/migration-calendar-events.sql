-- Migration: Ajouter table CalendarEvents
-- Date: 2026-01-02
-- Description: Création de la table pour les événements du calendrier

CREATE TABLE IF NOT EXISTS "CalendarEvents" (
    "Id" uuid NOT NULL,
    "Type" character varying(50) NOT NULL DEFAULT 'General',
    "Titre" character varying(200) NOT NULL,
    "Description" character varying(1000),
    "Debut" timestamp with time zone NOT NULL,
    "Fin" timestamp with time zone NOT NULL,
    "DossierId" uuid,
    "SalleId" uuid,
    "TouteLaJournee" boolean NOT NULL DEFAULT false,
    "CreatedBy" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" timestamp with time zone,
    CONSTRAINT "PK_CalendarEvents" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_CalendarEvents_Dossiers_DossierId" FOREIGN KEY ("DossierId") 
        REFERENCES "Dossiers" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_CalendarEvents_Salles_SalleId" FOREIGN KEY ("SalleId") 
        REFERENCES "Salles" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_CalendarEvents_Users_CreatedBy" FOREIGN KEY ("CreatedBy") 
        REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

-- Créer les index pour performances
CREATE INDEX IF NOT EXISTS "IX_CalendarEvents_DossierId" ON "CalendarEvents" ("DossierId");
CREATE INDEX IF NOT EXISTS "IX_CalendarEvents_SalleId" ON "CalendarEvents" ("SalleId");
CREATE INDEX IF NOT EXISTS "IX_CalendarEvents_CreatedBy" ON "CalendarEvents" ("CreatedBy");
CREATE INDEX IF NOT EXISTS "IX_CalendarEvents_Debut_Fin" ON "CalendarEvents" ("Debut", "Fin");

-- Vérification
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'CalendarEvents'
ORDER BY ordinal_position;

SELECT COUNT(*) as total_events FROM "CalendarEvents";
