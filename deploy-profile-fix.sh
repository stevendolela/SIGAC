#!/bin/bash

# Deploy Profile Update Fix to Production
# This script pushes the fix to main, triggering auto-deployment

set -e

echo "🚀 DEPLOYING PROFILE UPDATE FIX TO PRODUCTION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check git status
echo "📋 Checking git status..."
git status --short

echo ""
echo "📝 Last commit:"
git log -1 --oneline

echo ""
echo "🔍 Diff to be pushed:"
git log -1 --stat

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  READY TO DEPLOY?"
echo ""
echo "This will:"
echo "  1. Push changes to origin/main"
echo "  2. Trigger Vercel frontend deployment"
echo "  3. Trigger Render backend deployment"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Pushing to origin/main..."
    git push origin main
    
    echo ""
    echo "✅ DEPLOYMENT INITIATED!"
    echo ""
    echo "📊 Monitor deployments:"
    echo "  Frontend: https://vercel.com/dashboard"
    echo "  Backend:  https://render.com/dashboard"
    echo ""
    echo "🌍 After deployment (~2-3 minutes):"
    echo "  Frontend: https://taajii.fr"
    echo "  API Docs: https://sigac-api.onrender.com/swagger"
    echo ""
    echo "✨ Test profile update in production"
else
    echo ""
    echo "❌ Deployment cancelled"
    exit 1
fi
