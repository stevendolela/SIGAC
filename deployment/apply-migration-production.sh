#!/bin/bash

# Script pour appliquer la migration Base64 Logo/Avatar en production
# À exécuter dans le Shell Render (Dashboard → Shell)

echo "🔍 Vérification de la connexion à la base de données..."
dotnet ef database update --list --no-build --startup-project SIGAC.API

echo ""
echo "📋 Migrations en attente:"
echo ""

echo "🚀 Application de la migration AddBase64LogoAndAvatar..."
dotnet ef database update --no-build --startup-project SIGAC.API

echo ""
echo "✅ Migration appliquée avec succès!"
echo ""
echo "🔍 Vérification des colonnes créées..."
echo "   - Workspaces.LogoBase64"
echo "   - Users.AvatarBase64"
echo ""
echo "✨ Votre base de données est maintenant à jour!"
