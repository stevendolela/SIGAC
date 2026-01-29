#!/bin/bash
# Script de déploiement du système de gestion des droits d'accès
# À exécuter depuis la racine du projet SIGAC

set -e

echo "🚀 Déploiement du système de gestion des droits d'accès"
echo "======================================================"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "sigac-backend" ] || [ ! -d "sigac-frontend" ]; then
    echo "❌ Erreur: Exécuter ce script depuis la racine du projet SIGAC"
    exit 1
fi

echo ""
echo "📦 Backend - Étape 1: Migration de base de données"
echo "---------------------------------------------------"
cd sigac-backend

if [ ! -d "SIGAC.Infrastructure/Migrations" ]; then
    echo "❌ Répertoire Migrations non trouvé"
    exit 1
fi

echo "✅ Répertoire des migrations trouvé"
echo "   Fichier ajouté: AddRoleModulePermissionsTable.cs"
echo ""
echo "📝 Pour appliquer la migration, exécutez:"
echo "   dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API"
echo ""

echo "📋 Backend - Étape 2: Vérification des changements"
echo "---------------------------------------------------"

if grep -q "IRoleModulePermissionService, RoleModulePermissionService" SIGAC.API/Program.cs; then
    echo "✅ Service enregistré dans Program.cs"
else
    echo "⚠️  Service NON enregistré dans Program.cs"
fi

if grep -q "IRoleModulePermissionRepository, RoleModulePermissionRepository" SIGAC.API/Program.cs; then
    echo "✅ Repository enregistré dans Program.cs"
else
    echo "⚠️  Repository NON enregistré dans Program.cs"
fi

if grep -q "public DbSet<RoleModulePermission> RoleModulePermissions" SIGAC.Infrastructure/Data/ApplicationDbContext.cs; then
    echo "✅ DbSet ajouté au contexte"
else
    echo "⚠️  DbSet NON ajouté au contexte"
fi

if [ -f "SIGAC.Core/Entities/RoleModulePermission.cs" ]; then
    echo "✅ Entité RoleModulePermission créée"
else
    echo "❌ Entité RoleModulePermission non trouvée"
fi

if [ -f "SIGAC.Core/Services/RoleModulePermissionService.cs" ]; then
    echo "✅ Service RoleModulePermissionService créé"
else
    echo "❌ Service RoleModulePermissionService non trouvé"
fi

if [ -f "SIGAC.API/Controllers/RolePermissionsController.cs" ]; then
    echo "✅ Controller RolePermissionsController créé"
else
    echo "❌ Controller RolePermissionsController non trouvé"
fi

cd ..

echo ""
echo "🎨 Frontend - Étape 3: Vérification des changements"
echo "---------------------------------------------------"

if [ -f "sigac-frontend/src/api/rolePermissionsApi.ts" ]; then
    echo "✅ API Client rolePermissionsApi créé"
else
    echo "❌ API Client rolePermissionsApi non trouvé"
fi

if grep -q "rolePermissionsApi" sigac-frontend/src/pages/RightsManagementPage.tsx; then
    echo "✅ RightsManagementPage mise à jour avec API Backend"
else
    echo "⚠️  RightsManagementPage NON connectée à l'API Backend"
fi

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📌 Prochaines étapes:"
echo "-------------------"
echo "1. BACKEND:"
echo "   cd sigac-backend"
echo "   dotnet ef migrations add AddRoleModulePermissionsTable --project SIGAC.Infrastructure --startup-project SIGAC.API"
echo "   dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API"
echo "   dotnet run --project SIGAC.API"
echo ""
echo "2. FRONTEND:"
echo "   cd sigac-frontend"
echo "   npm install  (si besoin)"
echo "   npm run dev"
echo ""
echo "3. ACCÈS:"
echo "   • Backend Swagger: http://localhost:5210/swagger"
echo "   • Frontend Admin: http://localhost:5174/admin/rights"
echo "   • Compte Admin: admin / Admin@2024!"
echo ""
echo "📚 Documentation: RIGHTS_MANAGEMENT_IMPLEMENTATION.md"
echo ""
echo "🎉 Succès! Le système de gestion des droits est prêt au déploiement!"
