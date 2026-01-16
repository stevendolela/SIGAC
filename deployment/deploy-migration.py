"""
Script Python pour appliquer la migration VideoCall directement
"""
import sys

print("📹 Application de la migration VideoCall\n")

try:
    import psycopg2
    print("✅ psycopg2 trouvé\n")
except ImportError:
    print("❌ psycopg2 n'est pas installé!")
    print("\n💡 Installation:")
    print("   pip install psycopg2-binary")
    print("\nOu utilisez:")
    print("   py -m pip install psycopg2-binary")
    print()
    sys.exit(1)

# Connection string
conn_params = {
    'host': 'dpg-d4obq0a4i8rc73f06gl0-a.frankfurt-postgres.render.com',
    'port': 5432,
    'database': 'postgresql_sigac_e1f4',
    'user': 'postgresql_sigac_e1f4_user',
    'password': 'wboMdsAzEhwVXP6nHZl2ZHO0V0Hhdzqe',
    'sslmode': 'require'
}

sql = """
-- Créer la table VideoCalls
CREATE TABLE IF NOT EXISTS "VideoCalls" (
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
        REFERENCES "ChatConversations" ("Id"),
    CONSTRAINT "FK_VideoCalls_ChatGroups_GroupId" FOREIGN KEY ("GroupId") 
        REFERENCES "ChatGroups" ("Id"),
    CONSTRAINT "FK_VideoCalls_Users_InitiatorId" FOREIGN KEY ("InitiatorId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_VideoCalls_Users_ReceiverId" FOREIGN KEY ("ReceiverId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_VideoCalls_ConversationId" ON "VideoCalls" ("ConversationId");
CREATE INDEX IF NOT EXISTS "IX_VideoCalls_GroupId" ON "VideoCalls" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_VideoCalls_InitiatorId" ON "VideoCalls" ("InitiatorId");
CREATE INDEX IF NOT EXISTS "IX_VideoCalls_ReceiverId" ON "VideoCalls" ("ReceiverId");
CREATE INDEX IF NOT EXISTS "IX_VideoCalls_Status" ON "VideoCalls" ("Status");

ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "Status" integer NOT NULL DEFAULT 0;
"""

try:
    print("🔗 Connexion à la base de données...")
    conn = psycopg2.connect(**conn_params)
    print("✅ Connecté!\n")
    
    cur = conn.cursor()
    
    print("⏳ Exécution de la migration...")
    cur.execute(sql)
    conn.commit()
    
    print("✅ Migration appliquée avec succès!\n")
    
    # Vérification
    cur.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'VideoCalls'")
    count = cur.fetchone()[0]
    
    if count > 0:
        print("✅ Table VideoCalls existe!")
        
        # Compter les colonnes
        cur.execute("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = 'VideoCalls'
        """)
        col_count = cur.fetchone()[0]
        print(f"✅ {col_count} colonnes créées")
        
    cur.close()
    conn.close()
    
    print("\n🎉 Migration terminée!")
    print("\n🧪 Testez maintenant:")
    print("   1. Rechargez https://taajii.fr (Ctrl+F5)")
    print("   2. Ouvrez une conversation")
    print("   3. Cliquez sur le bouton 📹")
    print("   4. L'appel devrait s'initier!\n")
    
except Exception as e:
    print(f"\n❌ Erreur: {e}")
    print("\n💡 Alternatives:")
    print("   1. Via Render Dashboard: https://dashboard.render.com")
    print("   2. Service sigac-api > Shell")
    print("   3. Exécuter: dotnet ef database update\n")
    sys.exit(1)
