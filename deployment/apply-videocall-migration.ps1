# Script PowerShell pour appliquer la migration VideoCall sur Render PostgreSQL
# Date: 2026-01-16

Write-Host "📹 Application de la migration VideoCall" -ForegroundColor Cyan
Write-Host ""

# Vérifier si psql est installé
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlPath) {
    Write-Host "❌ psql n'est pas installé!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions:" -ForegroundColor Yellow
    Write-Host "1. Installer PostgreSQL: https://www.postgresql.org/download/windows/"
    Write-Host "2. Ou utiliser l'interface web: https://dashboard.render.com"
    Write-Host "3. Ou utiliser DBeaver/pgAdmin"
    Write-Host ""
    exit 1
}

Write-Host "✅ psql trouvé: $($psqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Connection string (masquer le mot de passe dans l'affichage)
$connectionString = "postgresql://postgresql_sigac_e1f4_user:wboMdsAzEhwVXP6nHZl2ZHO0V0Hhdzqe@dpg-d4obq0a4i8rc73f06gl0-a.frankfurt-postgres.render.com/postgresql_sigac_e1f4"
$displayConnection = "postgresql://postgresql_sigac_e1f4_user:***@dpg-d4obq0a4i8rc73f06gl0-a.frankfurt-postgres.render.com/postgresql_sigac_e1f4"

Write-Host "🔗 Connexion à: $displayConnection" -ForegroundColor Cyan
Write-Host ""

# Chemin du script SQL
$scriptPath = Join-Path $PSScriptRoot "apply-videocall-migration.sql"

if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Fichier SQL introuvable: $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Lecture du script: apply-videocall-migration.sql" -ForegroundColor Cyan
Write-Host ""

# Exécuter la migration
Write-Host "⏳ Exécution de la migration..." -ForegroundColor Yellow
Write-Host ""

try {
    # Exécuter via psql
    $env:PGPASSWORD = "wboMdsAzEhwVXP6nHZl2ZHO0V0Hhdzqe"
    $result = psql "$connectionString" -f "$scriptPath" 2>&1
    
    # Afficher le résultat
    $result | ForEach-Object {
        if ($_ -match "✅") {
            Write-Host $_ -ForegroundColor Green
        } elseif ($_ -match "⚠️") {
            Write-Host $_ -ForegroundColor Yellow
        } elseif ($_ -match "❌") {
            Write-Host $_ -ForegroundColor Red
        } else {
            Write-Host $_
        }
    }
    
    Write-Host ""
    Write-Host "✅ Migration appliquée avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "1. Tester l'API: https://sigac-api.onrender.com/swagger" -ForegroundColor White
    Write-Host "2. Vérifier les endpoints /api/videocalls/*" -ForegroundColor White
    Write-Host "3. Tester l'appel vidéo sur https://taajii.fr" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'application de la migration:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solutions alternatives:" -ForegroundColor Yellow
    Write-Host "1. Utiliser DBeaver ou pgAdmin pour exécuter le SQL manuellement" -ForegroundColor White
    Write-Host "2. Utiliser Render Shell: https://dashboard.render.com" -ForegroundColor White
    Write-Host "   - Ouvrir Shell sur sigac-api" -ForegroundColor White
    Write-Host "   - Exécuter: dotnet ef database update" -ForegroundColor White
    Write-Host ""
    exit 1
} finally {
    # Nettoyer la variable d'environnement
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
