$ConnectionString = "Host=dpg-d4obq0a4i8rc73f06gl0-a.frankfurt-postgres.render.com;Port=5432;Database=postgresql_sigac_e1f4;Username=postgresql_sigac_e1f4_user;Password=wboMdsAzEhwVXP6nHZl2ZHO0V0Hhdzqe;SSL Mode=Require"

# Charger les assemblies .NET
Add-Type -AssemblyName "System.Data"
[Reflection.Assembly]::LoadWithPartialName("Npgsql") | Out-Null

Write-Host "[*] Conectando a Render PostgreSQL..." -ForegroundColor Cyan

try {
    # Lire le script SQL
    $SqlScript = Get-Content "apply-multitenant.sql" -Raw
    
    # Creer la connection
    $connection = New-Object Npgsql.NpgsqlConnection($ConnectionString)
    $connection.Open()
    
    Write-Host "[OK] Connecte a PostgreSQL Render" -ForegroundColor Green
    
    # Parser et executer chaque statement
    $statements = $SqlScript -split ";" | Where-Object { $_ -match '\S' }
    $count = 0
    
    foreach ($statement in $statements) {
        $trimmed = $statement.Trim()
        if ($trimmed.StartsWith("--") -or $trimmed -eq "") { continue }
        
        try {
            $command = $connection.CreateCommand()
            $command.CommandText = $trimmed
            $command.CommandTimeout = 60
            $command.ExecuteNonQuery() | Out-Null
            $count++
            Write-Host "  [OK] Statement $count execute" -ForegroundColor Green
        }
        catch {
            Write-Host "  [WARNING] $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    $connection.Close()
    Write-Host ""
    Write-Host "[SUCCESS] $count statements ejecutes!" -ForegroundColor Green
    Write-Host "[INFO] Tables multi-tenant creees sur Render" -ForegroundColor Cyan
}
catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
