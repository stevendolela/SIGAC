#!/bin/bash

echo "🚀 Démarrage de SIGAC..."

# Démarrer PostgreSQL
echo "📦 Démarrage de PostgreSQL..."
docker-compose up -d

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
sleep 5

# Vérifier PostgreSQL
if docker-compose ps | grep -q "healthy"; then
    echo "✅ PostgreSQL est prêt"
else
    echo "⚠️  PostgreSQL n'est pas encore prêt. Attendez quelques secondes..."
fi

echo ""
echo "📝 Prochaines étapes:"
echo "1. Terminal 1: cd sigac-backend && dotnet run --project SIGAC.API"
echo "2. Terminal 2: cd sigac-frontend && npm run dev"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo "   Swagger:  http://localhost:5000/swagger"
