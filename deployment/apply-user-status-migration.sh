#!/bin/bash

# Script pour appliquer la migration User.Status sur Render PostgreSQL
# Date: 2025-01-XX
# Description: Ajoute la colonne Status à la table Users

set -e

echo "=========================================="
echo "  Migration User.Status - Render PostgreSQL"
echo "=========================================="
echo ""

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL de connexion Render (à renseigner)
RENDER_DB_URL="${RENDER_DATABASE_URL:-}"

if [ -z "$RENDER_DB_URL" ]; then
    echo -e "${RED}❌ Erreur: Variable RENDER_DATABASE_URL non définie${NC}"
    echo ""
    echo "Solutions:"
    echo "  1. Exporter la variable:"
    echo "     export RENDER_DATABASE_URL='postgres://user:pass@host/db'"
    echo ""
    echo "  2. Ou passer en argument:"
    echo "     ./apply-user-status-migration.sh 'postgres://user:pass@host/db'"
    echo ""
    exit 1
fi

# Si passé en argument
if [ $# -ge 1 ]; then
    RENDER_DB_URL="$1"
fi

echo -e "${YELLOW}📋 Informations de migration:${NC}"
echo "  • Fichier SQL: migration-user-status.sql"
echo "  • Table cible: Users"
echo "  • Colonne ajoutée: Status (integer, NOT NULL, DEFAULT 0)"
echo "  • Valeurs possibles: 0-5 (Disponible, Occupé, NePasDéranger, Absent, HorsLigne, ApparaitreAbsent)"
echo ""

# Vérifier que le fichier SQL existe
if [ ! -f "migration-user-status.sql" ]; then
    echo -e "${RED}❌ Erreur: Fichier migration-user-status.sql introuvable${NC}"
    echo "Veuillez vous placer dans le dossier deployment/"
    exit 1
fi

echo -e "${YELLOW}⚠️  Cette migration va modifier la table Users en production${NC}"
echo -e "${YELLOW}   Toutes les données existantes seront préservées (Status=0 par défaut)${NC}"
echo ""
read -p "Continuer ? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Migration annulée${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🚀 Application de la migration...${NC}"

# Appliquer la migration
if psql "$RENDER_DB_URL" < migration-user-status.sql; then
    echo ""
    echo -e "${GREEN}✅ Migration appliquée avec succès !${NC}"
    echo ""
    
    echo -e "${YELLOW}🔍 Vérification de la colonne Status...${NC}"
    psql "$RENDER_DB_URL" -c "\d \"Users\"" | grep Status || echo "⚠️  Colonne Status non trouvée dans la description"
    
    echo ""
    echo -e "${GREEN}📊 Statistiques des statuts utilisateurs:${NC}"
    psql "$RENDER_DB_URL" -c "SELECT \"Status\", COUNT(*) as total FROM \"Users\" GROUP BY \"Status\" ORDER BY \"Status\";"
    
    echo ""
    echo -e "${GREEN}✨ Migration terminée !${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "  1. Vérifier le fonctionnement en local (localhost:5674)"
    echo "  2. Commit + Push vers GitHub"
    echo "  3. Déploiement automatique via Render + Vercel"
    echo "  4. Tester sur production (https://taajii.fr)"
    
else
    echo ""
    echo -e "${RED}❌ Erreur lors de l'application de la migration${NC}"
    echo ""
    echo "Vérifications:"
    echo "  • URL de connexion correcte ?"
    echo "  • Droits suffisants sur la base ?"
    echo "  • Base de données accessible ?"
    exit 1
fi
