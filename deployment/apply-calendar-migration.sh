#!/bin/bash
# Script pour appliquer la migration CalendarEvents sur Render
# Date: 2026-01-02

set -e

echo "🔧 Application de la migration CalendarEvents sur Render..."

# Variables (à récupérer depuis Render Dashboard)
DATABASE_URL=${DATABASE_URL:-"postgresql://sigac_user:password@host:5432/sigac_db"}

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  Assurez-vous d'avoir la DATABASE_URL correcte depuis Render Dashboard${NC}"
echo ""
echo "DATABASE_URL: ${DATABASE_URL}"
echo ""
read -p "Continuer? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Opération annulée"
    exit 1
fi

# Vérifier si psql est installé
if ! command -v psql &> /dev/null
then
    echo -e "${RED}❌ psql n'est pas installé. Installation...${NC}"
    sudo apt-get update && sudo apt-get install -y postgresql-client
fi

# Appliquer la migration
echo -e "${GREEN}📝 Application du script SQL...${NC}"
psql "${DATABASE_URL}" -f deployment/migration-calendar-events.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration appliquée avec succès!${NC}"
    echo ""
    echo -e "${GREEN}🎉 La table CalendarEvents est maintenant créée${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Tester l'ajout d'un événement dans le calendrier"
    echo "2. Vérifier que l'erreur 500 a disparu"
else
    echo -e "${RED}❌ Erreur lors de l'application de la migration${NC}"
    exit 1
fi
