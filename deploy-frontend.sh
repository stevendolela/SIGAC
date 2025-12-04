#!/bin/bash

# Script de déploiement du frontend SIGAC sur Freebox via FTPES
# Configuration
FTP_HOST="report.freeboxos.fr"
FTP_PORT="37554"
FTP_USER="freebox"
FTP_PASS="PeshoAdmin243?"
LOCAL_DIR="/Users/steve/Projects/SIGAC/sigac-frontend/dist"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Déploiement du frontend SIGAC sur Freebox via FTPES${NC}"
echo "Host: $FTP_HOST:$FTP_PORT"
echo "User: $FTP_USER"
echo "Source: $LOCAL_DIR"
echo ""

echo -e "${YELLOW}📤 Upload des fichiers...${NC}"

# Upload les fichiers individuellement avec curl
cd "$LOCAL_DIR"

# Fonction pour uploader récursivement
upload_files() {
    local dir=$1
    local base_path=$2
    
    for file in "$dir"/*; do
        if [ -d "$file" ]; then
            local dir_name=$(basename "$file")
            upload_files "$file" "$base_path/$dir_name"
        elif [ -f "$file" ]; then
            local file_name=$(basename "$file")
            local remote_path="$base_path/$file_name"
            echo -n "  Uploading $remote_path ... "
            
            curl -s -k --ssl-reqd \
                -u "$FTP_USER:$FTP_PASS" \
                -T "$file" \
                "ftp://$FTP_HOST:$FTP_PORT$remote_path" 2>&1 | grep -q "error\|Error" && echo "❌ ERREUR" || echo "✅"
        fi
    done
}

# Démarrer l'upload
upload_files "$LOCAL_DIR" ""

echo ""
echo -e "${GREEN}✅ Upload terminé !${NC}"
echo ""
echo -e "${GREEN}🎉 Frontend déployé sur :${NC}"
echo "   ftpes://report.freeboxos.fr:37554/"
echo ""
echo -e "${YELLOW}📝 Configuration :${NC}"
echo "- API backend : https://sigac-api.onrender.com/api"
echo "- Frontend accessible via : ftpes://report.freeboxos.fr:37554/"
echo ""
echo -e "${YELLOW}⚠️  À faire :${NC}"
echo "1. Configurer un serveur web sur Freebox pour servir les fichiers statiques"
echo "2. Configurer CORS backend pour accepter requêtes depuis le domaine Freebox"
echo "3. Configurer port forwarding 80/443 sur Freebox (si accès externe désiré)"
