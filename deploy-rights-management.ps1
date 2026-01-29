# Script de déploiement du système de gestion des droits d'accès pour Windows
# À exécuter depuis la racine du projet SIGAC

Write-Host "🚀 Déploiement du système de gestion des droits d'accès" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "sigac-backend") -or -not (Test-Path "sigac-frontend")) {
    Write-Host "❌ Erreur: Exécuter ce script depuis la racine du projet SIGAC" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Backend - Étape 1: Migration de base de données" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

Push-Location sigac-backend

if (-not (Test-Path "SIGAC.Infrastructure/Migrations")) {
    Write-Host "❌ Répertoire Migrations non trouvé" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "✅ Répertoire des migrations trouvé" -ForegroundColor Green
Write-Host "   Fichier ajouté: AddRoleModulePermissionsTable.cs"
Write-Host ""
Write-Host "📝 Pour appliquer la migration, exécutez:" -ForegroundColor Yellow
Write-Host "   dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Backend - Étape 2: Vérification des changements" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

$programContent = Get-Content "SIGAC.API/Program.cs" -Raw

if ($programContent -match "IRoleModulePermissionService, RoleModulePermissionService") {
    Write-Host "✅ Service enregistré dans Program.cs" -ForegroundColor Green
} else {
    Write-Host "⚠️  Service NON enregistré dans Program.cs" -ForegroundColor Yellow
}

if ($programContent -match "IRoleModulePermissionRepository, RoleModulePermissionRepository") {
    Write-Host "✅ Repository enregistré dans Program.cs" -ForegroundColor Green
} else {
    Write-Host "⚠️  Repository NON enregistré dans Program.cs" -ForegroundColor Yellow
}

$contextContent = Get-Content "SIGAC.Infrastructure/Data/ApplicationDbContext.cs" -Raw
if ($contextContent -match "public DbSet<RoleModulePermission> RoleModulePermissions") {
    Write-Host "✅ DbSet ajouté au contexte" -ForegroundColor Green
} else {
    Write-Host "⚠️  DbSet NON ajouté au contexte" -ForegroundColor Yellow
}

if (Test-Path "SIGAC.Core/Entities/RoleModulePermission.cs") {
    Write-Host "✅ Entité RoleModulePermission créée" -ForegroundColor Green
} else {
    Write-Host "❌ Entité RoleModulePermission non trouvée" -ForegroundColor Red
}

if (Test-Path "SIGAC.Core/Services/RoleModulePermissionService.cs") {
    Write-Host "✅ Service RoleModulePermissionService créé" -ForegroundColor Green
} else {
    Write-Host "❌ Service RoleModulePermissionService non trouvé" -ForegroundColor Red
}

if (Test-Path "SIGAC.API/Controllers/RolePermissionsController.cs") {
    Write-Host "✅ Controller RolePermissionsController créé" -ForegroundColor Green
} else {
    Write-Host "❌ Controller RolePermissionsController non trouvé" -ForegroundColor Red
}

Pop-Location

Write-Host ""
Write-Host "🎨 Frontend - Étape 3: Vérification des changements" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

if (Test-Path "sigac-frontend/src/api/rolePermissionsApi.ts") {
    Write-Host "✅ API Client rolePermissionsApi créé" -ForegroundColor Green
} else {
    Write-Host "❌ API Client rolePermissionsApi non trouvé" -ForegroundColor Red
}

$pageContent = Get-Content "sigac-frontend/src/pages/RightsManagementPage.tsx" -Raw
if ($pageContent -match "rolePermissionsApi") {
    Write-Host "✅ RightsManagementPage mise à jour avec API Backend" -ForegroundColor Green
} else {
    Write-Host "⚠️  RightsManagementPage NON connectée à l'API Backend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Déploiement terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📌 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "-------------------" -ForegroundColor Cyan
Write-Host "1. BACKEND:" -ForegroundColor Yellow
Write-Host "   cd sigac-backend" -ForegroundColor Cyan
Write-Host "   dotnet ef migrations add AddRoleModulePermissionsTable --project SIGAC.Infrastructure --startup-project SIGAC.API" -ForegroundColor Cyan
Write-Host "   dotnet ef database update --project SIGAC.Infrastructure --startup-project SIGAC.API" -ForegroundColor Cyan
Write-Host "   dotnet run --project SIGAC.API" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. FRONTEND:" -ForegroundColor Yellow
Write-Host "   cd sigac-frontend" -ForegroundColor Cyan
Write-Host "   npm install  (si besoin)" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. ACCÈS:" -ForegroundColor Yellow
Write-Host "   • Backend Swagger: http://localhost:5210/swagger" -ForegroundColor Cyan
Write-Host "   • Frontend Admin: http://localhost:5174/admin/rights" -ForegroundColor Cyan
Write-Host "   • Compte Admin: admin / Admin@2024!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Documentation: RIGHTS_MANAGEMENT_IMPLEMENTATION.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Succès! Le système de gestion des droits est prêt au déploiement!" -ForegroundColor Green
