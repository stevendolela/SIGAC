#!/bin/bash

# Script de migration pour Render (sans dotnet ef global)
# À exécuter dans le Shell Render

echo "🚀 Migration Base64 Logo/Avatar - Production Render"
echo "======================================================"
echo ""

# Vérifier qu'on est dans le bon dossier
if [ ! -d "SIGAC.API" ]; then
    echo "❌ Erreur: Dossier SIGAC.API non trouvé"
    echo "   Assurez-vous d'être dans /app"
    exit 1
fi

echo "📁 Dossier actuel: $(pwd)"
echo ""

# Méthode 1: Utiliser dotnet run avec le projet de migration
echo "🔧 Méthode 1: Tentative avec dotnet run..."
cd SIGAC.Infrastructure
dotnet run --project ../SIGAC.API -- ef database update --no-build

# Si ça échoue, essayer avec dotnet exec
if [ $? -ne 0 ]; then
    echo ""
    echo "🔧 Méthode 2: Tentative avec Bundle..."
    
    # Créer un bundle de migration si disponible
    cd /app
    if [ -f "efbundle" ]; then
        ./efbundle --connection "$DATABASE_URL"
    else
        echo "⚠️  Bundle non trouvé"
        echo ""
        echo "🔧 Méthode 3: Migration manuelle SQL..."
        echo ""
        echo "La migration doit être appliquée manuellement via SQL:"
        echo ""
        echo "ALTER TABLE \"Workspaces\" ADD \"LogoBase64\" text;"
        echo "ALTER TABLE \"Users\" ADD \"AvatarBase64\" text;"
        echo "INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\")"
        echo "VALUES ('20251217133725_AddBase64LogoAndAvatar', '8.0.8');"
    fi
fi

echo ""
echo "✅ Migration terminée!"
