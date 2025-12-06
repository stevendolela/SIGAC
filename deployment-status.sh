#!/bin/bash

# 📊 DEPLOYMENT STATUS DASHBOARD
# Affiche le statut en temps réel des déploiements
# Usage: ./deployment-status.sh

set -e

GITHUB_REPO="stevendolela/SIGAC"
RENDER_API_KEY="${RENDER_API_KEY:-}"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════════════════╗
║                    📊 SIGAC DEPLOYMENT STATUS DASHBOARD                   ║
║                              6 DÉCEMBRE 2025                              ║
╚════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Function to get GitHub status
github_status() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}🔗 GITHUB REPOSITORY${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    
    # Get latest commit
    latest_commit=$(cd /Users/steve/Projects/SIGAC && git log -1 --format="%h")
    latest_msg=$(cd /Users/steve/Projects/SIGAC && git log -1 --format="%s")
    latest_time=$(cd /Users/steve/Projects/SIGAC && git log -1 --format="%ai" | cut -d' ' -f1-2)
    branch=$(cd /Users/steve/Projects/SIGAC && git rev-parse --abbrev-ref HEAD)
    
    echo -e "Repository:    ${GREEN}$GITHUB_REPO${NC}"
    echo -e "Branch:        ${GREEN}$branch${NC}"
    echo -e "Latest Commit: ${YELLOW}$latest_commit${NC} - $latest_msg"
    echo -e "Commit Time:   ${CYAN}$latest_time${NC}"
    echo ""
}

# Function to check Render status
render_status() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}🟢 RENDER BACKEND${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    
    # Check API health
    api_url="https://sigac-api.onrender.com/api/health"
    echo -e "Checking: ${CYAN}$api_url${NC}"
    
    if response=$(curl -s -m 10 -w "%{http_code}" "$api_url" 2>/dev/null); then
        http_code="${response: -3}"
        body="${response%???}"
        
        if [ "$http_code" == "200" ]; then
            echo -e "Status:    ${GREEN}✅ ONLINE${NC} (HTTP $http_code)"
            echo -e "Response:  ${GREEN}$body${NC}"
        else
            echo -e "Status:    ${YELLOW}⚠️ WARNING${NC} (HTTP $http_code)"
        fi
    else
        echo -e "Status:    ${RED}❌ OFFLINE${NC} (Connection timeout)"
    fi
    
    echo ""
    echo -e "Dashboard:  ${CYAN}https://dashboard.render.com/services/sigac-api${NC}"
    echo -e "Logs:       ${CYAN}https://dashboard.render.com/services/sigac-api/logs${NC}"
    echo ""
}

# Function to check Vercel status
vercel_status() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}🟣 VERCEL FRONTEND${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    
    # Check Frontend health
    frontend_url="https://sigac.vercel.app"
    echo -e "Checking: ${CYAN}$frontend_url${NC}"
    
    if response=$(curl -s -m 10 -w "%{http_code}" -I "$frontend_url" 2>/dev/null); then
        http_code="${response: -3}"
        
        if [ "$http_code" == "200" ]; then
            echo -e "Status:    ${GREEN}✅ ONLINE${NC} (HTTP $http_code)"
        elif [ "$http_code" == "301" ] || [ "$http_code" == "302" ]; then
            echo -e "Status:    ${GREEN}✅ ONLINE${NC} (Redirecting - HTTP $http_code)"
        else
            echo -e "Status:    ${YELLOW}⚠️ WARNING${NC} (HTTP $http_code)"
        fi
    else
        echo -e "Status:    ${RED}❌ OFFLINE${NC} (Connection timeout)"
    fi
    
    echo ""
    echo -e "Dashboard: ${CYAN}https://vercel.com/sigac${NC}"
    echo -e "Deployments: ${CYAN}https://vercel.com/sigac/deployments${NC}"
    echo ""
}

# Function to check Database
database_status() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}🗄️  DATABASE (PostgreSQL)${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    
    # Try to connect to local DB
    if command -v psql &> /dev/null; then
        db_count=$(psql -U sigac_user -d sigac_db -h localhost -p 5434 -t -c "SELECT COUNT(*) FROM \"Users\";" 2>/dev/null || echo "N/A")
        
        if [ "$db_count" != "N/A" ]; then
            echo -e "Local DB:  ${GREEN}✅ CONNECTED${NC}"
            echo -e "Users:     ${GREEN}$db_count${NC}"
        else
            echo -e "Local DB:  ${YELLOW}⚠️ NOT AVAILABLE${NC}"
        fi
    else
        echo -e "psql:      ${YELLOW}⚠️ NOT INSTALLED${NC}"
    fi
    
    echo ""
    echo -e "Render DB: ${CYAN}https://dashboard.render.com/databases/postgresql-sigac${NC}"
    echo ""
}

# Function to display commands
commands() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}📋 COMMON COMMANDS${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    
    echo -e "Deploy All:      ${YELLOW}./deploy.sh all${NC}"
    echo -e "Deploy Backend:  ${YELLOW}./deploy.sh backend${NC}"
    echo -e "Deploy Frontend: ${YELLOW}./deploy.sh frontend${NC}"
    echo ""
    echo -e "View Backend Logs:"
    echo -e "  ${CYAN}cd sigac-backend && tail -f logs/sigac-*.txt${NC}"
    echo ""
    echo -e "Test Backend:"
    echo -e "  ${CYAN}curl https://sigac-api.onrender.com/api/health${NC}"
    echo ""
    echo -e "View Frontend:"
    echo -e "  ${CYAN}https://sigac.vercel.app${NC}"
    echo ""
}

# Main execution
github_status
render_status
vercel_status
database_status
commands

# Footer
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Generated on: $(date +'%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
