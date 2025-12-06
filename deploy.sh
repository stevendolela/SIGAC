#!/bin/bash

# 🚀 DEPLOYMENT SCRIPT - SIGAC
# Déploie automatiquement vers Render & Vercel
# Usage: ./deploy.sh [backend|frontend|all]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/Users/steve/Projects/SIGAC"
DEPLOY_LOG="deployment-$(date +%Y%m%d-%H%M%S).log"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 SIGAC DEPLOYMENT SCRIPT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Function to log
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1" | tee -a "$DEPLOY_LOG"
}

# Function to check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git not found. Please install git."
        exit 1
    fi
    
    if ! command -v dotnet &> /dev/null; then
        log_warning "Dotnet not found. Backend build will be skipped."
    fi
    
    if ! command -v npm &> /dev/null; then
        log_warning "npm not found. Frontend build will be skipped."
    fi
    
    log "✅ Prerequisites check passed"
}

# Function to verify git
verify_git_status() {
    log "📍 Checking Git status..."
    
    cd "$PROJECT_DIR"
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log_error "❌ Uncommitted changes detected. Please commit or stash changes."
        git status
        exit 1
    fi
    
    # Check if we're on main branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "main" ]; then
        log_warning "⚠️ Not on main branch (currently on: $current_branch)"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log "✅ Git status verified"
}

# Function to build backend
build_backend() {
    log "🔨 Building backend..."
    
    cd "$PROJECT_DIR/sigac-backend"
    
    # Clean
    log "  • Cleaning..."
    dotnet clean -q 2>/dev/null || log_warning "  ⚠️ Clean failed (continuing...)"
    
    # Restore
    log "  • Restoring dependencies..."
    dotnet restore SIGAC.API/SIGAC.API.csproj -q
    
    # Build Release
    log "  • Building Release configuration..."
    dotnet build SIGAC.API/SIGAC.API.csproj -c Release -q
    
    # Publish
    log "  • Publishing..."
    dotnet publish SIGAC.API/SIGAC.API.csproj -c Release -o /tmp/sigac-publish -q
    
    log "✅ Backend build successful"
}

# Function to build frontend
build_frontend() {
    log "🎨 Building frontend..."
    
    cd "$PROJECT_DIR/sigac-frontend"
    
    # Install
    log "  • Installing dependencies..."
    npm ci 2>/dev/null || npm install
    
    # Build
    log "  • Building..."
    npm run build
    
    log "✅ Frontend build successful"
}

# Function to push to GitHub
push_to_github() {
    log "📤 Pushing to GitHub..."
    
    cd "$PROJECT_DIR"
    
    # Get latest changes
    git fetch origin main 2>/dev/null || true
    
    # Pull latest
    log "  • Pulling latest changes..."
    git pull origin main --ff-only 2>/dev/null || log_warning "  ⚠️ Pull failed (continuing...)"
    
    # Push
    log "  • Pushing commits..."
    git push origin main
    
    log "✅ Pushed to GitHub"
    log "   Render will auto-deploy backend (5-10 min)"
    log "   Vercel will auto-deploy frontend (2-5 min)"
}

# Function to display deployment status
display_status() {
    log ""
    log "📊 DEPLOYMENT STATUS"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    
    log "✅ Code committed and pushed to GitHub"
    log ""
    log "🚀 Auto-deployment will start:"
    log "   • Render Backend: https://dashboard.render.com"
    log "   • Vercel Frontend: https://vercel.com/dashboard"
    log ""
    log "📎 Check deployment status:"
    log "   • Backend Logs: https://dashboard.render.com/sigac-api/logs"
    log "   • Frontend Logs: https://vercel.com/sigac/deployments"
    log ""
    log "🌐 Production URLs:"
    log "   • API: https://sigac-api.onrender.com/api/health"
    log "   • Frontend: https://sigac.vercel.app"
    log ""
    log "📝 Deployment log saved to: $DEPLOY_LOG"
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

# Main logic
main() {
    deploy_type=${1:-all}
    
    log "Deployment type: $deploy_type"
    log "Starting deployment..."
    log ""
    
    # Step 1: Check prerequisites
    check_prerequisites
    
    # Step 2: Verify Git status
    verify_git_status
    
    # Step 3: Build
    case "$deploy_type" in
        backend)
            build_backend
            ;;
        frontend)
            build_frontend
            ;;
        all|*)
            build_backend
            build_frontend
            ;;
    esac
    
    log ""
    
    # Step 4: Push to GitHub
    push_to_github
    
    # Step 5: Display status
    display_status
    
    log ""
    log "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
}

# Run main
main "$@"
