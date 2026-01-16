#!/usr/bin/env python3
"""
Script pour appliquer la migration IceCandidates en production (Render PostgreSQL)
Date: 2026-01-16
"""

import psycopg2
import ssl
import sys

# Credentials Render Production
DB_CONFIG = {
    'host': 'dpg-d4obq0a4i8rc73f06gl0-a.frankfurt-postgres.render.com',
    'port': 5432,
    'database': 'postgresql_sigac_e1f4',
    'user': 'postgresql_sigac_e1f4_user',
    'password': 'wboMdsAzEhwVXP6nHZl2ZHO0V0Hhdzqe'
}

def apply_migration():
    """Applique la migration AddIceCandidatesToVideoCall"""
    
    print("🔗 Connexion à PostgreSQL Production (Render)...")
    print(f"   Host: {DB_CONFIG['host']}")
    print(f"   Database: {DB_CONFIG['database']}")
    
    try:
        # Créer contexte SSL qui accepte les certificats auto-signés
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        conn = psycopg2.connect(**DB_CONFIG, sslmode='require')
        cursor = conn.cursor()
        
        print("\n✅ Connecté!")
        
        # Vérifier si la colonne existe déjà
        print("\n🔍 Vérification de l'état actuel...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'VideoCalls'
            ORDER BY ordinal_position;
        """)
        
        print("\n📋 Colonnes actuelles de VideoCalls:")
        for row in cursor.fetchall():
            print(f"   - {row[0]} ({row[1]}) {'NULL' if row[2] == 'YES' else 'NOT NULL'}")
        
        # Vérifier si IceCandidates existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'VideoCalls' 
                AND column_name = 'IceCandidates'
            );
        """)
        
        exists = cursor.fetchone()[0]
        
        if exists:
            print("\n⚠️  La colonne IceCandidates existe déjà!")
            print("✅ Migration déjà appliquée. Rien à faire.")
        else:
            print("\n🔨 Application de la migration...")
            
            # Ajouter la colonne IceCandidates
            cursor.execute("""
                ALTER TABLE "VideoCalls" 
                ADD COLUMN "IceCandidates" TEXT NULL;
            """)
            
            conn.commit()
            print("✅ Colonne IceCandidates ajoutée!")
        
        # Vérifier le résultat final
        print("\n📊 État final de la table VideoCalls:")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'VideoCalls'
            AND column_name IN ('SignalingData', 'IceCandidates')
            ORDER BY ordinal_position;
        """)
        
        for row in cursor.fetchall():
            print(f"   ✅ {row[0]} ({row[1]}) {'NULL' if row[2] == 'YES' else 'NOT NULL'}")
        
        # Compter les appels existants
        cursor.execute('SELECT COUNT(*) FROM "VideoCalls";')
        count = cursor.fetchone()[0]
        print(f"\n📈 Nombre d'appels vidéo en base: {count}")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 Migration terminée avec succès!")
        return True
        
    except psycopg2.Error as e:
        print(f"\n❌ Erreur PostgreSQL: {e}")
        print(f"   Code: {e.pgcode}")
        print(f"   Message: {e.pgerror}")
        return False
    except Exception as e:
        print(f"\n❌ Erreur inattendue: {e}")
        return False

if __name__ == "__main__":
    print("=" * 70)
    print("  Migration: AddIceCandidatesToVideoCall")
    print("  Plateforme: Render PostgreSQL Production")
    print("=" * 70)
    
    success = apply_migration()
    
    if success:
        print("\n✅ SUCCÈS - La migration a été appliquée correctement")
        sys.exit(0)
    else:
        print("\n❌ ÉCHEC - La migration a échoué")
        sys.exit(1)
