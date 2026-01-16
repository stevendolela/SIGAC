#!/usr/bin/env python3
"""
Script pour nettoyer les anciens ICE candidates sans préfixe
Les nouveaux ICE candidates utilisent le format: "initiator:..." ou "receiver:..."
"""

import psycopg2
from psycopg2 import sql

# Configuration Render Frankfurt - URL External complète
DATABASE_URL = "postgresql://postgresql_sigac_e1f4_user:wboMdsAzEhwVXP6nHZl2ZHO0V0Hhdzqe@dpg-d4obq0a4i8rc73f06gl0-a.frankfurt-postgres.render.com/postgresql_sigac_e1f4"

# Parsed config
DB_CONFIG = {
    "host": "dpg-d4obq0a4i8rc73f06gl0-a.frankfurt-postgres.render.com",
    "port": 5432,
    "database": "postgresql_sigac_e1f4",
    "user": "postgresql_sigac_e1f4_user",
    "password": "wboMdsAzEhwVXP6nHZl2ZHO0V0Hhdzqe"
}

def clear_ice_candidates():
    print("🔗 Connexion à la base de données Render...")
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("✅ Connecté!")
        
        # Compter les appels avec ICE candidates
        cur.execute('SELECT COUNT(*) FROM "VideoCalls" WHERE "IceCandidates" IS NOT NULL')
        count = cur.fetchone()[0]
        print(f"📊 {count} appels avec ICE candidates trouvés")
        
        # Nettoyer les ICE candidates pour permettre les nouveaux appels
        cur.execute('UPDATE "VideoCalls" SET "IceCandidates" = NULL')
        conn.commit()
        
        print(f"✅ ICE candidates nettoyés pour {cur.rowcount} appels")
        
        cur.close()
        conn.close()
        print("✅ Terminé!")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")

if __name__ == "__main__":
    clear_ice_candidates()
