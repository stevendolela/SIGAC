-- Migration: AddVideoCallEntity
-- Date: 2026-01-16
-- Description: Ajoute la table VideoCalls pour les appels vidéo WebRTC

-- Vérifier si la table existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'VideoCalls') THEN
        -- Créer la table VideoCalls
        CREATE TABLE "VideoCalls" (
            "Id" uuid NOT NULL,
            "InitiatorId" uuid NOT NULL,
            "ReceiverId" uuid NOT NULL,
            "ConversationId" uuid NULL,
            "GroupId" uuid NULL,
            "Status" integer NOT NULL,
            "StartedAt" timestamp with time zone NOT NULL,
            "EndedAt" timestamp with time zone NULL,
            "DurationSeconds" integer NULL,
            "SignalingData" text NULL,
            CONSTRAINT "PK_VideoCalls" PRIMARY KEY ("Id"),
            CONSTRAINT "FK_VideoCalls_ChatConversations_ConversationId" FOREIGN KEY ("ConversationId") 
                REFERENCES "ChatConversations" ("Id") ON DELETE NO ACTION,
            CONSTRAINT "FK_VideoCalls_ChatGroups_GroupId" FOREIGN KEY ("GroupId") 
                REFERENCES "ChatGroups" ("Id") ON DELETE NO ACTION,
            CONSTRAINT "FK_VideoCalls_Users_InitiatorId" FOREIGN KEY ("InitiatorId") 
                REFERENCES "Users" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_VideoCalls_Users_ReceiverId" FOREIGN KEY ("ReceiverId") 
                REFERENCES "Users" ("Id") ON DELETE CASCADE
        );

        -- Créer les index
        CREATE INDEX "IX_VideoCalls_ConversationId" ON "VideoCalls" ("ConversationId");
        CREATE INDEX "IX_VideoCalls_GroupId" ON "VideoCalls" ("GroupId");
        CREATE INDEX "IX_VideoCalls_InitiatorId" ON "VideoCalls" ("InitiatorId");
        CREATE INDEX "IX_VideoCalls_ReceiverId" ON "VideoCalls" ("ReceiverId");
        CREATE INDEX "IX_VideoCalls_Status" ON "VideoCalls" ("Status");

        RAISE NOTICE '✅ Table VideoCalls créée avec succès';
    ELSE
        RAISE NOTICE '⚠️  Table VideoCalls existe déjà, aucune modification';
    END IF;
END $$;

-- Ajouter la colonne Status à Users si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Users' AND column_name = 'Status') THEN
        ALTER TABLE "Users" ADD COLUMN "Status" integer NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ Colonne Status ajoutée à la table Users';
    ELSE
        RAISE NOTICE '⚠️  Colonne Status existe déjà dans Users';
    END IF;
END $$;

-- Vérification finale
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'VideoCalls') 
        THEN '✅ Table VideoCalls existe'
        ELSE '❌ Table VideoCalls manquante'
    END as videocalls_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'Users' AND column_name = 'Status')
        THEN '✅ Colonne Users.Status existe'
        ELSE '❌ Colonne Users.Status manquante'
    END as user_status_column;

-- Afficher la structure de la table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'VideoCalls'
ORDER BY ordinal_position;
