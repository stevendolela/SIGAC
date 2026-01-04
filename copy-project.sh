#!/bin/bash
# Script: Créer une copie du projet SIGAC
# Usage: ./copy-project.sh [nom-nouveau-projet] [destination]

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Paramètres
NEW_PROJECT_NAME="${1:-SIGAC-Copy}"
DESTINATION="${2:-../}"
SOURCE_DIR="/workspaces/SIGAC"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📦 Création d'une copie du projet SIGAC${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Vérifier que le répertoire source existe
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}❌ Erreur: Répertoire source introuvable: $SOURCE_DIR${NC}"
    exit 1
fi

# Créer le chemin de destination
DEST_PATH="$DESTINATION/$NEW_PROJECT_NAME"

# Vérifier si la destination existe déjà
if [ -d "$DEST_PATH" ]; then
    echo -e "${YELLOW}⚠️  Le répertoire $DEST_PATH existe déjà${NC}"
    read -p "Voulez-vous le supprimer et continuer? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$DEST_PATH"
        echo -e "${GREEN}✅ Ancien répertoire supprimé${NC}"
    else
        echo -e "${RED}❌ Opération annulée${NC}"
        exit 0
    fi
fi

echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "   Source: $SOURCE_DIR"
echo -e "   Destination: $DEST_PATH"
echo -e "   Nom projet: $NEW_PROJECT_NAME"
echo ""

# Créer le répertoire de destination
echo -e "${BLUE}1. Création du répertoire de destination...${NC}"
mkdir -p "$DEST_PATH"
echo -e "${GREEN}✅ Répertoire créé${NC}"
echo ""

# Copier les fichiers (exclure node_modules, bin, obj, etc.)
echo -e "${BLUE}2. Copie des fichiers (peut prendre quelques minutes)...${NC}"
rsync -av --progress \
    --exclude 'node_modules/' \
    --exclude '.git/' \
    --exclude 'bin/' \
    --exclude 'obj/' \
    --exclude 'dist/' \
    --exclude 'build/' \
    --exclude '.vscode/' \
    --exclude '.vs/' \
    --exclude '*.log' \
    --exclude '.env.local' \
    --exclude '.DS_Store' \
    --exclude 'uploads/' \
    --exclude 'logs/' \
    "$SOURCE_DIR/" "$DEST_PATH/"

echo -e "${GREEN}✅ Fichiers copiés${NC}"
echo ""

# Initialiser un nouveau repo Git
echo -e "${BLUE}3. Initialisation du nouveau repo Git...${NC}"
cd "$DEST_PATH"
if [ -d ".git" ]; then
    rm -rf .git
fi
git init
git add .
git commit -m "Initial commit: Copy of SIGAC project"
echo -e "${GREEN}✅ Repo Git initialisé${NC}"
echo ""

# Créer les fichiers .env à partir des exemples
echo -e "${BLUE}4. Configuration des fichiers .env...${NC}"

# Frontend .env
if [ -f "sigac-frontend/.env.example" ]; then
    cp sigac-frontend/.env.example sigac-frontend/.env
    echo -e "${GREEN}✅ Frontend .env créé${NC}"
else
    cat > sigac-frontend/.env << 'EOF'
VITE_API_URL=http://localhost:5210/api
VITE_APP_NAME=SIGAC Copy
VITE_APP_VERSION=1.0.0
EOF
    echo -e "${GREEN}✅ Frontend .env créé (défaut)${NC}"
fi

# Backend appsettings.Development.json
if [ -f "sigac-backend/SIGAC.API/appsettings.Development.json" ]; then
    # Modifier le nom de la base de données pour éviter les conflits
    sed -i 's/sigac_db/sigac_db_copy/g' sigac-backend/SIGAC.API/appsettings.Development.json
    echo -e "${GREEN}✅ Backend appsettings modifié (DB: sigac_db_copy)${NC}"
fi

echo ""

# Créer un docker-compose personnalisé
echo -e "${BLUE}5. Création du docker-compose personnalisé...${NC}"
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: sigac-copy-postgres
    environment:
      POSTGRES_USER: sigac_user
      POSTGRES_PASSWORD: SecurePassword2024!
      POSTGRES_DB: sigac_db_copy
    ports:
      - "5435:5432"
    volumes:
      - postgres_data_copy:/var/lib/postgresql/data
    networks:
      - sigac_copy_network

volumes:
  postgres_data_copy:
    driver: local

networks:
  sigac_copy_network:
    driver: bridge
EOF
echo -e "${GREEN}✅ docker-compose.yml créé (port PostgreSQL: 5435)${NC}"
echo ""

# Créer un README pour la copie
echo -e "${BLUE}6. Création du README...${NC}"
cat > README_COPY.md << EOF
# $NEW_PROJECT_NAME

Copie du projet SIGAC créée le $(date +"%Y-%m-%d %H:%M:%S")

## Différences avec l'original

- **Base de données:** sigac_db_copy (port 5435)
- **Nouveau repo Git:** Initialisé sans historique
- **Configuration:** Fichiers .env créés à partir des exemples

## Démarrage Rapide

### 1. Démarrer PostgreSQL

