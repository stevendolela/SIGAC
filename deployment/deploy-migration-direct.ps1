# Script PowerShell pour appliquer la migration directement via .NET
# Sans besoin de psql

Add-Type -AssemblyName System.Data

Write-Host "📹 Application directe de la migration VideoCall" -ForegroundColor Cyan
Write-Host ""

$connectionString = "Host=dpg-d4obq0a4i8rc73f06gl0-a.frankfurt-postgres.render.com;Port=5432;Database=postgresql_sigac_e1f4;Username=postgresql_sigac_e1f4_user;Password=wboMdsAzEhwVXP6nHZl2ZHO0V0Hhdzqe;SSL Mode=Require;Trust Server Certificate=true"

$sql = @"
-- Créer la table VideoCalls
CREATE TABLE IF NOT EXISTS "VideoCalls" (
    "Id" uuid NOT NULL,
    "InitiatorId" uuid NOT NULL,
    "ReceiverId" uuid NOT NULL,
    "ConversationId" uuid NULL,
    "GroupId" uuid NULL,
    "Status" integer NOT NULL,
    "StartedAt" timestamp with time zone NOT NULL,
    "EndedAt" timestamp with time zone NULL,
    "DurationSeconds" integer NULL,
    "SignalingData" text NULL,
    CONSTRAINT "PK_VideoCalls" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_VideoCalls_ChatConversations_ConversationId" FOREIGN KEY ("ConversationId") 
        REFERENCES "ChatConversations" ("Id"),
    CONSTRAINT "FK_VideoCalls_ChatGroups_GroupId" FOREIGN KEY ("GroupId") 
        REFERENCES "ChatGroups" ("Id"),
    CONSTRAINT "FK_VideoCalls_Users_InitiatorId" FOREIGN KEY ("InitiatorId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_VideoCalls_Users_ReceiverId" FOREIGN KEY ("ReceiverId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_VideoCalls_ConversationId" ON "VideoCalls" ("ConversationId");
CREATE INDEX IF NOT EXISTS "IX_VideoCalls_GroupId" ON "VideoCalls" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_VideoCalls_InitiatorId" ON "VideoCalls" ("InitiatorId");
CREATE INDEX IF NOT EXISTS "IX_VideoCalls_ReceiverId" ON "VideoCalls" ("ReceiverId");
CREATE INDEX IF NOT EXISTS "IX_VideoCalls_Status" ON "VideoCalls" ("Status");

ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "Status" integer NOT NULL DEFAULT 0;

SELECT 'Migration completed successfully!' as result;
"@

try {
    Write-Host "🔗 Connexion à la base de données..." -ForegroundColor Yellow
    
    # Télécharger Npgsql si nécessaire
    if (-not (Test-Path "$PSScriptRoot\Npgsql.dll")) {
        Write-Host "📦 Téléchargement de Npgsql..." -ForegroundColor Yellow
        $npgsqlUrl = "https://www.nuget.org/api/v2/package/Npgsql/8.0.1"
        $zipPath = "$PSScriptRoot\npgsql.zip"
        Invoke-WebRequest -Uri $npgsqlUrl -OutFile $zipPath
        Expand-Archive -Path $zipPath -DestinationPath "$PSScriptRoot\npgsql" -Force
        Copy-Item "$PSScriptRoot\npgsql\lib\net8.0\*.dll" $PSScriptRoot -Force
        Remove-Item $zipPath -Force
        Remove-Item "$PSScriptRoot\npgsql" -Recurse -Force
        Write-Host "✅ Npgsql installé" -ForegroundColor Green
    }
    
    Add-Type -Path "$PSScriptRoot\Npgsql.dll"
    
    $connection = New-Object Npgsql.NpgsqlConnection($connectionString)
    $connection.Open()
    
    Write-Host "✅ Connecté!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ Exécution de la migration..." -ForegroundColor Yellow
    
    $command = $connection.CreateCommand()
    $command.CommandText = $sql
    $command.CommandTimeout = 60
    
    $reader = $command.ExecuteReader()
    
    while ($reader.Read()) {
        Write-Host "✅ $($reader[0])" -ForegroundColor Green
    }
    
    $reader.Close()
    $connection.Close()
    
    Write-Host ""
    Write-Host "✅ Migration appliquée avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 La table VideoCalls est maintenant créée en production!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🧪 Testez maintenant sur https://taajii.fr" -ForegroundColor White
    Write-Host "   1. Rechargez la page (Ctrl+F5)" -ForegroundColor White
    Write-Host "   2. Ouvrez une conversation" -ForegroundColor White
    Write-Host "   3. Cliquez sur le bouton 📹" -ForegroundColor White
    Write-Host "   4. L'appel devrait s'initier correctement!" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Essayez plutôt via Render Shell:" -ForegroundColor Yellow
    Write-Host "   1. https://dashboard.render.com" -ForegroundColor White
    Write-Host "   2. Cliquez sur sigac-api > Shell" -ForegroundColor White
    Write-Host "   3. Exécutez: dotnet ef database update" -ForegroundColor White
    Write-Host ""
    exit 1
}
"@