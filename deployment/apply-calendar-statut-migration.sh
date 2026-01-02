#!/bin/bash
# Script: Appliquer migration Statut/Rappel/Participants au calendrier
# Usage: ./apply-calendar-statut-migration.sh

set -e  # Exit on error

echo "=========================================="
echo "Migration Calendrier: Statut + Rappel"
echo "=========================================="
echo ""

# Vérifier que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erreur: DATABASE_URL non défini"
    echo ""
    echo "Pour définir DATABASE_URL depuis Render:"
    echo "1. Aller sur https://dashboard.render.com"
    echo "2. Sélectionner votre PostgreSQL"
    echo "3. Copier 'External Database URL'"
    echo "4. Export: export DATABASE_URL='postgres://...'"
    echo ""
    echo "Ou utiliser la connexion locale:"
    echo "export DATABASE_URL='postgres://sigac_user:SecurePassword2024!@localhost:5432/sigac_db'"
    exit 1
fi

echo "✓ DATABASE_URL détecté"
echo ""

# Afficher info connexion (masquer password)
DB_INFO=$(echo $DATABASE_URL | sed 's/:[^@]*@/:***@/')
echo "Connexion: $DB_INFO"
echo ""

# Chemin de la migration
MIGRATION_FILE="/workspaces/SIGAC/deployment/migration-calendar-statut-rappel.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Erreur: Fichier migration introuvable: $MIGRATION_FILE"
    exit 1
fi

echo "✓ Fichier migration trouvé"
echo ""

# Confirmer avant exécution
echo "⚠️  Cette migration va:"
echo "  1. Ajouter colonne 'Statut' (VARCHAR 50, défaut 'Planifie')"
echo "  2. Ajouter colonne 'RappelAvant' (INTEGER, défaut 30)"
echo "  3. Ajouter colonne 'Participants' (TEXT, pour JSON array)"
echo "  4. Créer 2 index pour optimisation"
echo "  5. Mettre à jour les événements existants"
echo ""
read -p "Continuer? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration annulée"
    exit 0
fi

echo ""
echo "🚀 Application de la migration..."
echo ""

# Exécuter la migration
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Migration appliquée avec succès!"
    echo "=========================================="
    echo ""
    echo "Vérifications effectuées:"
    echo ""
    
    # Vérifier les colonnes
    echo "📋 Colonnes de CalendarEvents:"
    psql "$DATABASE_URL" -c "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'CalendarEvents' ORDER BY ordinal_position;" -t
    
    echo ""
    echo "📊 Index créés:"
    psql "$DATABASE_URL" -c "SELECT indexname FROM pg_indexes WHERE tablename = 'CalendarEvents';" -t
    
    echo ""
    echo "📈 Statistiques:"
    TOTAL_EVENTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"CalendarEvents\";")
    echo "  Événements totaux: $TOTAL_EVENTS"
    
    EVENTS_WITH_STATUS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"CalendarEvents\" WHERE \"Statut\" IS NOT NULL;")
    echo "  Avec statut défini: $EVENTS_WITH_STATUS"
    
    echo ""
    echo "✅ Prochaines étapes:"
    echo "  1. Mettre à jour les DTOs backend (CalendarEventDto.cs)"
    echo "  2. Ajouter propriétés: Statut, RappelAvant, Participants"
    echo "  3. Mettre à jour CalendarMappingProfile.cs"
    echo "  4. Redéployer backend sur Render"
    echo "  5. Tester création d'événements avec nouveaux champs"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "❌ Erreur lors de la migration"
    echo "=========================================="
    echo ""
    echo "Vérifier:"
    echo "  1. DATABASE_URL correct?"
    echo "  2. Connexion réseau OK?"
    echo "  3. Permissions PostgreSQL suffisantes?"
    echo ""
    exit 1
fi