\`\`\`bash
docker-compose up -d
\`\`\`

### 2. Backend (.NET 8)

\`\`\`bash
cd sigac-backend

# Restore packages
dotnet restore

# Appliquer migrations
dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API

# Démarrer l'API
dotnet run --project SIGAC.API
# Écoute sur http://localhost:5210
\`\`\`

### 3. Frontend (React + Vite)

\`\`\`bash
cd sigac-frontend

# Installer dépendances
npm install

# Démarrer dev server
npm run dev
# Écoute sur http://localhost:5174
\`\`\`

## Comptes de Test

- **Admin:** admin / Admin@2024!
- **Président:** president.benoit / President@2024!
- **Juge:** juge.mbala / Juge@2024!

## Documentation

Voir les fichiers suivants:
- \`README.md\` - Documentation principale
- \`CALENDAR_README.md\` - Système calendrier
- \`AWS_DEPLOYMENT_PLAN.md\` - Plan déploiement AWS
- \`.github/copilot-instructions.md\` - Architecture complète

## Notes

Cette copie est indépendante du projet original. Les modifications ici n'affectent pas SIGAC principal.

Pour synchroniser avec l'original:
\`\`\`bash
# Ajouter l'original comme remote
git remote add original /workspaces/SIGAC
git fetch original
git merge original/main
\`\`\`

---

Créé le: $(date +"%Y-%m-%d %H:%M:%S")
Source: $SOURCE_DIR
EOF
echo -e "${GREEN}✅ README_COPY.md créé${NC}"
echo ""

# Créer un script de synchronisation
echo -e "${BLUE}7. Création du script de synchronisation...${NC}"
cat > sync-from-original.sh << 'EOF'
#!/bin/bash
# Synchroniser les modifications depuis le projet original

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Synchronisation depuis le projet original${NC}"
echo ""

ORIGINAL_PATH="/workspaces/SIGAC"

if [ ! -d "$ORIGINAL_PATH" ]; then
    echo "❌ Projet original introuvable: $ORIGINAL_PATH"
    exit 1
fi

# Sauvegarder les fichiers locaux modifiés
echo "1. Sauvegarde des modifications locales..."
git stash
echo -e "${GREEN}✅ Modifications sauvegardées${NC}"
echo ""

# Synchroniser les fichiers (exclure certains)
echo "2. Synchronisation des fichiers..."
rsync -av --progress \
    --exclude 'node_modules/' \
    --exclude '.git/' \
    --exclude 'bin/' \
    --exclude 'obj/' \
    --exclude 'dist/' \
    --exclude '.env' \
    --exclude 'appsettings.*.json' \
    --exclude 'docker-compose.yml' \
    "$ORIGINAL_PATH/" ./

echo -e "${GREEN}✅ Fichiers synchronisés${NC}"
echo ""

# Restaurer les modifications locales
echo "3. Restauration des modifications locales..."
git stash pop || echo "Aucune modification à restaurer"
echo ""

echo -e "${GREEN}✅ Synchronisation terminée !${NC}"
EOF
chmod +x sync-from-original.sh
echo -e "${GREEN}✅ sync-from-original.sh créé${NC}"
echo ""

# Créer .gitignore si absent
echo -e "${BLUE}8. Vérification .gitignore...${NC}"
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# .NET
bin/
obj/
*.user
*.suo
*.userosscache
*.sln.docstates
[Dd]ebug/
[Rr]elease/
x64/
x86/
[Aa]rm/
[Aa]rm64/
bld/
[Bb]in/
[Oo]bj/
[Ll]og/
[Ll]ogs/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.vs/
.idea/
*.swp
*.swo
*~

# Uploads
uploads/
temp/

# Database
*.db
*.sqlite
EOF
    echo -e "${GREEN}✅ .gitignore créé${NC}"
else
    echo -e "${GREEN}✅ .gitignore existe déjà${NC}"
fi
echo ""

# Statistiques
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Statistiques de la copie${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

TOTAL_FILES=$(find . -type f | wc -l)
TOTAL_SIZE=$(du -sh . | cut -f1)

echo -e "📁 Fichiers copiés: $TOTAL_FILES"
echo -e "💾 Taille totale: $TOTAL_SIZE"
echo -e "📂 Emplacement: $DEST_PATH"
echo ""

# Instructions finales
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Copie du projet terminée avec succès !${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${BLUE}📋 Prochaines étapes:${NC}"
echo ""
echo -e "1. Naviguer vers la copie:"
echo -e "   ${YELLOW}cd $DEST_PATH${NC}"
echo ""
echo -e "2. Lire la documentation:"
echo -e "   ${YELLOW}cat README_COPY.md${NC}"
echo ""
echo -e "3. Démarrer PostgreSQL:"
echo -e "   ${YELLOW}docker-compose up -d${NC}"
echo ""
echo -e "4. Configurer la base de données:"
echo -e "   ${YELLOW}cd sigac-backend${NC}"
echo -e "   ${YELLOW}dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API${NC}"
echo ""
echo -e "5. Démarrer le backend:"
echo -e "   ${YELLOW}dotnet run --project SIGAC.API${NC}"
echo ""
echo -e "6. Démarrer le frontend (nouveau terminal):"
echo -e "   ${YELLOW}cd sigac-frontend${NC}"
echo -e "   ${YELLOW}npm install${NC}"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo -e "7. Ouvrir le navigateur:"
echo -e "   ${YELLOW}http://localhost:5174${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "   - README_COPY.md (spécifique à cette copie)"
echo -e "   - README.md (documentation principale)"
echo -e "   - CALENDAR_README.md (système calendrier)"
echo ""
echo -e "${BLUE}🔄 Synchronisation:${NC}"
echo -e "   Pour synchroniser avec le projet original:"
echo -e "   ${YELLOW}./sync-from-original.sh${NC}"
echo ""
echo -e "${GREEN}Bonne continuation ! 🚀${NC}"
