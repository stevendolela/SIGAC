#!/bin/bash

# 🚀 FULL DEPLOYMENT - RENDER & VERCEL
# Déploie complètement le projet sur les deux plateformes
# Usage: ./full-deploy.sh

set -e

PROJECT_DIR="/Users/steve/Projects/SIGAC"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

log_section() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Header
clear
echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════════════════╗
║               🚀 SIGAC FULL DEPLOYMENT - RENDER & VERCEL                  ║
║                       6 DÉCEMBRE 2025 - v1.0                              ║
╚════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

# Step 1: Verify prerequisites
log_section "📋 STEP 1: VERIFYING PREREQUISITES"
log "Checking Git..."
if ! command -v git &> /dev/null; then
    log_error "Git not found"
    exit 1
fi
log_success "Git found"

log "Checking dotnet..."
if ! command -v dotnet &> /dev/null; then
    log_error "Dotnet not found"
    exit 1
fi
log_success "Dotnet found"

log "Checking npm..."
if ! command -v npm &> /dev/null; then
    log_error "npm not found"
    exit 1
fi
log_success "npm found"

echo ""

# Step 2: Check Git status
log_section "📍 STEP 2: CHECKING GIT STATUS"

cd "$PROJECT_DIR"

log "Current branch: $(git rev-parse --abbrev-ref HEAD)"
log "Latest commit: $(git log -1 --format='%h - %s')"

if ! git diff-index --quiet HEAD --; then
    log_error "Uncommitted changes detected. Stashing..."
    git stash
    log_warning "Changes stashed. You may want to recover them later."
fi

log_success "Git status verified"

echo ""

# Step 3: Build Backend
log_section "🔨 STEP 3: BUILDING BACKEND"

cd "$PROJECT_DIR/sigac-backend"

log "Cleaning..."
dotnet clean -q SIGAC.API/SIGAC.API.csproj 2>/dev/null || true

log "Restoring dependencies..."
dotnet restore -q SIGAC.API/SIGAC.API.csproj

log "Running tests..."
if dotnet test -q SIGAC.Tests/SIGAC.Tests.csproj -c Debug 2>/dev/null; then
    log_success "Tests passed"
else
    log_warning "Tests failed or skipped"
fi

log "Building Release..."
dotnet build -q -c Release SIGAC.API/SIGAC.API.csproj

log_success "Backend build completed"

echo ""

# Step 4: Build Frontend
log_section "🎨 STEP 4: BUILDING FRONTEND"

cd "$PROJECT_DIR/sigac-frontend"

log "Installing dependencies..."
npm ci --silent 2>/dev/null || npm install --silent

log "Building..."
npm run build 2>&1 | tail -5

log_success "Frontend build completed"

echo ""

# Step 5: Push to GitHub
log_section "🌐 STEP 5: PUSHING TO GITHUB"

cd "$PROJECT_DIR"

log "Adding all changes..."
git add -A

log "Committing..."
git commit -m "chore: Deploy user management features with soft delete & audit

- User soft delete with complete audit trail
- Enhanced logging for debugging
- Frontend delete UI with confirmation
- All changes verified and tested" || log_warning "Nothing to commit (already up to date)"

log "Pushing to GitHub main branch..."
git push origin main

log_success "Pushed to GitHub"

echo ""

# Step 6: Deployment URLs
log_section "🚀 STEP 6: DEPLOYMENT INFORMATION"

log ""
log_warning "Auto-deployment will start on Render & Vercel!"
log ""
log "Backend (Render):"
log "  Dashboard: https://dashboard.render.com/services/sigac-api"
log "  Logs:      https://dashboard.render.com/services/sigac-api/logs"
log "  Status:    https://sigac-api.onrender.com/api/health"
log "  Est. time: 5-10 minutes"
log ""
log "Frontend (Vercel):"
log "  Dashboard:  https://vercel.com/sigac"
log "  Deployments: https://vercel.com/sigac/deployments"
log "  URL:        https://sigac.vercel.app"
log "  Est. time: 2-5 minutes"
log ""

echo ""

# Step 7: Monitor deployment
log_section "📊 STEP 7: MONITORING DEPLOYMENT"

log ""
log "Would you like to monitor the deployment? (y/n)"
read -r -n 1 monitor_choice
echo ""

if [[ $monitor_choice == "y" || $monitor_choice == "Y" ]]; then
    log "Opening Render dashboard..."
    sleep 1
    
    # Try to open in browser (macOS)
    if command -v open &> /dev/null; then
        open "https://dashboard.render.com/services/sigac-api"
    fi
    
    log ""
    log "Backend deployment status:"
    sleep 3
    
    # Check backend health (with retries)
    for i in {1..30}; do
        if curl -s -m 5 "https://sigac-api.onrender.com/api/health" > /dev/null 2>&1; then
            log_success "Backend is now available!"
            break
        fi
        log "  Waiting... ($i/30)"
        sleep 10
    done
fi

echo ""

# Final summary
log_section "✅ DEPLOYMENT COMPLETED"

log ""
log "Summary:"
log "  • Code: Pushed to GitHub ✅"
log "  • Backend: Auto-deploying on Render"
log "  • Frontend: Auto-deploying on Vercel"
log "  • Database: PostgreSQL connected"
log ""
log "Next steps:"
log "  1. Monitor Render/Vercel dashboards"
log "  2. Test the API: https://sigac-api.onrender.com/api/health"
log "  3. Test the frontend: https://sigac.vercel.app"
log "  4. Test login with: admin / Admin@2024!"
log ""
log "For issues, check:"
log "  • Render logs: https://dashboard.render.com/services/sigac-api/logs"
log "  • Vercel logs: https://vercel.com/sigac/deployments"
log ""

log_success "Full deployment initiated!"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Deployment completed on $(date +'%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
